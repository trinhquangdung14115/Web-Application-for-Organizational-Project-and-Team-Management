import Label from "../models/label.model.js";
import Project from "../models/project.model.js";
import mongoose from "mongoose";

// GET /projects/:id/labels
export const getLabels = async (req, res) => {
  try {
    const { id } = req.params; 

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID format" });
    }
    
    const labels = await Label.find({ 
        projectId: id,
        deletedAt: null 
    }).sort({ createdAt: 1 }); 

    res.json({ success: true, data: labels });
  } catch (err) {
    console.error("Get Labels Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /projects/:id/labels
export const createLabel = async (req, res) => {
  try {
    const { id } = req.params; 
    const { name, color } = req.body || {};
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid project ID format" });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Label name is required" });
    }

    // 1. Phải tìm Project trước để lấy organizationId (Model Label bắt buộc trường này)
    const project = await Project.findById(id);
    if (!project || project.deletedAt) {
      return res.status(404).json({ success: false, error: "NotFoundError", message: "Project not found" });
    }

    const newLabel = await Label.create({
        name: name.trim(),
        color: color || "#3b82f6",
        projectId: project._id,
        organizationId: project.organizationId, 
        deletedAt: null
    });

    res.status(201).json({ 
      success: true, 
      message: "Label created successfully", 
      data: newLabel
    });

  } catch (err) {
    console.error("Create Label Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /projects/:id/labels/:labelId
export const updateLabel = async (req, res) => {
  try {
    const { labelId } = req.params;
    const { name, color } = req.body || {};
    
    if (!mongoose.Types.ObjectId.isValid(labelId)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid label ID format" });
    }

    const updatedLabel = await Label.findByIdAndUpdate(
        labelId,
        { 
            $set: { 
                ...(name && { name: name.trim() }), 
                ...(color && { color }) 
            } 
        },
        { new: true }
    );

    if (!updatedLabel || updatedLabel.deletedAt) {
        return res.status(404).json({ success: false, error: "NotFoundError", message: "Label not found" });
    }

    res.json({ success: true, message: "Label updated", data: updatedLabel });
  } catch (err) {
    console.error("Update Label Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /projects/:id/labels/:labelId
export const deleteLabel = async (req, res) => {
  try {
    const { labelId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(labelId)) {
      return res.status(400).json({ success: false, error: "ValidationError", message: "Invalid label ID format" });
    }

    const deletedLabel = await Label.findByIdAndUpdate(
        labelId,
        { deletedAt: new Date() },
        { new: true }
    );
    
    if (!deletedLabel) {
        return res.status(404).json({ success: false, error: "NotFoundError", message: "Label not found" });
    }

    res.json({ success: true, message: "Label deleted" });

  } catch (err) {
    console.error("Delete Label Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};