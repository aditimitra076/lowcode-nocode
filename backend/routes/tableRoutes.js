import { Router } from 'express'
import {
  createRecord,
  createTable,
  deleteRecord,
  deleteTable,
  getTable,
  listRecords,
  listTables,
  updateRecord,
  updateTable,
} from '../controllers/tableController.js'
import requireAuth from '../middleware/auth.js'

const router = Router({ mergeParams: true })

router.use(requireAuth)

router.get('/', listTables)
router.post('/', createTable)
router.get('/:tableId', getTable)
router.put('/:tableId', updateTable)
router.delete('/:tableId', deleteTable)

router.get('/:tableId/records', listRecords)
router.post('/:tableId/records', createRecord)
router.put('/:tableId/records/:recordId', updateRecord)
router.delete('/:tableId/records/:recordId', deleteRecord)

export default router
