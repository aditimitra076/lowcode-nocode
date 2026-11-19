import { Router } from 'express'
import fs from 'fs'
import multer from 'multer'
import path from 'path'
import requireAuth from '../middleware/auth.js'
import { UPLOADS_DIR, uploadFile } from '../controllers/uploadController.js'

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
const FILE_TYPES = new Set([
  ...IMAGE_TYPES,
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
])
const MAX_BYTES = 8 * 1024 * 1024
const SAFE_EXTS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.txt',
  '.csv',
  '.doc',
  '.docx',
  '.zip',
])

fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR)
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.bin'
    const safeExt = SAFE_EXTS.has(ext) ? ext : '.bin'
    const stamp = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    const prefix = IMAGE_TYPES.has(file.mimetype) ? 'img' : 'file'
    cb(null, `${prefix}_${stamp}${safeExt}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (!FILE_TYPES.has(file.mimetype)) {
      cb(
        new Error(
          'Allowed types: JPEG, PNG, GIF, WebP, PDF, TXT, CSV, DOC, DOCX, or ZIP.',
        ),
      )
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
        return res.status(400).json({ message: 'File must be 8MB or smaller.' })
      }
      return res.status(400).json({ message: error.message })
    }
    return res.status(400).json({ message: error.message || 'Upload failed.' })
  })
}, uploadFile)

export default router
