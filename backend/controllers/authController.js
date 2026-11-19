import bcrypt from 'bcryptjs'
import User from '../modules/User.js'
import DeveloperProfile from '../modules/DeveloperProfile.js'
import { logActivity } from '../modules/ActivityLog.js'
import { publicUser } from '../utils/serializers.js'
import { signToken } from '../utils/token.js'
import { EMAIL_PATTERN } from '../utils/validation.js'

const passwordHasLetterAndNumber = (password) =>
  /[A-Za-z]/.test(password) && /\d/.test(password)

export async function register(req, res, next) {
  const { name, email, password } = req.body ?? {}
  const normalizedName = typeof name === 'string' ? name.trim() : ''
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  if (
    !normalizedName ||
    !EMAIL_PATTERN.test(normalizedEmail) ||
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
      token: signToken(user.id),
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

    await logActivity({
      actor: user.id,
      action: 'auth.login',
      target: user.id,
      meta: { email: user.email },
    })

    return res.json({
      token: signToken(user.id),
      user: publicUser(user),
    })
  } catch (error) {
    return next(error)
  }
}

export function me(req, res) {
  return res.json({ user: publicUser(req.user) })
}

function serializeProfile(profile, user) {
  return {
    displayName: profile?.displayName || user?.name || '',
    title: profile?.title || '',
    bio: profile?.bio || '',
    skills: Array.isArray(profile?.skills) ? profile.skills : [],
    location: profile?.location || '',
    contactEmail: profile?.contactEmail || user?.email || '',
    phone: profile?.phone || '',
    website: profile?.website || '',
    portfolioUrl: profile?.portfolioUrl || '',
    github: profile?.github || '',
    linkedin: profile?.linkedin || '',
    availableForHire: profile ? Boolean(profile.availableForHire) : true,
  }
}

/** FR-43: read the signed-in developer's marketplace profile. */
export async function getProfile(req, res, next) {
  try {
    const profile = await DeveloperProfile.findOne({ user: req.user.id })
    return res.json({ profile: serializeProfile(profile, req.user) })
  } catch (error) {
    return next(error)
  }
}

/** FR-43: update developer contact / profile shown on marketplace listings. */
export async function updateProfile(req, res, next) {
  const body = req.body ?? {}
  const skillsRaw = Array.isArray(body.skills)
    ? body.skills
    : typeof body.skills === 'string'
      ? body.skills.split(',')
      : []

  const patch = {
    displayName:
      typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 80) : undefined,
    title: typeof body.title === 'string' ? body.title.trim().slice(0, 100) : undefined,
    bio: typeof body.bio === 'string' ? body.bio.trim().slice(0, 1500) : undefined,
    location: typeof body.location === 'string' ? body.location.trim().slice(0, 120) : undefined,
    contactEmail:
      typeof body.contactEmail === 'string'
        ? body.contactEmail.trim().toLowerCase().slice(0, 160)
        : undefined,
    phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : undefined,
    website: typeof body.website === 'string' ? body.website.trim().slice(0, 240) : undefined,
    portfolioUrl:
      typeof body.portfolioUrl === 'string' ? body.portfolioUrl.trim().slice(0, 240) : undefined,
    github: typeof body.github === 'string' ? body.github.trim().slice(0, 240) : undefined,
    linkedin: typeof body.linkedin === 'string' ? body.linkedin.trim().slice(0, 240) : undefined,
    availableForHire:
      typeof body.availableForHire === 'boolean' ? body.availableForHire : undefined,
    skills: skillsRaw
      .filter((skill) => typeof skill === 'string' && skill.trim())
      .map((skill) => skill.trim().slice(0, 40))
      .slice(0, 24),
  }

  Object.keys(patch).forEach((key) => {
    if (patch[key] === undefined) delete patch[key]
  })

  try {
    const profile = await DeveloperProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        $set: {
          ...patch,
          user: req.user.id,
          ...(patch.displayName == null ? { displayName: req.user.name } : {}),
          ...(patch.contactEmail == null ? { contactEmail: req.user.email } : {}),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    )

    await logActivity({
      actor: req.user.id,
      action: 'profile.update',
      target: req.user.id,
    })

    return res.json({ profile: serializeProfile(profile, req.user) })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }
    return next(error)
  }
}
