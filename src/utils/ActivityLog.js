// middleware/activityLogger.js
import { ActivityLog } from "../models/ActivityLog.model.js";

const logActivity = async (req, action, entityType, entityId,details) => {
  try {
    
    const activityLog = await ActivityLog.create({
      user: req.user._id,
      action,
      entityType,
      entityId,
      details
    });

    if(!activityLog) {
        console.log('Activity log creation failed');
    }

    
  } catch (err) {
    console.error('Activity logging failed:', err);
  }
};

export{ logActivity };