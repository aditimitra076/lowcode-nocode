import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { fileURLToPath } from 'node:url'
import User from '../modules/User.js'

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) })

const email = 'admin@vf.test'
const password = process.env.SEED_ADMIN_PASSWORD

if (!process.env.MONGODB_URI || !password) {
  console.error('Set MONGODB_URI and SEED_ADMIN_PASSWORD before seeding the admin account.')
  process.exit(1)
}

if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
  console.error('SEED_ADMIN_PASSWORD must be at least 8 characters and include a letter and a number.')
  process.exit(1)
}

try {
  await mongoose.connect(process.env.MONGODB_URI)
  const existingAdmin = await User.findOne({ email })

  if (existingAdmin) {
    console.error('The admin account already exists; no changes were made.')
    process.exitCode = 1
  } else {
    await User.create({
      name: 'VisualForge Admin',
      email,
      password,
      role: 'Admin',
      status: 'Active',
    })
    console.log(`Created ${email}.`)
  }
} catch {
  console.error('Admin seeding failed. Check the database connection and configuration.')
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
