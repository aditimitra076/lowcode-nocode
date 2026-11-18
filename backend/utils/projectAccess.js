import mongoose from 'mongoose'
import Project from '../modules/Project.js'

export function isOwner(project, userId) {
  return String(project.owner) === String(userId)
}

export function getCollaborator(project, userId) {
  return (project.collaborators || []).find((item) => String(item.user) === String(userId))
}

export function canView(project, userId) {
  return isOwner(project, userId) || Boolean(getCollaborator(project, userId))
}

export function canEdit(project, userId) {
  if (isOwner(project, userId)) return true
  const collaborator = getCollaborator(project, userId)
  return collaborator?.role === 'Editor'
}

export async function findAccessibleProject(projectId, userId) {
  if (!mongoose.isValidObjectId(projectId)) return null
  const project = await Project.findById(projectId)
  if (!project || !canView(project, userId)) return null
  return project
}

export function projectAccessFilter(userId) {
  return {
    $or: [{ owner: userId }, { 'collaborators.user': userId }],
  }
}
