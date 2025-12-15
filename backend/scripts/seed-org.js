import mongoose from "mongoose";
import dotenv from "dotenv";
import Organization from "../src/models/organization.model.js";
import User from "../src/models/user.model.js";

dotenv.config();

const seedOrg = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    const existingOrg = await Organization.findOne();
    if (existingOrg) {
      console.log(`Organization already exists: ${existingOrg.name}`);
      process.exit(0);
    }

    const owner = await User.findOne();
    if (!owner) {
      console.error("Error: No users found in DB. Please register a user first.");
      process.exit(1);
    }

    const newOrg = await Organization.create({
      name: "Default Organization",
      ownerId: owner._id,
      plan: "FREE",
      inviteCode: "SEED01" 
    });

    console.log(` Created Default Organization: "${newOrg.name}" (ID: ${newOrg._id})`);
    console.log(`   Owner: ${owner.name} (${owner.email})`);

    await User.findByIdAndUpdate(owner._id, {
        currentOrganizationId: newOrg._id,
        $addToSet: { organizations: newOrg._id }
    });
    console.log("Updated User context.");

    process.exit(0);
  } catch (error) {
    console.error("Seed Error:", error);
    process.exit(1);
  }
};

seedOrg();