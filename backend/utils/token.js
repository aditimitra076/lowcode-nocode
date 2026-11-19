import jwt from 'jsonwebtoken'

// One place for the token settings. JWT_SECRET should always be set outside development.
const DEV_SECRET = 'vf-dev-secret-key-32characters-minimum'
const secret = () => process.env.JWT_SECRET || DEV_SECRET

export function signToken(userId) {
  return jwt.sign({ sub: userId }, secret(), { expiresIn: process.env.JWT_EXPIRES_IN || '1d' })
}

/** Returns the payload of a valid token and throws a JsonWebTokenError otherwise. */
export function verifyToken(token) {
  return jwt.verify(token, secret())
}
