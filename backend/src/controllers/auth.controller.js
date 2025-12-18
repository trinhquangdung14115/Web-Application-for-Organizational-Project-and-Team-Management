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

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /auth/signup 
export async function signup(req, res, next) {
  try {
    // 1. Validate request data
    const validation = authValidator.validateSignup(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: validation.errors[0],
      });
    }

    const { name, email, password, inviteCode } = req.body;

    // 2. CHECK INVITE CODE TRƯỚC (Nếu có code thì check xem project có tồn tại không)
    let projectToJoin = null;
    if (inviteCode) {
        projectToJoin = await Project.findOne({
            inviteCode: inviteCode.toUpperCase().trim(),
            deletedAt: null
        });
        
        // Nếu nhập code lung tung thì báo lỗi luôn
        if (!projectToJoin) {
            return res.status(400).json({ 
                success: false, 
                error: "ValidationError", 
                message: "Invalid or expired invite code" 
            });
        }
    }

    // 3. Create user using service
    const result = await authService.createUser(name, email, password);
    const userId = result.user.id || result.user._id;

    // Get created user to update fields
    const user = await User.findById(userId);
    if (!user) throw new Error("USER_CREATION_FAILED");

    let finalOrganizationId;
    let finalOrgObj; // Để trả về response

    if (projectToJoin) {
        finalOrganizationId = projectToJoin.organizationId;
        finalOrgObj = await Organization.findById(finalOrganizationId);

        // A. Update User System Role -> MEMBER (Không phải Admin)
        user.currentOrganizationId = finalOrganizationId;
        user.organizations = [finalOrganizationId];
        user.role = "Member"; 
        await user.save();

        // B. Add vào OrganizationMember (Role: ORG_MEMBER)
        await OrganizationMember.create({
            userId: user._id,
            organizationId: finalOrganizationId,
            roleInOrganization: "ORG_MEMBER"
        });

        // C. Add vào ProjectMember (Role: Member)
        const existingPrjMem = await ProjectMember.findOne({ userId: user._id, projectId: projectToJoin._id });
        if (!existingPrjMem) {
            await ProjectMember.create({
                userId: user._id,
                projectId: projectToJoin._id,
                organizationId: finalOrganizationId,
                roleInProject: "Member",
                status: "ACTIVE"
            });
        }
    } 

    else {
        // Create default organization
        const newOrg = await Organization.create({
            name: `${name}'s Organization`,
            ownerId: user._id,
            status: 'ACTIVE',
            allowedIps: [],
            attendanceSettings: {
                enableIpCheck: true,
                standardCheckInHour: 9,
                standardCheckOutHour: 17,
                allowLateCheckIn: true,
                lateThresholdMinutes: 15
            }
        });

        finalOrganizationId = newOrg._id;
        finalOrgObj = newOrg;

        // Link user to organization
        user.currentOrganizationId = newOrg._id;
        user.organizations = [newOrg._id];
        user.role = "Admin"; 
        await user.save();

        // Bổ sung: Tạo OrganizationMember cho Admin luôn (để đồng bộ dữ liệu)
        await OrganizationMember.create({
            userId: user._id,
            organizationId: newOrg._id,
            roleInOrganization: "ORG_ADMIN"
        });
    }

    // 4. Generate Token
    const tokenPayload = {
      sub: user._id.toString(),    
      email: user.email,
      role: user.role,
      organizationId: finalOrganizationId.toString() 
    };
    const newToken = signToken(tokenPayload);

    // 5. Send welcome email (optional)
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailErr) {
      console.error("Failed to send welcome email:", emailErr);
    }

    // 6. Return response
    return res.status(201).json({
      success: true,
      message: projectToJoin ? "Joined project successfully" : "User and Organization created successfully",
      data: {
        token: newToken,
        tokenType: "Bearer",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          currentOrganizationId: finalOrganizationId,
          organizations: user.organizations,
          createdAt: user.createdAt,
        },
        organization: finalOrgObj
      },
    });

  } catch (err) {
    if (err.message === "EMAIL_EXISTS") {
      return res.status(409).json({ success: false, error: "ConflictError", message: "Email already registered" });
    }
    if (err.message === "USER_CREATION_FAILED") {
      return res.status(500).json({ success: false, error: "ServerError", message: "Failed to create user" });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    // Validate request data
    const validation = authValidator.validateLogin(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: validation.errors[0],
      });
    }

    // Login using service
    const { email, password } = req.body;
    const authResult = await authService.loginUser(email, password); 
    const publicUserId = authResult.user.id || authResult.user._id; 

    // Query lấy User gốc + các trường cần thiết
    const user = await User.findById(publicUserId).select('+currentOrganizationId +organizations');

    if (!user) {
         return res.status(401).json({ success: false, message: "User not found after login verification." });
    }
    if (!user.currentOrganizationId) {
        // Fallback: Nếu user cũ chưa có Org, có thể lấy Org đầu tiên trong list làm default
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

    
    // Get organization info (optional)
   const tokenPayload = {
      sub: user._id.toString(),    
      email: user.email,
      role: user.role,
      organizationId: user.currentOrganizationId.toString()
    };
    
    // Gọi hàm signToken từ utils
    const newToken = signToken(tokenPayload);

    // 5. Lấy thông tin Org để trả về FE
    const organization = await Organization.findById(user.currentOrganizationId)
        .select('name ownerId status plan createdAt');

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token: newToken,
        tokenType: "Bearer",
        user: authResult.user,
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

// POST /auth/google
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

    // Handle Google auth using service
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
// GET /auth/me
export async function me(req, res, next) {
  try {
    // verifyToken middleware attaches req.user
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: "AuthenticationError", message: "Unauthorized" });
    
    // Format user response
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
    
    return res.json({ success: true, data: { user: publicUser } });
  } catch (err) {
    next(err);
  }
}

// PUT /auth/:id/role  (Admin only)
export async function promoteRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    const newRole = role || "Manager";

    // validate role
    if (!Array.isArray(User.schema.path("role").enumValues) || !User.schema.path("role").enumValues.includes(newRole)) {
      // fallback: check common roles
      const allowed = ["Admin", "Manager", "Member"];
      if (!allowed.includes(newRole)) return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid role" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: "NotFoundError", message: "User not found" });

    user.role = newRole;
    await user.save();

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

    return res.json({ success: true, message: "User role updated", data: { user: publicUser } });
  } catch (err) {
    next(err);
  }
}

// POST /auth/change-password
export async function changePassword(req, res, next) {
  try {
    // Validate input
    const validation = authValidator.validateChangePassword(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: validation.errors.join(", "),
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Change password using service
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

/**
 * @desc    Update user profile
 * @route   PATCH /auth/profile
 * @access  Private
 */
export async function updateProfile(req, res, next) {
  try {
    // Validate input
    const validation = authValidator.validateUpdateProfile(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: validation.errors.join(", "),
      });
    }

    // Update profile using service
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

/**
 * @desc    Forgot Password - Send reset email
 * @route   POST /auth/forgot-password
 * @access  Public
 */
export async function forgotPassword(req, res, next) {
  try {
    // Validate input
    const validation = authValidator.validateForgotPassword(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: validation.errors.join(", "),
      });
    }

    const { email } = req.body;

    // Request password reset using service
    await authService.requestPasswordReset(email);

    // Always return success for security (don't reveal if user exists)
    return res.json({
      success: true,
      message:
        "If your email exists in our system, you will receive a password reset link shortly",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @desc    Reset Password with token
 * @route   POST /auth/reset-password
 * @access  Public
 */
export async function resetPassword(req, res, next) {
  try {
    // Validate input
    const validation = authValidator.validateResetPassword(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: validation.errors.join(", "),
      });
    }

    const { token, newPassword } = req.body;

    // Reset password using service
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
/**
 * @desc    Switch user's current organization
 * @route   POST /auth/switch-org
 * @access  Private
 */
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

    // Switch organization using service
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