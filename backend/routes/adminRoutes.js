import { Router } from 'express'
import { deleteUser, listLogs, listUsers, updateUserStatus } from '../controllers/adminController.js'
import requireAuth, { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth, requireAdmin)

router.get('/users', listUsers)
router.patch('/users/:id/status', updateUserStatus)
router.delete('/users/:id', deleteUser)
router.get('/logs', listLogs)

export default router
