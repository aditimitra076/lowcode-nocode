import { Router } from 'express'
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
} from '../controllers/projectController.js'
import requireAuth from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', listProjects)
router.post('/', createProject)
router.get('/:id', getProject)
router.put('/:id', updateProject)

export default router
