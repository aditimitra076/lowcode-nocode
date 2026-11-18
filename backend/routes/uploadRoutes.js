import { Router } from 'express'
import fs from 'fs'
import multer from 'multer'
import path from 'path'
import requireAuth from '../middleware/auth.js'
import { UPLOADS_DIR, uploadImage } from '../controllers/uploadController.js'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const MAX_BYTES = 3 * 1024 * 1024

fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR)
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png'
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.png'
    const stamp = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    cb(null, `img_${stamp}${safeExt}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, GIF, or WebP images are allowed.'))
      return
    }
    cb(null, true)
  },
})

const router = Router()

router.post('/', requireAuth, (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next()
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image must be 3MB or smaller.' })
      }
      return res.status(400).json({ message: error.message })
    }
    return res.status(400).json({ message: error.message || 'Upload failed.' })
  })
}, uploadImage)

export default router
