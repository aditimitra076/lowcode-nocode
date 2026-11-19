// Creates and removes temporary Administrator accounts for the black box tests.
// An Admin cannot be created through the REST interface (the Register screen creates Developers only), so the tests
// write the test admin straight into the database that the backend uses. The connection setting MONGODB_URI is read by
// dotenv from backend/.env in this process (the same way backend/scripts/seedAdmin.js does it); the tests never print it.
// Only accounts whose email starts with qa.admin. are created and removed by this helper.
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const BACKEND_DIR = path.resolve(import.meta.dirname, '..', '..', 'backend')
const require = createRequire(path.join(BACKEND_DIR, 'package.json'))
const SAFE = /^qa\.admin\d*\.[a-z0-9]+@qa\.test$/
let mongoose
let User

async function connect() {
  if (mongoose) return
  require('dns').setServers(['1.1.1.1', '8.8.8.8'])
  require('dotenv').config({ path: path.join(BACKEND_DIR, '.env') })
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set (backend/.env).')
  mongoose = require('mongoose')
  await mongoose.connect(process.env.MONGODB_URI)
  User = (await import(pathToFileURL(path.join(BACKEND_DIR, 'modules', 'User.js')).href)).default
}

export async function createTestAdmin(email, password) {
  if (!SAFE.test(email)) throw new Error('Test admin emails must look like qa.admin1.<stamp>@qa.test')
  await connect()
  await User.create({ name: 'QA Admin', email, password, role: 'Admin' })
}

export async function removeTestAdmins(emails) {
  await connect()
  const safe = emails.filter((email) => SAFE.test(email))
  const result = await User.deleteMany({ email: { $in: safe }, role: 'Admin' })
  await mongoose.disconnect()
  return result.deletedCount
}
