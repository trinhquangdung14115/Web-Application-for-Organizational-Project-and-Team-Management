import mongoose from "mongoose";
import Organization from "../models/organization.model.js";
import OrganizationMember from "../models/organizationMember.model.js";
import User from "../models/user.model.js";

export const createOrganization = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name } = req.body;
    const userId = req.user._id; 

    const [newOrg] = await Organization.create(
      [
        {
          name,
          ownerId: userId,
          plan: "FREE", 
          inviteCode: Math.random().toString(36).substring(7).toUpperCase(),
        },
      ],
      { session }
    );
    await User.findByIdAndUpdate(req.user._id, {
      role: 'Admin',
      currentOrganizationId: newOrg._id,
      $push: { organizations: newOrg._id }
  });
    await OrganizationMember.create(
      [
        {
          organizationId: newOrg._id,
          userId: userId,
          roleInOrganization: "ORG_ADMIN",
        },
      ],
      { session }
    );

    await User.findByIdAndUpdate(
      userId,
      { 
        $set: { currentOrganizationId: newOrg._id },
        $addToSet: { organizations: newOrg._id }
      },
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: newOrg,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};