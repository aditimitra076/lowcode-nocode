import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../modules/User.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordHasLetterAndNumber = (password) =>
  /[A-Za-z]/.test(password) && /\d/.test(password)

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  }
}

function createToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'vf-dev-secret-key-32characters-minimum', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  })
}

export async function register(req, res, next) {
  const { name, email, password } = req.body ?? {}
  const normalizedName = typeof name === 'string' ? name.trim() : ''
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (
    !normalizedName ||
    !emailPattern.test(normalizedEmail) ||
    typeof password !== 'string' ||
    password.length < 8 ||
    !passwordHasLetterAndNumber(password)
  ) {
    return res.status(400).json({
      message: 'Enter a name, a valid email, and a password with at least 8 characters, including a letter and a number.',
    })
  }

  try {
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password,
    })

    return res.status(201).json({
      token: createToken(user),
      user: publicUser(user),
    })
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({ message: 'This email is already registered' })
    }

    return next(error)
  }
}

export async function login(req, res, next) {
  const { email, password } = req.body ?? {}
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (!normalizedEmail || typeof password !== 'string') {
    return res.status(401).json({ message: "That email or password isn't right" })
  }

  try {
    const user = await User.findOne({ email: normalizedEmail }).select('+password')
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "That email or password isn't right" })
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({
        message: 'Your account has been suspended. Contact support.',
      })
    }

    return res.json({
      token: createToken(user),
      user: publicUser(user),
    })
  } catch (error) {
    return next(error)
  }
}

export function me(req, res) {
  return res.json({ user: publicUser(req.user) })
}
