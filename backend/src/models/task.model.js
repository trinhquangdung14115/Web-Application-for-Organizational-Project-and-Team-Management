import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isCompleted: { type: Boolean, default: false }
});

const taskSchema = new mongoose.Schema(
  {
    projectId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project", 
      required: true 
    },
    // Removed parentId as requested by Leader
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
      enum: ["TODO", "DOING", "DONE","BACKLOG"], 
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
    },
    // New field for embedded subtasks
    subtasks: [subtaskSchema]
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);