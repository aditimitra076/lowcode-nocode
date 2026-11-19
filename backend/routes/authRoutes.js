import { Router } from 'express'
import {
  getProfile,
  login,
  me,
  register,
  updateProfile,
} from '../controllers/authController.js'
import requireAuth from '../middleware/auth.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuth, me)
router.get('/profile', requireAuth, getProfile)
router.put('/profile', requireAuth, updateProfile)

export default router
