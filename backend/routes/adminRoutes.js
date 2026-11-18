import { Router } from 'express'
import { listLogs, listUsers, updateUserStatus } from '../controllers/adminController.js'
import requireAuth, { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/users', listUsers)
router.patch('/users/:id/status', updateUserStatus)
router.get('/logs', listLogs)

export default router
