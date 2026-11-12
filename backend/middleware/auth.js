import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../modules/User.js'

export default async function requireAuth(req, res, next) {
  const authorization = req.get('authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)

  if (!match) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  let payload
  try {
    payload = jwt.verify(match[1], process.env.JWT_SECRET || 'vf-dev-secret-key-32characters-minimum')
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: 'Your session is invalid. Please log in again.',
      })
    }

    return next(error)
  }

  if (
    typeof payload === 'string' ||
    typeof payload.sub !== 'string' ||
    !mongoose.isValidObjectId(payload.sub)
  ) {
    return res.status(401).json({
      message: 'Your session is invalid. Please log in again.',
    })
  }

  try {
    const user = await User.findById(payload.sub)
    if (!user) {
      return res.status(401).json({
        message: 'Your session is invalid. Please log in again.',
      })
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({
        message: 'Your account has been suspended. Contact support.',
      })
    }

    req.user = user
    return next()
  } catch (error) {
    return next(error)
  }
}
