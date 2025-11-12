import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project", 
      required: true 
    },
    parentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Task", 
      default: null 
    },
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String 
    },
    assigneeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    priority: { 
      type: String, 
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], 
      default: "MEDIUM" 
    },
    status: { 
      type: String, 
      enum: ["TODO", "DOING", "DONE"], 
      default: "TODO" 
    },
    startDate: { 
      type: Date 
    },
    dueDate: {
    type: Date,
    required: false, 
    },
    estimateHours: { 
      type: Number, 
      default: 0,
      min : 0, 
    },
    spentHours: { 
      type: Number, 
      default: 0 
    },
    orderIndex: { 
      type: Number 
    },
    deletedAt: { 
      type: Date, 
      default: null 
    }
  },
  { timestamps: true } // tự thêm createdAt và updatedAt
);

export default mongoose.model("Task", taskSchema);
