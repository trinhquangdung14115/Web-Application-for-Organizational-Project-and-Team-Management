import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    checkInTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkInIp: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["PRESENT", "LATE", "ABSENT"],
      default: "PRESENT",
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Index to quickly find today's attendance for a user
attendanceSchema.index({ userId: 1, checkInTime: 1 });
attendanceSchema.index({ projectId: 1, checkInTime: 1 });

export default mongoose.model("Attendance", attendanceSchema);
