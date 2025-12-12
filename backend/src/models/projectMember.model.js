import mongoose from "mongoose"

const projectMemberSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        require: true,
        index: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: " User",
        require: true,
        index: true,
    },
    roleInProject:{
        type: String,
        enum: ["Manager", "Member"], 
        default: "Member"
    },
    // FIELD MỚI: Bắt buộc phải có để làm tính năng Join Request
    status: {
    type: String,
    enum: ["ACTIVE", "PENDING", "REJECTED"], 
    default: "PENDING" // Mặc định là chờ duyệt (nếu tự join)
    }
}, { timestamps: true }); // Tự sinh createdAt, updatedAt

projectMemberSchema.index({projectId: 1, userId: 1}, {unique: true})

const ProjectMember = mongoose.model("ProjectMember", projectMemberSchema);
export default ProjectMember;

