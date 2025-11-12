import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		role: { type: String, enum: ["Admin", "Manager", "Member"], default: "Member" },
	},
	{ _id: false }
);

const projectSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, trim: true },
		description: { type: String, default: "" },
		createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		members: { type: [memberSchema], default: [] },
		meta: { type: Object, default: {} },
		deletedAt: { type: Date, default: null },
	},
	{ timestamps: true }
);

export default mongoose.model("Project", projectSchema);