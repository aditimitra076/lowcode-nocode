import mongoose from 'mongoose'
import Project from '../modules/Project.js'
import User from '../modules/User.js'
import DeveloperProfile from '../modules/DeveloperProfile.js'
import MarketplaceListing from '../modules/MarketplaceListing.js'
import { logActivity } from '../modules/ActivityLog.js'
import { countComponents } from './projectController.js'
import { isOwner } from '../utils/projectAccess.js'

const MAX_PUBLIC_LISTINGS = 100

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function countType(node, type) {
  const children = Array.isArray(node?.children) ? node.children : []
  return children.reduce(
    (total, child) => total + (child.type === type ? 1 : 0) + countType(child, type),
    node?.type === type ? 1 : 0,
  )
}

function newId() {
  return new mongoose.Types.ObjectId().toString()
}

// Deep-copy a project's pages so a clone never shares component ids with the source.
export function clonePages(pages) {
  const cloneNodes = (nodes) =>
    (Array.isArray(nodes) ? nodes : []).map((node) => ({
      id: newId(),
      type: node.type,
      props: JSON.parse(JSON.stringify(node.props ?? {})),
      style: JSON.parse(JSON.stringify(node.style ?? {})),
      children: cloneNodes(node.children),
    }))

  return (Array.isArray(pages) ? pages : []).map((page) => ({
    id: newId(),
    name: page.name,
    path: page.path,
    components: cloneNodes(page.components),
  }))
}

// The public shape of a developer shown on a marketplace listing (FR-43).
function serializeDeveloper(user, profile) {
  return {
    id: user?.id || '',
    name: user?.name || 'Marketplace Developer',
    displayName: profile?.displayName || user?.name || '',
    title: profile?.title || '',
    bio: profile?.bio || '',
    skills: Array.isArray(profile?.skills) ? profile.skills : [],
    contact: {
      email: profile?.contactEmail || user?.email || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
      portfolioUrl: profile?.portfolioUrl || '',
      github: profile?.github || '',
      linkedin: profile?.linkedin || '',
      location: profile?.location || '',
      availableForHire: profile ? Boolean(profile.availableForHire) : false,
    },
  }
}

function serializeListing(listing, project, user, profile, { includePages = false } = {}) {
  const pages = project?.pages || []

  const serialized = {
    id: listing.id,
    projectId: String(listing.project),
    name: project?.name || 'Untitled project',
    description: listing.description,
    tags: Array.isArray(listing.tags) ? listing.tags : [],
    screenshots: Array.isArray(listing.screenshots) ? listing.screenshots : [],
    status: listing.status,
    pagesCount: pages.length,
    componentCount: pages.reduce((total, page) => total + countComponents(page.components), 0),
    tablesCount: pages.reduce(
      (total, page) =>
        total +
        (Array.isArray(page.components) ? page.components : []).reduce(
          (sum, node) => sum + countType(node, 'table'),
          0,
        ),
      0,
    ),
    reviewedBy: listing.reviewedBy ? String(listing.reviewedBy) : null,
    reviewedAt: listing.reviewedAt || null,
    rejectionReason: listing.rejectionReason || null,
    developer: serializeDeveloper(user, profile),
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  }

  if (includePages) {
    serialized.pages = pages
  }

  return serialized
}

async function enrichListings(listings, { includePages = false } = {}) {
  if (!listings.length) return []

  const projectIds = [
    ...new Set(listings.map((listing) => String(listing.project)).filter(Boolean)),
  ]
  const userIds = [
    ...new Set(listings.map((listing) => String(listing.developer)).filter(Boolean)),
  ]

  // Pages are loaded for every listing so blueprint counts stay accurate; they
  // are only attached to the response when a detail view asks for them.
  const [projects, users, profiles] = await Promise.all([
    Project.find({ _id: { $in: projectIds } }).select('name pages'),
    User.find({ _id: { $in: userIds } }).select('name email'),
    DeveloperProfile.find({ user: { $in: userIds } }),
  ])

  const projectMap = new Map(projects.map((project) => [project.id, project]))
  const userMap = new Map(users.map((user) => [user.id, user]))
  const profileMap = new Map(profiles.map((profile) => [String(profile.user), profile]))

  return listings.map((listing) => {
    const projectId = String(listing.project)
    const developerId = String(listing.developer)
    return serializeListing(
      listing,
      projectMap.get(projectId),
      userMap.get(developerId),
      profileMap.get(developerId),
      { includePages },
    )
  })
}

/**
 * FR-41 / FR-42 / FR-46: visitors browse, search and filter approved listings.
 */
export async function listListings(req, res, next) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const tag = typeof req.query.tag === 'string' ? req.query.tag.trim() : ''

  try {
    let listings = await MarketplaceListing.find({ status: 'Approved' })
      .sort({ updatedAt: -1 })
      .limit(MAX_PUBLIC_LISTINGS)

    let enriched = await enrichListings(listings)

    if (tag && tag !== 'All') {
      enriched = enriched.filter((listing) => listing.tags.includes(tag))
    }

    if (search) {
      const pattern = new RegExp(escapeRegExp(search), 'i')
      enriched = enriched.filter((listing) =>
        pattern.test(
          [
            listing.name,
            listing.description,
            listing.developer.name,
            listing.developer.title,
            listing.developer.contact.location,
            ...listing.tags,
            ...listing.developer.skills,
          ].join(' '),
        ),
      )
    }

    return res.json({ listings: enriched.slice(0, 60) })
  } catch (error) {
    return next(error)
  }
}

/**
 * FR-43: a visitor opens a listing and sees the project blueprint + developer
 * information, including the developer's contact details.
 */
export async function getListing(req, res, next) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: 'Template not found.' })
  }

  try {
    const listing = await MarketplaceListing.findOne({ _id: id, status: 'Approved' })
    if (!listing) {
      return res.status(404).json({ message: 'Template not found or is not approved.' })
    }

    const [serialized] = await enrichListings([listing], { includePages: true })
    return res.json({ listing: serialized, pages: serialized.pages || [] })
  } catch (error) {
    return next(error)
  }
}

/**
 * Lets a signed-in viewer use an approved listing as the starting point of a
 * new project in their own workspace. The component tree is copied verbatim.
 */
export async function cloneListing(req, res, next) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: 'Template not found.' })
  }

  try {
    const listing = await MarketplaceListing.findOne({ _id: id, status: 'Approved' })
    if (!listing) {
      return res.status(404).json({ message: 'This template is not available.' })
    }

    const project = await Project.findById(listing.project)
    if (!project) {
      return res.status(404).json({ message: 'The original project is no longer available.' })
    }

    if (String(project.owner) === req.user.id) {
      return res
        .status(400)
        .json({ message: 'This template already belongs to your workspace.' })
    }

    const name = `${project.name} (Template)`.slice(0, 120)
    const clone = await Project.create({
      owner: req.user.id,
      name,
      pages: clonePages(project.pages),
    })

    return res.status(201).json({
      project: {
        id: clone.id,
        name: clone.name,
        pages: clone.pages,
        createdAt: clone.createdAt,
        updatedAt: clone.updatedAt,
      },
    })
  } catch (error) {
    return next(error)
  }
}

/**
 * FR-39 / FR-40: a project owner creates or updates their listing and can
 * submit it for administrator review.
 */
export async function createOrUpdateListing(req, res, next) {
  const { projectId, description, tags, screenshots, submit } = req.body ?? {}
  const normalizedDescription =
    typeof description === 'string' ? description.trim() : ''

  if (!mongoose.isValidObjectId(String(projectId))) {
    return res.status(400).json({ message: 'A valid project is required.' })
  }
  if (!normalizedDescription) {
    return res.status(400).json({ message: 'A listing needs a description.' })
  }
  if (normalizedDescription.length > 2500) {
    return res.status(400).json({ message: 'A listing description is limited to 2500 characters.' })
  }

  const tagList = Array.isArray(tags) ? tags : []
  const shotList = Array.isArray(screenshots) ? screenshots : []
  if (tagList.length > 12) {
    return res.status(400).json({ message: 'A listing can have at most 12 tags.' })
  }
  if (shotList.length > 8) {
    return res.status(400).json({ message: 'A listing can have at most 8 screenshots.' })
  }

  try {
    const project = await Project.findById(projectId)
    if (!project || !isOwner(project, req.user.id)) {
      return res.status(404).json({ message: 'Project not found.' })
    }

    await DeveloperProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $setOnInsert: {
          user: req.user.id,
          displayName: req.user.name,
          contactEmail: req.user.email,
          availableForHire: true,
        },
      },
      { upsert: true, new: true },
    )

    const shouldSubmit = Boolean(submit)
    const update = {
      developer: req.user.id,
      description: normalizedDescription,
      tags: tagList,
      screenshots: shotList,
      status: shouldSubmit ? 'Pending' : 'Draft',
    }

    const listing = await MarketplaceListing.findOneAndUpdate(
      { project: project._id },
      shouldSubmit
        ? {
            $set: update,
            $unset: { reviewedBy: '', reviewedAt: '', rejectionReason: '' },
          }
        : { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    )

    await logActivity({
      actor: req.user.id,
      action: shouldSubmit ? 'listing.submit' : 'listing.save',
      target: listing.id,
      meta: { projectId: String(project._id), status: listing.status },
    })

    const [serialized] = await enrichListings([listing])
    return res.json({ listing: serialized })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }
    return next(error)
  }
}

/**
 * FR-44: administrators see the review queue.
 */
export async function listPendingListings(req, res, next) {
  const allowed = ['Draft', 'Pending', 'Approved', 'Rejected']
  const status = allowed.includes(req.query.status) ? req.query.status : 'Pending'

  try {
    const listings = await MarketplaceListing.find({ status })
      .sort({ createdAt: status === 'Pending' ? 1 : -1 })
      .limit(100)
    const enriched = await enrichListings(listings)
    return res.json({ listings: enriched })
  } catch (error) {
    return next(error)
  }
}

/**
 * FR-45: an administrator approves or rejects a pending listing.
 */
export async function reviewListing(req, res, next) {
  const { id } = req.params
  const { action, reason } = req.body ?? {}
  const normalizedReason = typeof reason === 'string' ? reason.trim() : ''

  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: 'Listing not found.' })
  }
  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ message: "Action must be 'approve' or 'reject'." })
  }
  if (action === 'reject' && !normalizedReason) {
    return res.status(400).json({ message: 'A rejection needs a reason.' })
  }
  if (normalizedReason.length > 500) {
    return res.status(400).json({ message: 'A rejection reason is limited to 500 characters.' })
  }

  try {
    const listing = await MarketplaceListing.findById(id)
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' })
    }
    if (listing.status !== 'Pending') {
      return res.status(409).json({ message: 'Only pending listings can be reviewed.' })
    }

    listing.status = action === 'approve' ? 'Approved' : 'Rejected'
    listing.reviewedBy = req.user.id
    listing.reviewedAt = new Date()
    listing.rejectionReason = action === 'reject' ? normalizedReason : null
    await listing.save()

    await logActivity({
      actor: req.user.id,
      action: action === 'approve' ? 'listing.approve' : 'listing.reject',
      target: listing.id,
      meta: { reason: listing.rejectionReason || undefined },
    })

    const [serialized] = await enrichListings([listing])
    return res.json({ listing: serialized })
  } catch (error) {
    return next(error)
  }
}
