import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project", 
      required: false, 
      index: true
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    action: { 
      type: String, 
      required: true 
    },
    entityType: {
      type: String,
      enum: ['PROJECT', 'TASK', 'MEMBER', 'COMMENT'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, 
      default: {}
    },
    content: { 
      type: String, 
      required: true 
    }
  },
  { timestamps: true } 
);

export default mongoose.model("ActivityLog", activityLogSchema);