import { Router } from 'express'
import {
  addCollaborator,
  createProject,
  deleteProject,
  getProject,
  listCollaborators,
  listProjects,
  removeCollaborator,
  updateProject,
} from '../controllers/projectController.js'
import requireAuth from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', listProjects)
router.post('/', createProject)
router.get('/:id', getProject)
router.put('/:id', updateProject)
router.delete('/:id', deleteProject)

router.get('/:id/collaborators', listCollaborators)
router.post('/:id/collaborators', addCollaborator)
router.delete('/:id/collaborators/:userId', removeCollaborator)

export default router
