import mongoose from "mongoose";
import dotenv from "dotenv";
import ProjectMember from "../src/models/projectMember.model.js"; 
import Organization from "../src/models/organization.model.js"; 

dotenv.config();

const migrateData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Migration (Fix & Cleanup)...");

    const defaultOrg = await Organization.findOne();
    if (!defaultOrg) {
        console.error("ERROR: No Organization found. Please seed one first.");
        process.exit(1);
    }

    const projectsCollection = mongoose.connection.db.collection("projects");
    const projects = await projectsCollection.find({}).toArray();
    
    console.log(`Found ${projects.length} projects to process.`);

    let migratedCount = 0;

    for (const project of projects) {
      let targetOrgId = project.organizationId || defaultOrg._id;

      if (project.members && Array.isArray(project.members) && project.members.length > 0) {
        
        console.log(`Checking members for: ${project.name}...`);

        for (const memberData of project.members) {
          let userId = memberData;
          let role = "Member"; 

          if (typeof memberData === 'object' && memberData._id) {
              userId = memberData._id;
              if (memberData.role) {
                  role = memberData.role; 
              }
          }

          const exists = await ProjectMember.findOne({
              projectId: project._id,
              userId: userId
          });

          if (!exists) {
              await ProjectMember.create({
                  organizationId: targetOrgId,
                  projectId: project._id,
                  userId: userId,
                  roleInProject: role, 
                  status: "ACTIVE"
              });
              migratedCount++;
          } else {
              if (exists.roleInProject === "Member" && role !== "Member") {
                  exists.roleInProject = role;
                  await exists.save();
                  console.log(`   -> Updated role for user in project ${project.name}`);
              }
          }
        }
      }
    }

    console.log(`-----------------------------------`);
    console.log(`New/Updated records: ${migratedCount}`);
    console.log("Cleaning up legacy 'members' field from Projects...");
    await projectsCollection.updateMany(
        { members: { $exists: true } }, 
        { $unset: { members: "" } }
    );
    console.log("Cleanup Complete! Database is clean.");

    process.exit(0);
  } catch (error) {
    console.error("Migration Error:", error);
    process.exit(1);
  }
};

migrateData();