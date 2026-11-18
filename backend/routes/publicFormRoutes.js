import { Router } from 'express'
import { submitPublicForm } from '../controllers/publicFormController.js'

const router = Router()

router.post('/projects/:projectId/forms/:componentId', submitPublicForm)

export default router
