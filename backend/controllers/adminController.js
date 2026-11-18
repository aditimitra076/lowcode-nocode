import mongoose from 'mongoose'
import User from '../modules/User.js'
import ActivityLog from '../modules/ActivityLog.js'
import { logActivity } from '../modules/ActivityLog.js'

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  }
}

export async function listUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(200)
    return res.json({ users: users.map(publicUser) })
  } catch (error) {
    return next(error)
  }
}

export async function updateUserStatus(req, res, next) {
  const { id } = req.params
  const status = req.body?.status

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: 'User not found.' })
  }
  if (status !== 'Active' && status !== 'Suspended') {
    return res.status(400).json({ message: "Status must be 'Active' or 'Suspended'." })
  }
  if (String(id) === String(req.user.id)) {
    return res.status(400).json({ message: 'You cannot change your own account status.' })
  }

  try {
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }
    if (user.role === 'Admin' && status === 'Suspended') {
      return res.status(400).json({ message: 'Admin accounts cannot be suspended here.' })
    }

    user.status = status
    await user.save()

    await logActivity({
      actor: req.user.id,
      action: status === 'Suspended' ? 'user.suspend' : 'user.activate',
      target: user.id,
      meta: { email: user.email },
    })

    return res.json({ user: publicUser(user) })
  } catch (error) {
    return next(error)
  }
}

export async function listLogs(req, res, next) {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('actor', 'name email role')

    return res.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        target: log.target,
        meta: log.meta,
        createdAt: log.createdAt,
        actor: log.actor
          ? {
              id: log.actor.id,
              name: log.actor.name,
              email: log.actor.email,
              role: log.actor.role,
            }
          : null,
      })),
    })
  } catch (error) {
    return next(error)
  }
}
