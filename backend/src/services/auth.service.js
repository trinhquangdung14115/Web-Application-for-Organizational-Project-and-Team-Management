/**
 * Auth Service Layer
 * Business logic for authentication
 * 
 * REFACTORED (26/12/2025):
 * - Password hashing: Chỉ dùng bcrypt (qua User model pre-save hook)
 * - Login optimization: Chỉ update DB khi currentOrganizationId thực sự thay đổi
 * - Removed: Import bcrypt thừa (model đã tự động hash)
 * - Fixed: createUser() bug với session parameter không tồn tại
 */

import User from "../models/user.model.js";
import Organization from "../models/organization.model.js";
import OrganizationMember from "../models/organizationMember.model.js";
import { signToken } from "../utils/jwt.js";
import crypto from "crypto";
import { sendPasswordResetEmail, sendWelcomeEmail } from "./email.service.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Create new user account
 */
export const createUser = async (name, email, password) => {
  // Check if email already exists
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error("EMAIL_EXISTS");
  }

  // Determine role (first user is Admin)
  const count = await User.countDocuments();
  const role = count === 0 ? "Admin" : "Member";

  // Create user (Model pre-save hook sẽ tự động hash password bằng bcrypt)
  const user = await User.create({ name, email, password, role });

  // Generate token (no organizationId for first user/admin)
  const token = signToken({ 
    sub: user._id.toString(), 
    role: user.role,
    organizationId: null
  });

  return {
    token,
    user: toPublicUser(user),
  };
};

/**
 * Login user with email/password
 */
export const loginUser = async (email, password) => {
  // Find user and include password field
  const user = await User.findOne({ email, deletedAt: null }).select("+password");

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Check if user is blocked
  if (user.status === "BLOCKED") {
    throw new Error("ACCOUNT_BLOCKED");
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Find user's organizations
  const orgMembers = await OrganizationMember.find({
    userId: user._id,
    deletedAt: null,
    status: "ACTIVE",
  })
    .populate("organizationId")
    .sort({ createdAt: -1 })
    .limit(1);

  let currentOrganization = null;
  let organizationId = null;

  // If user has organizations, set current to most recent
  if (orgMembers.length > 0 && orgMembers[0].organizationId) {
    currentOrganization = orgMembers[0].organizationId;

    // Validate organization status (BE1 Requirement)
    if (currentOrganization.status === 'INACTIVE') {
      throw new Error("ORGANIZATION_INACTIVE");
    }
    if (currentOrganization.deletedAt) {
      throw new Error("ORGANIZATION_DELETED");
    }

    // CHỈ update currentOrganizationId nếu THỰC SỰ THAY ĐỔI (tránh query DB thừa)
    const newOrgId = currentOrganization._id;
    const currentOrgIdStr = user.currentOrganizationId?.toString();
    const newOrgIdStr = newOrgId.toString();
    
    if (currentOrgIdStr !== newOrgIdStr) {
      user.currentOrganizationId = newOrgId;
      await user.save();
    }
    
    organizationId = newOrgIdStr;
  }

  // Generate token with organizationId
  const token = signToken({ 
    sub: user._id.toString(), 
    role: user.role,
    organizationId
  });

  return {
    token,
    user: toPublicUser(user),
    organization: currentOrganization
      ? {
          _id: currentOrganization._id,
          name: currentOrganization.name,
          logo: currentOrganization.logo,
        }
      : null,
  };
};
/**
 * Handle Google OAuth login
 */
export const handleGoogleAuth = async (credential) => {
  // 1. Verify Google Token
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name, picture } = payload;

  // 2. Tìm User trong DB
  let user = await User.findOne({ email });
  let isNewUser = false;

  if (!user) {
    //  USER MỚI 
    isNewUser = true;
    
    const randomPassword = crypto.randomBytes(16).toString("hex");

    // Tạo User mới với organid là null
    user = await User.create({
      name,
      email,
      password: randomPassword,
      avatar: picture,
      role: "Member", 
      status: "ACTIVE",
      currentOrganizationId: null, // Chưa thuộc về nơi nào
      organizations: []
    });

    // Gửi email chào mừng (Optional)
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (err) {
      console.error("Email error:", err.message);
    }
  }

  //  Generate Token
  // Nếu user mới, organizationId sẽ là null. 

  const token = signToken({ 
    sub: user._id.toString(), 
    role: user.role,
    organizationId: user.currentOrganizationId?.toString() || null
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      currentOrganizationId: user.currentOrganizationId, // Trả về để FE check
    },
    isNewUser,
  };
};

/**
 * Change user password
 */
export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findOne({ _id: userId, deletedAt: null }).select("+password");

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new Error("INVALID_PASSWORD");
  }

  // Update  
  user.password = newPassword;
  await user.save();

  return { success: true };
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  const user = await User.findOne({ _id: userId, deletedAt: null });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // Update fields
  if (updates.avatar !== undefined) user.avatar = updates.avatar;
  if (updates.fullName !== undefined) user.name = updates.fullName.trim();
  if (updates.phoneNumber !== undefined) user.phoneNumber = updates.phoneNumber;

  await user.save();

  return toPublicUser(user);
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null });

  if (!user) {
    // Don't reveal if user exists
    return { success: true };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  // Save token to user
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send email
  await sendPasswordResetEmail(user.email, user.name, resetToken);

  return { success: true };
};

/**
 * Reset password with token
 */
export const resetUserPassword = async (token, newPassword) => {
  // Hash the token from URL
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with valid token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
    deletedAt: null,
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    throw new Error("INVALID_TOKEN");
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { success: true };
};

/**
 * Switch user's current organization
 */
export const switchOrganization = async (userId, organizationId) => {
  // Check if user is member of this organization
  const membership = await OrganizationMember.findOne({
    userId,
    organizationId,
    deletedAt: null,
    status: "ACTIVE",
  }).populate("organizationId");

  if (!membership) {
    throw new Error("NOT_ORGANIZATION_MEMBER");
  }

  const organization = membership.organizationId;

  // Validate organization status (BE1 Requirement)
  if (organization.status === 'INACTIVE') {
    throw new Error("ORGANIZATION_INACTIVE");
  }
  if (organization.deletedAt) {
    throw new Error("ORGANIZATION_DELETED");
  }

  // Update user's current organization
  const user = await User.findByIdAndUpdate(
    userId,
    { currentOrganizationId: organizationId },
    { new: true }
  );

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // Generate NEW token with new organizationId (BE1 Requirement)
  const newToken = signToken({ 
    sub: user._id.toString(), 
    role: user.role,
    organizationId: organizationId.toString()
  });

  return {
    token: newToken,
    user: toPublicUser(user),
    organization: {
      _id: organization._id,
      name: organization.name,
      logo: organization.logo,
    },
  };
};

/**
 * Create user WITH SESSION (for transaction)
 */
export async function createUserWithSession(name, email, password, session) {
  // Check if email exists
  const existingUser = await User.findOne({ email }).session(session);
  if (existingUser) {
    throw new Error("EMAIL_EXISTS");
  }

  // Create user with session
  const [user] = await User.create([{
    name,
    email,
    password: password,
    role: "Member", // Default, will be updated to Admin if creating org
    status: "ACTIVE",
  }], { session });

  // Generate token (temporary, will be regenerated with orgId later)
  const token = signToken({ 
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    organizationId: null
  });

  return {
    token,
    user: {
      id: user._id,
      _id: user._id, //  Both id and _id for compatibility
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}


/**
 * Helper: Convert user to public format
 */
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
    currentOrganizationId: u.currentOrganizationId, 
    organizations: u.organizations
  };
}
