export default function requireRole(...roles) {
  return function checkRole(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to do that.' })
    }

    return next()
  }
}
