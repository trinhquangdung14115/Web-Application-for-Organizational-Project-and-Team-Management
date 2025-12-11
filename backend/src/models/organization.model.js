import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        ownerId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        }, 
        plan: { 
            type: String, 
            enum: ["FREE", "PREMIUM"], 
            default: "FREE" 
        },
        inviteCode: {
            type: String,
            unique: true, 
            sparse: true, 
            select: false, 
        },
        stripeCustomerId: {
            type: String, 
            select: false 
        } 
    },
    { timestamps: true }
);

export default mongoose.model("Organization", OrganizationSchema);