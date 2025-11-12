import mongoose from "mongoose";
// t nhét base tạo script
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED", "COMPLETED"], // Các trạng thái dự án
      default: "ACTIVE",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Link tới bảng User
      required: true,
    },
    managerId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "User",
    },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["Manager", "Member"], default: "Member" }
      }
    ]
  },
  { timestamps: true } // Tự động tạo createdAt, updatedAt
);

const Project = mongoose.model("Project", projectSchema);

export default Project;