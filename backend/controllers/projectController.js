import mongoose from 'mongoose'
import Project, { COMPONENT_TYPES } from '../modules/Project.js'

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

function countComponents(nodes) {
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

// Returns an error message, or null when the page tree is valid.
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

function serialize(project) {
  return {
    id: project.id,
    name: project.name,
    pages: project.pages,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
}

function summarize(project) {
  return {
    id: project.id,
    name: project.name,
    pageCount: project.pages.length,
    componentCount: project.pages.reduce(
      (total, page) => total + countComponents(page.components),
      0,
    ),
    updatedAt: project.updatedAt,
  }
}

export async function listProjects(req, res, next) {
  try {
    const projects = await Project.find({ owner: req.user.id }).sort({ updatedAt: -1 })
    return res.json({ projects: projects.map(summarize) })
  } catch (error) {
    return next(error)
  }
}

export async function getProject(req, res, next) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: 'Project not found' })
  }

  try {
    const project = await Project.findOne({ _id: id, owner: req.user.id })
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    return res.json({ project: serialize(project) })
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
    return res.status(201).json({ project: serialize(project) })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }
    return next(error)
  }
}

export async function updateProject(req, res, next) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: 'Project not found' })
  }

  const { name, pages } = req.body ?? {}
  const update = {}

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

  try {
    const project = await Project.findOne({ _id: id, owner: req.user.id })
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    project.set(update)
    await project.save()
    return res.json({ project: serialize(project) })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }
    return next(error)
  }
}
