import mongoose from 'mongoose'
import Project, { COMPONENT_TYPES, COLLABORATOR_ROLES } from '../modules/Project.js'
import User from '../modules/User.js'
import DataTable from '../modules/DataTable.js'
import TableRecord from '../modules/TableRecord.js'
import MarketplaceListing from '../modules/MarketplaceListing.js'
import { logActivity } from '../modules/ActivityLog.js'
import {
  canEdit,
  findAccessibleProject,
  isOwner,
  projectAccessFilter,
} from '../utils/projectAccess.js'

const MAX_PAGES = 20
const MAX_COMPONENTS = 2000
const MAX_DEPTH = 12

function newPage() {
  return {
    id: new mongoose.Types.ObjectId().toString(),
    name: 'Home',
    path: '/',
    components: [],
  }
}

export function countComponents(nodes) {
  return (nodes ?? []).reduce((total, node) => total + 1 + countComponents(node.children), 0)
}

function validateComponents(nodes, seenIds, depth, counter) {
  if (!Array.isArray(nodes)) return 'Component children must be an array.'
  if (depth > MAX_DEPTH) return `Components can be nested at most ${MAX_DEPTH} levels deep.`

  for (const node of nodes) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      return 'Each component must be an object.'
    }
    if (typeof node.id !== 'string' || !node.id.trim()) {
      return 'Each component needs a non-empty id.'
    }
    if (seenIds.has(node.id)) {
      return `Duplicate component id: ${node.id}`
    }
    seenIds.add(node.id)

    if (!COMPONENT_TYPES.includes(node.type)) {
      return `Unknown component type: ${node.type}`
    }
    if (node.props != null && (typeof node.props !== 'object' || Array.isArray(node.props))) {
      return `Component ${node.id} properties must be an object.`
    }
    if (node.style != null && (typeof node.style !== 'object' || Array.isArray(node.style))) {
      return `Component ${node.id} style must be an object.`
    }

    counter.total += 1
    if (counter.total > MAX_COMPONENTS) {
      return `A project can have at most ${MAX_COMPONENTS} components.`
    }

    const childError = validateComponents(node.children ?? [], seenIds, depth + 1, counter)
    if (childError) return childError
  }

  return null
}

export function validatePages(pages) {
  if (!Array.isArray(pages) || pages.length === 0) {
    return 'A project needs at least one page.'
  }
  if (pages.length > MAX_PAGES) {
    return `A project can have at most ${MAX_PAGES} pages.`
  }

  const pageIds = new Set()
  const componentIds = new Set()
  const counter = { total: 0 }

  for (const page of pages) {
    if (!page || typeof page !== 'object' || Array.isArray(page)) {
      return 'Each page must be an object.'
    }
    if (typeof page.id !== 'string' || !page.id.trim()) {
      return 'Each page needs a non-empty id.'
    }
    if (pageIds.has(page.id)) {
      return `Duplicate page id: ${page.id}`
    }
    pageIds.add(page.id)

    if (typeof page.name !== 'string' || !page.name.trim()) {
      return 'Each page needs a name.'
    }
    if (typeof page.path !== 'string' || !page.path.trim()) {
      return 'Each page needs a path.'
    }
    if (!Array.isArray(page.components)) {
      return `Page ${page.name} components must be an array.`
    }

    const error = validateComponents(page.components, componentIds, 1, counter)
    if (error) return error
  }

  return null
}

function serialize(project, userId) {
  const owner = isOwner(project, userId)
  const collaborator = (project.collaborators || []).find(
    (item) => String(item.user) === String(userId),
  )

  return {
    id: project.id,
    name: project.name,
    pages: project.pages,
    collaborators: (project.collaborators || []).map((item) => ({
      user: String(item.user),
      email: item.email,
      role: item.role,
    })),
    isOwner: owner,
    accessRole: owner ? 'Owner' : collaborator?.role || null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
}

function summarize(project, userId) {
  const owner = isOwner(project, userId)
  const collaborator = (project.collaborators || []).find(
    (item) => String(item.user) === String(userId),
  )

  return {
    id: project.id,
    name: project.name,
    pageCount: project.pages.length,
    componentCount: project.pages.reduce(
      (total, page) => total + countComponents(page.components),
      0,
    ),
    isOwner: owner,
    accessRole: owner ? 'Owner' : collaborator?.role || null,
    updatedAt: project.updatedAt,
  }
}

export async function listProjects(req, res, next) {
  try {
    const projects = await Project.find(projectAccessFilter(req.user.id)).sort({ updatedAt: -1 })
    return res.json({ projects: projects.map((project) => summarize(project, req.user.id)) })
  } catch (error) {
    return next(error)
  }
}

export async function getProject(req, res, next) {
  try {
    const project = await findAccessibleProject(req.params.id, req.user.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    return res.json({ project: serialize(project, req.user.id) })
  } catch (error) {
    return next(error)
  }
}

export async function createProject(req, res, next) {
  const { name, pages } = req.body ?? {}
  const normalizedName = typeof name === 'string' ? name.trim() : ''
  const projectPages = pages === undefined ? [newPage()] : pages

  if (!normalizedName) {
    return res.status(400).json({ message: 'A project needs a name.' })
  }

  const pageError = validatePages(projectPages)
  if (pageError) {
    return res.status(400).json({ message: pageError })
  }

  try {
    const project = await Project.create({
      owner: req.user.id,
      name: normalizedName,
      pages: projectPages,
    })
    await logActivity({
      actor: req.user.id,
      action: 'project.create',
      target: project.id,
      meta: { name: project.name },
    })
    return res.status(201).json({ project: serialize(project, req.user.id) })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }
    return next(error)
  }
}

export async function updateProject(req, res, next) {
  const { name, pages } = req.body ?? {}
  const update = {}

  try {
    const project = await findAccessibleProject(req.params.id, req.user.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    if (!canEdit(project, req.user.id)) {
      return res.status(403).json({ message: 'You have view-only access to this project.' })
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'A project needs a name.' })
      }
      update.name = name.trim()
    }

    if (pages !== undefined) {
      const pageError = validatePages(pages)
      if (pageError) {
        return res.status(400).json({ message: pageError })
      }
      update.pages = pages
    }

    if (!Object.keys(update).length) {
      return res.status(400).json({ message: 'Nothing to update.' })
    }

    project.set(update)
    await project.save()
    return res.json({ project: serialize(project, req.user.id) })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }
    return next(error)
  }
}

export async function deleteProject(req, res, next) {
  try {
    const project = await findAccessibleProject(req.params.id, req.user.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    if (!isOwner(project, req.user.id)) {
      return res.status(403).json({ message: 'Only the project owner can delete it.' })
    }

    const tables = await DataTable.find({ project: project._id }).select('_id')
    const tableIds = tables.map((table) => table._id)
    if (tableIds.length) {
      await TableRecord.deleteMany({ table: { $in: tableIds } })
      await DataTable.deleteMany({ project: project._id })
    }
    await MarketplaceListing.deleteMany({ project: project._id })
    await project.deleteOne()

    await logActivity({
      actor: req.user.id,
      action: 'project.delete',
      target: String(project._id),
      meta: { name: project.name },
    })

    return res.json({ ok: true })
  } catch (error) {
    return next(error)
  }
}

export async function listCollaborators(req, res, next) {
  try {
    const project = await findAccessibleProject(req.params.id, req.user.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    return res.json({
      collaborators: (project.collaborators || []).map((item) => ({
        user: String(item.user),
        email: item.email,
        role: item.role,
      })),
      isOwner: isOwner(project, req.user.id),
    })
  } catch (error) {
    return next(error)
  }
}

export async function addCollaborator(req, res, next) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const role = COLLABORATOR_ROLES.includes(req.body?.role) ? req.body.role : 'Viewer'

  if (!email) {
    return res.status(400).json({ message: 'Enter a registered user email.' })
  }

  try {
    const project = await findAccessibleProject(req.params.id, req.user.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    if (!isOwner(project, req.user.id)) {
      return res.status(403).json({ message: 'Only the project owner can manage collaborators.' })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: 'No registered user with that email.' })
    }
    if (String(user._id) === String(project.owner)) {
      return res.status(400).json({ message: 'The owner is already on this project.' })
    }
    if ((project.collaborators || []).some((item) => String(item.user) === String(user._id))) {
      return res.status(409).json({ message: 'That user is already a collaborator.' })
    }

    project.collaborators.push({ user: user._id, email: user.email, role })
    await project.save()

    await logActivity({
      actor: req.user.id,
      action: 'collaborator.add',
      target: project.id,
      meta: { email: user.email, role },
    })

    return res.status(201).json({
      collaborators: project.collaborators.map((item) => ({
        user: String(item.user),
        email: item.email,
        role: item.role,
      })),
    })
  } catch (error) {
    return next(error)
  }
}

export async function updateCollaborator(req, res, next) {
  const memberId = req.params.userId
  const role = COLLABORATOR_ROLES.includes(req.body?.role) ? req.body.role : null

  if (!role) {
    return res.status(400).json({ message: "Role must be 'Editor' or 'Viewer'." })
  }

  try {
    const project = await findAccessibleProject(req.params.id, req.user.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    if (!isOwner(project, req.user.id)) {
      return res.status(403).json({ message: 'Only the project owner can manage collaborators.' })
    }

    const member = (project.collaborators || []).find(
      (item) => String(item.user) === String(memberId),
    )
    if (!member) {
      return res.status(404).json({ message: 'Collaborator not found.' })
    }

    member.role = role
    await project.save()
    await logActivity({
      actor: req.user.id,
      action: 'collaborator.update',
      target: project.id,
      meta: { userId: memberId, role },
    })

    return res.json({
      collaborators: project.collaborators.map((item) => ({
        user: String(item.user),
        email: item.email,
        role: item.role,
      })),
    })
  } catch (error) {
    return next(error)
  }
}

export async function removeCollaborator(req, res, next) {
  const memberId = req.params.userId

  try {
    const project = await findAccessibleProject(req.params.id, req.user.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    if (!isOwner(project, req.user.id)) {
      return res.status(403).json({ message: 'Only the project owner can manage collaborators.' })
    }

    const before = project.collaborators.length
    project.collaborators = project.collaborators.filter(
      (item) => String(item.user) !== String(memberId),
    )
    if (project.collaborators.length === before) {
      return res.status(404).json({ message: 'Collaborator not found.' })
    }

    await project.save()
    await logActivity({
      actor: req.user.id,
      action: 'collaborator.remove',
      target: project.id,
      meta: { userId: memberId },
    })

    return res.json({
      collaborators: project.collaborators.map((item) => ({
        user: String(item.user),
        email: item.email,
        role: item.role,
      })),
    })
  } catch (error) {
    return next(error)
  }
}
