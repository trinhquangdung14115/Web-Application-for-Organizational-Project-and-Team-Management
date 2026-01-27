import User from "../models/user.model.js";
import Organization from "../models/organization.model.js";
import Project from "../models/project.model.js";
import ProjectMember from "../models/projectMember.model.js";
import OrganizationMember from "../models/organizationMember.model.js";
import { signToken } from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../services/email.service.js";
import * as authValidator from "../validators/auth.validator.js";
import * as authService from "../services/auth.service.js";
import mongoose from "mongoose";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function signup(req, res, next) {
  const session = await mongoose.startSession();
  
  try {
    const validation = authValidator.validateSignup(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: validation.errors[0],
      });
    }

    const { name, email, password, inviteCode } = req.body;
    const plan = req.body.plan ? req.body.plan.toUpperCase() : "FREE";

    session.startTransaction();

    let projectToJoin = null;
    if (inviteCode) {
      projectToJoin = await Project.findOne({
        inviteCode: inviteCode.toUpperCase().trim(),
        deletedAt: null
      }).session(session); 
      
      if (!projectToJoin) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid or expired invite code" });
      }
      if (projectToJoin.isArchived) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: "ValidationError", message: "This project has been archived" });
      }
      if (projectToJoin.status === "INACTIVE") {
        await session.abortTransaction();
        return res.status(400).json({ success: false, error: "ValidationError", message: "This project is currently inactive" });
      }
    }

    const result = await authService.createUserWithSession(name, email, password, session);
    const userId = result.user.id || result.user._id;
    const userDoc = result.user;

    if (!userDoc) {
      await session.abortTransaction();
      throw new Error("USER_CREATION_FAILED");
    }

    let finalOrganizationId;
    let finalOrgData;
    let userRole;

    if (projectToJoin) {
      finalOrganizationId = projectToJoin.organizationId;
      const finalOrgObj = await Organization.findById(finalOrganizationId).session(session);

      if (!finalOrgObj || finalOrgObj.status === "INACTIVE") {
        await session.abortTransaction();
        return res.status(403).json({ success: false, error: "ForbiddenError", message: "Organization invalid or inactive" });
      }

      await User.findByIdAndUpdate(
        userId,
        { 
          currentOrganizationId: finalOrganizationId,
          organizations: [finalOrganizationId],
          role: "Member"
        },
        { session }
      );

      await OrganizationMember.create([{ 
        userId: userId, 
        organizationId: finalOrganizationId, 
        roleInOrganization: "ORG_MEMBER" 
      }], { session }); 
      
      const existingPrjMem = await ProjectMember.findOne({ 
        userId: userId, 
        projectId: projectToJoin._id 
      }).session(session);
      
      if (!existingPrjMem) {
        await ProjectMember.create([{ 
          userId: userId, 
          projectId: projectToJoin._id, 
          organizationId: finalOrganizationId, 
          roleInProject: "Member", 
          status: "PENDING" 
        }], { session }); 
      }

      finalOrgData = {
        id: finalOrgObj._id,
        name: finalOrgObj.name,
        ownerId: finalOrgObj.ownerId,
        status: finalOrgObj.status,
        plan: finalOrgObj.plan,
        createdAt: finalOrgObj.createdAt
      };

      userRole = "Member";
    } 
    else {
      const [newOrg] = await Organization.create([{
        name: `${name}'s Organization`,
        ownerId: userId,
        status: 'ACTIVE',
        plan: "FREE", 
        subscriptionStatus: 'INACTIVE',
        allowedIps: [],
        attendanceSettings: { 
          enableIpCheck: true, 
          standardCheckInHour: 9, 
          standardCheckOutHour: 17, 
          allowLateCheckIn: true, 
          lateThresholdMinutes: 15 
        }
      }], { session }); 

      finalOrganizationId = newOrg._id;

      await User.findByIdAndUpdate(
        userId,
        {
          currentOrganizationId: newOrg._id,
          organizations: [newOrg._id],
          role: "Admin"
        },
        { session }
      );

      await OrganizationMember.create([{ 
        userId: userId, 
        organizationId: newOrg._id, 
        roleInOrganization: "ORG_ADMIN" 
      }], { session }); 

      finalOrgData = {
        id: newOrg._id,
        name: newOrg.name,
        ownerId: newOrg.ownerId,
        status: newOrg.status,
        plan: newOrg.plan,
        createdAt: newOrg.createdAt
      };

      userRole = "Admin";
    }

    await session.commitTransaction();

    let paymentUrl = null;
    if (!projectToJoin && plan === "PREMIUM") {
      try {
        const sessionStripe = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          customer_email: email, 
          line_items: [{
            price_data: {
              currency: "usd",
              product_data: {
                name: "Premium Plan Subscription",
                description: "Unlock unlimited projects (Signup Upgrade)",
              },
              unit_amount: 2000, 
              recurring: { interval: "month" },
            },
            quantity: 1,
          }],
          mode: "subscription",
          success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
          metadata: {
            organizationId: finalOrganizationId.toString(),
            userId: userId.toString(),
            targetPlan: "PREMIUM"
          },
          subscription_data: {
            metadata: {
              organizationId: finalOrganizationId.toString(),
              userId: userId.toString(),
              targetPlan: "PREMIUM"
            }
          },
        });
        paymentUrl = sessionStripe.url;
      } catch (stripeError) {
        console.error("Stripe Session Creation Failed:", stripeError);
      }
    }

    const tokenPayload = { 
      sub: userId.toString(), 
      email: userDoc.email, 
      role: userRole, 
      organizationId: finalOrganizationId.toString() 
    };
    const newToken = signToken(tokenPayload);

    sendWelcomeEmail(userDoc.email, userDoc.name).catch(emailErr => {
      console.error("Failed to send welcome email:", emailErr);
    });

    return res.status(201).json({
      success: true,
      message: projectToJoin ? "Joined project successfully" : "User created successfully",
      paymentUrl,
      data: {
        token: newToken,
        tokenType: "Bearer",
        user: { 
          id: userId, 
          name: userDoc.name, 
          email: userDoc.email, 
          role: userRole, 
          currentOrganizationId: finalOrganizationId, 
          organizations: [finalOrganizationId], 
          createdAt: userDoc.createdAt 
        },
        organization: finalOrgData,
        ...(projectToJoin && { 
          project: { 
            id: projectToJoin._id, 
            name: projectToJoin.name, 
            code: projectToJoin.code 
          } 
        })
      },
    });

  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("[SIGNUP] Transaction failed:", err.message);
    
    if (err.message === "EMAIL_EXISTS") {
      return res.status(409).json({ 
        success: false, 
        error: "ConflictError", 
        message: "Email already registered" 
      });
    }
    if (err.message === "USER_CREATION_FAILED") {
      return res.status(500).json({ 
        success: false, 
        error: "ServerError", 
        message: "Failed to create user" 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: "ServerError", 
      message: err.message || "Signup failed." 
    });
  } finally {
    session.endSession();
  }
}

export async function login(req, res, next) {
  try {
    const validation = authValidator.validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: validation.errors[0],
      });
    }

    const { email, password } = req.body;
    const authResult = await authService.loginUser(email, password); 
    const publicUserId = authResult.user.id || authResult.user._id; 

    const user = await User.findById(publicUserId).select('+currentOrganizationId +organizations');

    if (!user) {
         return res.status(401).json({ success: false, message: "User not found after login verification." });
    }
    if (!user.currentOrganizationId) {
        if (user.organizations && user.organizations.length > 0) {
            user.currentOrganizationId = user.organizations[0];
            await User.findByIdAndUpdate(user._id, { currentOrganizationId: user.organizations[0] });
        } else {
             return res.status(403).json({
                success: false,
                error: "ForbiddenError",
                message: "User has no Organization linked. Please contact support.",
            });
        }
    }

   const tokenPayload = {
      sub: user._id.toString(),     
      email: user.email,
      role: user.role,
      organizationId: user.currentOrganizationId.toString()
    };
    
    const newToken = signToken(tokenPayload);

    const organization = await Organization.findById(user.currentOrganizationId)
        .select('name ownerId status plan createdAt');

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: newToken,
        tokenType: "Bearer",
        user: {
            ...authResult.user, 
            currentOrganizationId: user.currentOrganizationId,
            organizations: user.organizations
        },
        organization: organization
      },
    });
  } catch (err) {
    if (err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        success: false,
        error: "AuthenticationError",
        message: "Invalid email or password",
      });
    }
    if (err.message === "ACCOUNT_BLOCKED") {
      return res.status(403).json({
        success: false,
        error: "ForbiddenError",
        message: "Your account has been blocked",
      });
    }
    if (err.message === "ORGANIZATION_INACTIVE") {
      return res.status(403).json({
        success: false,
        error: "ForbiddenError",
        message: "Your organization has been deactivated. Please contact support.",
      });
    }
    if (err.message === "ORGANIZATION_DELETED") {
      return res.status(403).json({
        success: false,
        error: "ForbiddenError",
        message: "Your organization has been deleted.",
      });
    }
    next(err);
  }
}

export async function handleGoogleLogin(req, res, next) {
    try {
        const { credential } = req.body;
        if (!credential) {
          return res.status(400).json({
            success: false,
            error: "ValidationError",
            message: "No credential provided",
          });
        }
    
        const result = await authService.handleGoogleAuth(credential);
    
        return res.status(200).json({
          success: true,
          message: "Google login successful",
          data: {
            token: result.token,
            tokenType: "Bearer",
            user: result.user,
          },
        });
      } catch (err) {
        console.error("Google Auth Error:", err);
        return res.status(400).json({
          success: false,
          error: "AuthenticationError",
          message: "Google authentication failed",
        });
      }
}

export async function me(req, res, next) {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ success: false, error: "AuthenticationError", message: "Unauthorized" });
        
        let organization = null;
        if (user.currentOrganizationId) {
            organization = await Organization.findById(user.currentOrganizationId)
              .select('name ownerId status plan createdAt subscriptionStatus subscriptionExpiredAt subscriptionId');
        }

        const publicUser = {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          phoneNumber: user.phoneNumber,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
        
        return res.json({ success: true, data: { user: publicUser, organization } });
      } catch (err) {
        next(err);
      }
}

export async function promoteRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    const newRole = role || "Manager";

    const allowed = ["Admin", "Manager", "Member"];
    if (!allowed.includes(newRole)) {
        return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid role" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: "NotFoundError", message: "User not found" });

    user.role = newRole;
    await user.save();

    if (user.currentOrganizationId) {
        let projectRole = newRole;

        await ProjectMember.updateMany(
            { 
                userId: user._id, 
                organizationId: user.currentOrganizationId 
            },
            { 
                $set: { roleInProject: projectRole } 
            }
        );
        console.log(`[SYNC] Role synced: User ${user.email} is now ${projectRole} in all projects.`);
    }
    
    const publicUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    return res.json({ success: true, message: "User role updated and synced", data: { user: publicUser } });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
    try {
        const validation = authValidator.validateChangePassword(req.body);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: "ValidationError",
            message: validation.errors.join(", "),
          });
        }
    
        const { currentPassword, newPassword } = req.body;
    
        await authService.changeUserPassword(
          req.user._id,
          currentPassword,
          newPassword
        );
    
        return res.json({
          success: true,
          message: "Password changed successfully",
        });
      } catch (err) {
        if (err.message === "USER_NOT_FOUND") {
          return res.status(404).json({
            success: false,
            error: "NotFoundError",
            message: "User not found",
          });
        }
        if (err.message === "INVALID_PASSWORD") {
          return res.status(401).json({
            success: false,
            error: "AuthenticationError",
            message: "Current password is incorrect",
          });
        }
        next(err);
      }
}

export async function updateProfile(req, res, next) {
    try {
        const validation = authValidator.validateUpdateProfile(req.body);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: "ValidationError",
            message: validation.errors.join(", "),
          });
        }
    
        const updatedUser = await authService.updateUserProfile(
          req.user._id,
          req.body
        );
    
        return res.json({
          success: true,
          message: "Profile updated successfully",
          data: updatedUser,
        });
      } catch (err) {
        if (err.message === "USER_NOT_FOUND") {
          return res.status(404).json({
            success: false,
            error: "NotFoundError",
            message: "User not found",
          });
        }
        next(err);
      }
}

export async function forgotPassword(req, res, next) {
    try {
        const validation = authValidator.validateForgotPassword(req.body);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: "ValidationError",
            message: validation.errors.join(", "),
          });
        }
    
        const { email } = req.body;
    
        await authService.requestPasswordReset(email);
    
        return res.json({
          success: true,
          message:
            "If your email exists in our system, you will receive a password reset link shortly",
        });
      } catch (err) {
        next(err);
      }
}

export async function resetPassword(req, res, next) {
    try {
        const validation = authValidator.validateResetPassword(req.body);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: "ValidationError",
            message: validation.errors.join(", "),
          });
        }
    
        const { token, newPassword } = req.body;
    
        await authService.resetUserPassword(token, newPassword);
    
        return res.json({
          success: true,
          message:
            "Password reset successfully. You can now login with your new password",
        });
      } catch (err) {
        if (err.message === "INVALID_TOKEN") {
          return res.status(400).json({
            success: false,
            error: "ValidationError",
            message: "Invalid or expired reset token",
          });
        }
        next(err);
      }
}

export async function switchOrg(req, res, next) {
    try {
        const { organizationId } = req.body;
    
        if (!organizationId) {
          return res.status(400).json({
            success: false,
            error: "ValidationError",
            message: "Organization ID is required",
          });
        }
    
        const result = await authService.switchOrganization(
          req.user._id,
          organizationId
        );
    
        return res.json({
          success: true,
          message: "Organization switched successfully",
          data: {
            token: result.token,
            tokenType: "Bearer",
            user: result.user,
            organization: result.organization,
          },
        });
      } catch (err) {
        if (err.message === "NOT_ORGANIZATION_MEMBER") {
          return res.status(403).json({
            success: false,
            error: "ForbiddenError",
            message: "You are not a member of this organization",
          });
        }
        if (err.message === "ORGANIZATION_INACTIVE") {
          return res.status(403).json({
            success: false,
            error: "ForbiddenError",
            message: "This organization has been deactivated. Please contact support.",
          });
        }
        if (err.message === "ORGANIZATION_DELETED") {
          return res.status(403).json({
            success: false,
            error: "ForbiddenError",
            message: "This organization has been deleted.",
          });
        }
        if (err.message === "USER_NOT_FOUND") {
          return res.status(404).json({
            success: false,
            error: "NotFoundError",
            message: "User not found",
          });
        }
        next(err);
      }
}