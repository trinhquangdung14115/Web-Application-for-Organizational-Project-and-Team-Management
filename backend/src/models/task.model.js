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
    labels: [{ 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Label"
    }],
    estimateHours: { 
      type: Number, 
      default: 0,
      min : 0, 
    },
    spentHours: { 
      type: Number, 
      default: 0 
    },
    isOverdueNotified: {
      type: Boolean,
      default: false 
    },
    deletedAt: { 
      type: Date, 
      default: null 
    },
    orderIndex: { type: Number, default: 0 },
    subtasks: [subtaskSchema],
    attachments: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        addedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);