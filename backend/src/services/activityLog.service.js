import ActivityLog from "../models/activityLog.model.js";
import mongoose from "mongoose";

const getDiff = (oldData, newData) => {
  const changes = [];
  if (!oldData || !newData) return changes;

  const ignoredFields = ['_id', 'updatedAt', 'createdAt', '__v', 'organizationId', 'projectId'];

  const keys = Object.keys(newData);

  keys.forEach(key => {
    if (ignoredFields.includes(key)) return;

    const valOld = oldData[key];
    const valNew = newData[key];

    if (String(valOld) !== String(valNew)) {
      if (!valOld && !valNew) return; 

      changes.push({
        field: key,
        old: valOld,
        new: valNew
      });
    }
  });

  return changes;
};

export const logActivity = async ({
  userId,
  organizationId,
  projectId = null,
  action,
  entityType,
  entityId,
  description,
  oldData = null,
  newData = null
}) => {
  try {
    let metadata = {};
    if (oldData && newData) {
      const changes = getDiff(oldData, newData);
      if (changes.length > 0) {
        metadata.changes = changes;
      }
    } 
    else if (newData) {
      metadata.snapshot = newData;
    }

    await ActivityLog.create({
      userId,
      organizationId,
      projectId,
      action,
      entityType,
      entityId,
      content: description,
      metadata
    });

  } catch (err) {
    console.error("[ActivityLog] Error creating log:", err);
  }
};