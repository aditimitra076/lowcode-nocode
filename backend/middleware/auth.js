import jwt from 'jsonwebtoken'
import { verifyToken } from '../utils/token.js'
import mongoose from 'mongoose'
import User from '../modules/User.js'

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Administrator access required.' })
  }
  return next()
}

/** Attach req.user when a valid Bearer token is present; otherwise continue anonymously. */
export async function optionalAuth(req, res, next) {
  const authorization = req.get('authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match) return next()

  try {
    const payload = verifyToken(match[1])
    if (typeof payload === 'string' || typeof payload.sub !== 'string') return next()
    if (!mongoose.isValidObjectId(payload.sub)) return next()
    const user = await User.findById(payload.sub)
    if (user && user.status !== 'Suspended') req.user = user
  } catch {
    // Ignore invalid tokens for public routes.
  }
  return next()
}

export default async function requireAuth(req, res, next) {
  const authorization = req.get('authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)

  if (!match) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  let payload
  try {
    payload = verifyToken(match[1])
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
