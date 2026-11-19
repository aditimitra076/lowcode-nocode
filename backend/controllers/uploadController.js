import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

/**
 * JWT-protected upload for images and common document files (FR-25).
 */
export async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Choose a file to upload.' })
  }

  const url = `/uploads/${req.file.filename}`
  return res.status(201).json({
    url,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
  })
}

/** @deprecated alias kept for older imports */
export const uploadImage = uploadFile
