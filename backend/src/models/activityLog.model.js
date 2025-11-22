import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project", 
      required: true 
    },

    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    taskId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Task", 
      required: false 
    },
  
    action: { 
      type: String, 
      required: true 
    },
 
    content: { 
      type: String, 
      required: true 
    }
  },
  { timestamps: true } 
);

export default mongoose.model("ActivityLog", activityLogSchema);