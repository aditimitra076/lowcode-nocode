import mongoose from 'mongoose'
import User from '../modules/User.js'
import Project from '../modules/Project.js'
import DataTable from '../modules/DataTable.js'
import TableRecord from '../modules/TableRecord.js'
import MarketplaceListing from '../modules/MarketplaceListing.js'
import DeveloperProfile from '../modules/DeveloperProfile.js'
import ActivityLog, { logActivity } from '../modules/ActivityLog.js'
import { publicUser } from '../utils/serializers.js'

/**
 * Admin deletes a user account (VF-UC-11, FR-54).
 * Rules: an admin cannot delete the own account or another Admin account.
 * The user's projects (with their tables, records and listings), the developer profile and the
 * marketplace listings of the user are deleted, and the user is removed from the collaborators of
 * other projects. Activity log entries are kept; the deletion itself is logged.
 */
export async function deleteUser(req, res, next) {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: 'User not found.' })
  }
  if (String(id) === String(req.user.id)) {
    return res.status(400).json({ message: 'You cannot delete your own account.' })
  }

  try {
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ message: 'User not found.' })
    }
    if (user.role === 'Admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be deleted here.' })
    }

    const projects = await Project.find({ owner: user._id }).select('_id')
    const projectIds = projects.map((project) => project._id)

    if (projectIds.length) {
      const tables = await DataTable.find({ project: { $in: projectIds } }).select('_id')
      const tableIds = tables.map((table) => table._id)
      if (tableIds.length) {
        await TableRecord.deleteMany({ table: { $in: tableIds } })
        await DataTable.deleteMany({ project: { $in: projectIds } })
      }
      await MarketplaceListing.deleteMany({ project: { $in: projectIds } })
      await Project.deleteMany({ _id: { $in: projectIds } })
    }

    await MarketplaceListing.deleteMany({ developer: user._id })
    await DeveloperProfile.deleteOne({ user: user._id })
    await Project.updateMany(
      { 'collaborators.user': user._id },
      { $pull: { collaborators: { user: user._id } } },
    )
    await user.deleteOne()

    await logActivity({
      actor: req.user.id,
      action: 'user.delete',
      target: String(user._id),
      meta: { email: user.email, projects: projectIds.length },
    })

    return res.json({ ok: true, deleted: { projects: projectIds.length } })
  } catch (error) {
    return next(error)
  }
}

/** A user as the administrator sees it: the public fields and the date of registration. */
const adminUser = (user) => ({ ...publicUser(user), createdAt: user.createdAt })

export async function listUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(200)
    return res.json({ users: users.map(adminUser) })
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

    return res.json({ user: adminUser(user) })
  } catch (error) {
    return next(error)
  }
}

export async function listLogs(req, res, next) {
  try {
    const action = typeof req.query.action === 'string' ? req.query.action.trim() : ''
    const actorEmail =
      typeof req.query.actor === 'string' ? req.query.actor.trim().toLowerCase() : ''
    const from = typeof req.query.from === 'string' ? Date.parse(req.query.from) : NaN
    const to = typeof req.query.to === 'string' ? Date.parse(req.query.to) : NaN

    const filter = {}
    if (action) filter.action = new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    if (Number.isFinite(from) || Number.isFinite(to)) {
      filter.createdAt = {}
      if (Number.isFinite(from)) filter.createdAt.$gte = new Date(from)
      if (Number.isFinite(to)) filter.createdAt.$lte = new Date(to)
    }

    let logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(300)
      .populate('actor', 'name email role')

    if (actorEmail) {
      logs = logs.filter((log) =>
        String(log.actor?.email || '')
          .toLowerCase()
          .includes(actorEmail),
      )
    }

    return res.json({
      logs: logs.slice(0, 200).map((log) => ({
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
