import { Router } from 'express'
import { submitPublicForm } from '../controllers/publicFormController.js'
import {
  listPublicRecords,
  listPublicTables,
} from '../controllers/publicDataController.js'

const router = Router()

router.post('/projects/:projectId/forms/:componentId', submitPublicForm)
router.get('/projects/:projectId/tables', listPublicTables)
router.get('/projects/:projectId/tables/:tableId/records', listPublicRecords)

export default router
