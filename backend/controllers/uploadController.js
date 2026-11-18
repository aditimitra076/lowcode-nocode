import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

/**
 * JWT-protected image upload. Multer already validated type/size and saved the file.
 */
export async function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Choose an image file to upload.' })
  }

  const url = `/uploads/${req.file.filename}`
  return res.status(201).json({
    url,
    filename: req.file.filename,
    size: req.file.size,
    mimeType: req.file.mimetype,
  })
}
