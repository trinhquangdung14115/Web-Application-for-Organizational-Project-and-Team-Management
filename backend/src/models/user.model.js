import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const USER_ROLES = ["Admin", "Manager", "Member"];

// export ROLES as an object for imports like `ROLES.ADMIN` used in routes/middlewares
export const ROLES = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String, trim: true },
    phoneNumber: { type: String, trim: true, match: [/^[0-9+\-() ]*$/, "Invalid phone number format"] },
    role: { type: String, enum: USER_ROLES, default: "Member", index: true },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
      default: "ACTIVE",
      index: true,
    },
    // Organization fields
    currentOrganizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    organizations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);