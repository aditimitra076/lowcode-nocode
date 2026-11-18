import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, trim: true, maxlength: 80 },
    target: { type: String, trim: true, maxlength: 120 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema)

export async function logActivity({ actor, action, target, meta } = {}) {
  try {
    await ActivityLog.create({
      actor: actor || undefined,
      action,
      target,
      meta: meta || {},
    })
  } catch (error) {
    console.warn('Activity log failed:', error.message)
  }
}

export default ActivityLog
