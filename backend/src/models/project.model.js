import mongoose from "mongoose";

const labelSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		color: { type: String, default: "#3b82f6" },
	},
	{ timestamps: true }
);

const memberSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		role: { type: String, enum: ["Admin", "Manager", "Member"], default: "Member" },
		status: { type: String, enum: ["PENDING", "ACTIVE", "REJECTED"], default: "ACTIVE" },
	},
	{ timestamps: true }
);

const projectSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		description: { type: String, default: "" },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		status: { type: String, enum: ["active", "archived"], default: "active" },
		members: { type: [memberSchema], default: [] },
		labels: { type: [labelSchema], default: [] },
		inviteCode: {
            type: String,
            unique: true, 
            sparse: true, 
            select: false, 
        },
		meta: { type: Object, default: {} },
		deletedAt: { type: Date, default: null },
		deadline: { type: Date },
	},
	{ timestamps: true }
);

export default mongoose.model("Project", projectSchema);
