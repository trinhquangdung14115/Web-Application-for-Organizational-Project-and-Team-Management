import User from "../models/user.model.js";
import { signToken } from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../services/email.service.js";
import * as authValidator from "../validators/auth.validator.js";
import * as authService from "../services/auth.service.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function toPublicUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    phoneNumber: u.phoneNumber,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

// POST /auth/signup
export async function signup(req, res, next) {
  try {
    // Validate request data
    const validation = authValidator.validateSignup(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: validation.errors[0],
      });
    }

    // Create user using service
    const { name, email, password } = req.body;
    const result = await authService.createUser(name, email, password);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        token: result.token,
        tokenType: "Bearer",
        user: result.user,
      },
    });
  } catch (err) {
    if (err.message === "EMAIL_EXISTS") {
      return res.status(409).json({
        success: false,
        error: "ConflictError",
        message: "Email already registered",
      });
    }
    next(err);
  }
}

// POST /auth/login
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
    const result = await authService.loginUser(email, password);

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        token: result.token,
        tokenType: "Bearer",
        user: result.user,
        organization: result.organization,
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
    return res.json({ success: true, data: { user: toPublicUser(user) } });
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

    return res.json({ success: true, message: "User role updated", data: { user: toPublicUser(user) } });
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
      req.user.sub,
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

