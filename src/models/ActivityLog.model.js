import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE_BOOK', 'UPDATE_BOOK', 'DELETE_BOOK',
      'CREATE_CATEGORY', 'UPDATE_CATEGORY', 'DELETE_CATEGORY',
    ],
    index: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Book', 'Category']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    refPath: 'entityType'
  },
  details: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  expireAfterSeconds: 2592000 // Auto-delete logs after 30 days (optional)
});

// Compound indexes for fast queries
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });

activityLogSchema.plugin(mongoosePaginate);
export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);