// White box tests (Member 2): unit and component tests that use knowledge of the source code
// (statements, branches and paths of the functions). No database is used: only the code paths that do not need it are tested.
// Run: node --test --experimental-test-coverage test/whitebox.test.mjs
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const BACKEND_DIR = path.resolve(import.meta.dirname, '..', 'backend')
const load = (file) => import(pathToFileURL(path.join(BACKEND_DIR, file)).href)
const require = createRequire(path.join(BACKEND_DIR, 'package.json'))
const jwt = require('jsonwebtoken')
const { coerceRecordData } = await load('utils/fieldData.js')
const access = await load('utils/projectAccess.js')
const { validatePages, countComponents } = await load('controllers/projectController.js')
const auth = await load('middleware/auth.js')
const requireAuth = auth.default
const { requireAdmin, optionalAuth } = auth
const requireRole = (await load('middleware/requireRole.js')).default
const adminController = await load('controllers/adminController.js')
const { default: UserModel } = await load('modules/User.js')
const { default: ProjectModel } = await load('modules/Project.js')
const { default: DataTableModel } = await load('modules/DataTable.js')
const { default: TableRecordModel } = await load('modules/TableRecord.js')
const { default: ListingModel } = await load('modules/MarketplaceListing.js')
const { default: ProfileModel } = await load('modules/DeveloperProfile.js')
const { default: ActivityLogModel } = await load('modules/ActivityLog.js')

const field = (key, type, extra = {}) => ({ key, label: key.toUpperCase(), type, ...extra })
const mockRes = () => ({ code: null, body: null, status(c) { this.code = c; return this }, json(b) { this.body = b; return this } })
const mockReq = (authorization) => ({ get: (name) => (name.toLowerCase() === 'authorization' ? authorization : undefined) })
const SECRET = process.env.JWT_SECRET || 'vf-dev-secret-key-32characters-minimum'

// ------------------------------------------------------------------------------------------ WB-01
test('WB-01 coerceRecordData: statement coverage with one valid value of every field type', () => {
  const fields = [field('t', 'text', { required: true, minLength: 2 }), field('e', 'email'), field('n', 'number'), field('b', 'boolean'), field('d', 'date')]
  const { data, errors } = coerceRecordData(fields, { t: 'Hello', e: 'A@B.CO', n: '42', b: 'yes', d: '2026-11-19' })
  assert.deepEqual(errors, [])
  assert.deepEqual(data, { t: 'Hello', e: 'a@b.co', n: 42, b: true, d: '2026-11-19' })
  assert.equal(coerceRecordData([field('n', 'number')], { n: 7 }).data.n, 7)
  assert.equal(coerceRecordData([field('b', 'boolean')], { b: true }).data.b, true)
  assert.equal(coerceRecordData([field('b', 'boolean')], { b: 'no' }).data.b, false)
  assert.equal(coerceRecordData([field('b', 'boolean')], { b: '1' }).data.b, true)
})

// ------------------------------------------------------------------------------------------ WB-02
test('WB-02 coerceRecordData: every error branch and the empty-value branches', () => {
  const required = coerceRecordData([field('t', 'text', { required: true })], {})
  assert.equal(required.errors.length, 1)
  assert.match(required.errors[0], /is required/)
  assert.equal(coerceRecordData([field('t', 'text', { required: true })], { t: '   ' }).errors.length, 1)
  assert.equal(coerceRecordData([field('t', 'text', { required: true })], null).errors.length, 1)
  assert.equal(coerceRecordData([field('t', 'text', { required: true })], [1, 2]).errors.length, 1)
  assert.equal(coerceRecordData([field('t', 'text')], { t: '' }).errors.length, 0)
  assert.equal(coerceRecordData([field('b', 'boolean')], { b: '' }).data.b, false)
  assert.equal(coerceRecordData([field('e', 'email')], { e: 'no-at-sign' }).errors.length, 1)
  assert.equal(coerceRecordData([field('e', 'email', { minLength: 30 })], { e: 'a@b.co' }).errors.length, 1)
  assert.equal(coerceRecordData([field('n', 'number')], { n: 'abc' }).errors.length, 1)
  assert.equal(coerceRecordData([field('d', 'date')], { d: 'not a date' }).errors.length, 1)
  assert.equal(coerceRecordData([field('t', 'text', { minLength: 3 })], { t: 'Al' }).errors.length, 1)
  assert.equal(coerceRecordData([field('t', 'text', { minLength: 3 })], { t: 'Ali' }).errors.length, 0)
  assert.equal(coerceRecordData([{ label: 'no key', type: 'text' }], { x: 1 }).errors.length, 0)
  assert.deepEqual(coerceRecordData(undefined, { a: 1 }).data, {})
})

// ------------------------------------------------------------------------------------------ WB-03
test('WB-03 projectAccess: decision paths of isOwner, canView and canEdit', () => {
  const project = { owner: 'u1', collaborators: [{ user: 'u2', role: 'Editor' }, { user: 'u3', role: 'Viewer' }] }
  assert.equal(access.isOwner(project, 'u1'), true)
  assert.equal(access.isOwner(project, 'u2'), false)
  assert.deepEqual([access.canView(project, 'u1'), access.canEdit(project, 'u1')], [true, true])
  assert.deepEqual([access.canView(project, 'u2'), access.canEdit(project, 'u2')], [true, true])
  assert.deepEqual([access.canView(project, 'u3'), access.canEdit(project, 'u3')], [true, false])
  assert.deepEqual([access.canView(project, 'u9'), access.canEdit(project, 'u9')], [false, false])
  assert.deepEqual([access.canView({ owner: 'u1' }, 'u9'), access.canEdit({ owner: 'u1' }, 'u9')], [false, false])
  assert.deepEqual(access.projectAccessFilter('u1'), { $or: [{ owner: 'u1' }, { 'collaborators.user': 'u1' }] })
})

// ------------------------------------------------------------------------------------------ WB-04
const pageOf = (id, components = []) => ({ id, name: 'Page ' + id, path: '/' + id, components })
test('WB-04 validatePages: path coverage (every return path of the function)', () => {
  assert.match(validatePages(undefined), /at least one page/)
  assert.match(validatePages([]), /at least one page/)
  assert.match(validatePages(Array.from({ length: 21 }, (_, i) => pageOf('p' + i))), /at most 20 pages/)
  assert.equal(validatePages(Array.from({ length: 20 }, (_, i) => pageOf('p' + i))), null)
  assert.match(validatePages([null]), /must be an object/)
  assert.match(validatePages([[]]), /must be an object/)
  assert.match(validatePages([{ name: 'a', path: '/a', components: [] }]), /non-empty id/)
  assert.match(validatePages([pageOf('a'), pageOf('a')]), /Duplicate page id/)
  assert.match(validatePages([{ id: 'a', path: '/a', components: [] }]), /needs a name/)
  assert.match(validatePages([{ id: 'a', name: 'A', components: [] }]), /needs a path/)
  assert.match(validatePages([{ id: 'a', name: 'A', path: '/a', components: 'x' }]), /must be an array/)
  const comp = (id, extra = {}) => ({ id, type: 'text', props: {}, style: {}, ...extra })
  assert.match(validatePages([pageOf('a', [5])]), /must be an object/)
  assert.match(validatePages([pageOf('a', [comp('')])]), /non-empty id/)
  assert.match(validatePages([pageOf('a', [comp('c'), comp('c')])]), /Duplicate component id/)
  assert.match(validatePages([pageOf('a', [comp('c', { type: 'spaceship' })])]), /Unknown component type/)
  assert.match(validatePages([pageOf('a', [comp('c', { props: [] })])]), /properties must be an object/)
  assert.match(validatePages([pageOf('a', [comp('c', { style: 'red' })])]), /style must be an object/)
  assert.match(validatePages([pageOf('a', [comp('c', { children: 'x' })])]), /children must be an array/)
  assert.equal(validatePages([pageOf('a', [comp('c', { props: null, style: null })])]), null)
})

// ------------------------------------------------------------------------------------------ WB-05
test('WB-05 validatePages and countComponents: loop and recursion boundaries (depth 12/13, 2000/2001 components)', async (t) => {
  const chain = (n) => {
    let node = { id: 'n' + n, type: 'container', props: {}, style: {}, children: [] }
    for (let i = n - 1; i >= 1; i--) node = { id: 'n' + i, type: 'container', props: {}, style: {}, children: [node] }
    return node
  }
  const flat = (n, prefix = 'f') => Array.from({ length: n }, (_, i) => ({ id: prefix + i, type: 'text', props: {}, style: {} }))
  await t.test('step 1: nesting of 11 levels is accepted', () => assert.equal(validatePages([pageOf('a', [chain(11)])]), null))
  await t.test('step 2: nesting of 12 levels is accepted (SRS: depth 12 is the upper boundary)', () => assert.equal(validatePages([pageOf('a', [chain(12)])]), null))
  await t.test('step 3: nesting of 13 levels is refused', () => assert.match(validatePages([pageOf('a', [chain(13)])]), /at most 12 levels/))
  await t.test('step 4: 2000 components are accepted', () => assert.equal(validatePages([pageOf('a', flat(2000))]), null))
  await t.test('step 5: 2001 components are refused', () => assert.match(validatePages([pageOf('a', flat(2001))]), /at most 2000 components/))
  await t.test('step 6: the count is kept over several pages (1000 + 1000 accepted, 1000 + 1001 refused)', () => {
    assert.equal(validatePages([pageOf('a', flat(1000)), pageOf('b', flat(1000, 'g'))]), null)
    assert.match(validatePages([pageOf('a', flat(1000)), pageOf('b', flat(1001, 'g'))]), /at most 2000 components/)
  })
  await t.test('step 7: countComponents counts nested nodes', () => {
    assert.equal(countComponents(undefined), 0)
    assert.equal(countComponents([]), 0)
    assert.equal(countComponents([chain(5)]), 5)
    assert.equal(countComponents(flat(3)), 3)
  })
})

// ------------------------------------------------------------------------------------------ WB-06
test('WB-06 middleware: requireAuth, requireAdmin, requireRole and optionalAuth paths that need no database', async () => {
  const run = async (authorization) => {
    const res = mockRes()
    let nextCalled = false
    await requireAuth(mockReq(authorization), res, () => { nextCalled = true })
    return { res, nextCalled }
  }
  let r = await run(undefined)
  assert.deepEqual([r.res.code, r.nextCalled], [401, false])
  r = await run('Basic abc')
  assert.equal(r.res.code, 401)
  r = await run('Bearer garbage')
  assert.equal(r.res.code, 401)
  assert.match(r.res.body.message, /session is invalid/)
  r = await run('Bearer ' + jwt.sign({ sub: '507f1f77bcf86cd799439011' }, SECRET, { expiresIn: -10 }))
  assert.equal(r.res.code, 401)
  r = await run('Bearer ' + jwt.sign({ sub: '507f1f77bcf86cd799439011' }, 'another-secret-value-of-32-characters!'))
  assert.equal(r.res.code, 401)
  r = await run('Bearer ' + jwt.sign({ sub: 'not-an-object-id' }, SECRET))
  assert.equal(r.res.code, 401)
  r = await run('Bearer ' + jwt.sign({ other: 1 }, SECRET))
  assert.equal(r.res.code, 401)

  const admin = (user) => { const res = mockRes(); let n = false; requireAdmin({ user }, res, () => { n = true }); return { res, n } }
  assert.equal(admin(undefined).res.code, 403)
  assert.equal(admin({ role: 'Developer' }).res.code, 403)
  assert.equal(admin({ role: 'Admin' }).n, true)

  const role = (user) => { const res = mockRes(); let n = false; requireRole('Admin', 'Developer')({ user }, res, () => { n = true }); return { res, n } }
  assert.equal(role(undefined).res.code, 401)
  assert.equal(role({ role: 'Visitor' }).res.code, 403)
  assert.equal(role({ role: 'Developer' }).n, true)

  let called = 0
  const req1 = mockReq(undefined)
  await optionalAuth(req1, mockRes(), () => { called += 1 })
  const req2 = mockReq('Bearer garbage')
  await optionalAuth(req2, mockRes(), () => { called += 1 })
  assert.equal(called, 2)
  assert.equal(req1.user, undefined)
  assert.equal(req2.user, undefined)
})

// ------------------------------------------------------------------------------------------ admin controller (models are replaced by test doubles)
const TARGET = '507f1f77bcf86cd799439011'
const CALLER = '507f1f77bcf86cd799439012'

function stubModels(t, cfg = {}) {
  const calls = { findById: 0, records: [], tables: [], listings: [], profile: [], projects: [], pull: [], log: [] }
  t.mock.method(UserModel, 'findById', async () => { calls.findById += 1; if (cfg.findError) throw cfg.findError; return cfg.user ?? null })
  t.mock.method(ProjectModel, 'find', () => ({ select: async () => cfg.projects ?? [] }))
  t.mock.method(DataTableModel, 'find', () => ({ select: async () => cfg.tables ?? [] }))
  t.mock.method(TableRecordModel, 'deleteMany', async (q) => { calls.records.push(q) })
  t.mock.method(DataTableModel, 'deleteMany', async (q) => { calls.tables.push(q) })
  t.mock.method(ListingModel, 'deleteMany', async (q) => { calls.listings.push(q) })
  t.mock.method(ProfileModel, 'deleteOne', async (q) => { calls.profile.push(q) })
  t.mock.method(ProjectModel, 'deleteMany', async (q) => { calls.projects.push(q) })
  t.mock.method(ProjectModel, 'updateMany', async (q, u) => { calls.pull.push([q, u]) })
  t.mock.method(ActivityLogModel, 'create', async (doc) => { calls.log.push(doc) })
  return calls
}
const target = (extra = {}, calls) => ({ _id: TARGET, id: TARGET, email: 'x@qa.test', role: 'Developer', status: 'Active', async deleteOne() { if (calls) calls.userDeleted = true }, async save() { if (calls) calls.saved = true }, ...extra })
const runDelete = async (id, calls) => {
  const res = mockRes(); let nextError = null
  await adminController.deleteUser({ params: { id }, user: { id: CALLER } }, res, (e) => { nextError = e })
  return { res, nextError }
}

// ------------------------------------------------------------------------------------------ WB-07
test('WB-07 adminController.deleteUser: every branch and the cascade of the deletion', async (t) => {
  await t.test('step 1: id that is not an object id gives 404 and no database call', async (st) => {
    const calls = stubModels(st)
    const { res } = await runDelete('abc')
    assert.equal(res.code, 404)
    assert.equal(calls.findById, 0)
  })
  await t.test('step 2: the own account gives 400 and no database call', async (st) => {
    const calls = stubModels(st)
    const { res } = await runDelete(CALLER)
    assert.equal(res.code, 400)
    assert.match(res.body.message, /own account/)
    assert.equal(calls.findById, 0)
  })
  await t.test('step 3: user not found gives 404 and nothing is deleted', async (st) => {
    const calls = stubModels(st, { user: null })
    const { res } = await runDelete(TARGET)
    assert.equal(res.code, 404)
    assert.deepEqual([calls.listings.length, calls.profile.length, calls.log.length], [0, 0, 0])
  })
  await t.test('step 4: an Admin account gives 400 and nothing is deleted', async (st) => {
    const calls = {}
    const stubs = stubModels(st, { user: target({ role: 'Admin' }, calls) })
    const { res } = await runDelete(TARGET)
    assert.equal(res.code, 400)
    assert.match(res.body.message, /Admin accounts cannot be deleted/)
    assert.equal(calls.userDeleted, undefined)
    assert.deepEqual([stubs.listings.length, stubs.profile.length, stubs.pull.length, stubs.log.length], [0, 0, 0, 0])
  })
  await t.test('step 5: user without projects: profile, listings and collaborator entries are removed, the user is deleted and the deletion is logged', async (st) => {
    const calls = {}
    const stubs = stubModels(st, { user: target({}, calls), projects: [] })
    const { res } = await runDelete(TARGET)
    assert.equal(res.code, null) // success answers with res.json() only (status 200 by default)
    assert.deepEqual(res.body, { ok: true, deleted: { projects: 0 } })
    assert.equal(calls.userDeleted, true)
    assert.equal(stubs.listings.length, 1)
    assert.deepEqual(stubs.listings[0], { developer: TARGET })
    assert.deepEqual(stubs.profile, [{ user: TARGET }])
    assert.deepEqual(stubs.pull[0][1], { $pull: { collaborators: { user: TARGET } } })
    assert.equal(stubs.projects.length, 0)
    assert.equal(stubs.records.length, 0)
    assert.equal(stubs.log[0].action, 'user.delete')
    assert.equal(stubs.log[0].meta.projects, 0)
  })
  await t.test('step 6: user with 2 projects and 1 table: records, table, listings and projects are deleted first', async (st) => {
    const calls = {}
    const stubs = stubModels(st, { user: target({}, calls), projects: [{ _id: 'p1' }, { _id: 'p2' }], tables: [{ _id: 't1' }] })
    const { res } = await runDelete(TARGET)
    assert.deepEqual(res.body, { ok: true, deleted: { projects: 2 } })
    assert.deepEqual(stubs.records, [{ table: { $in: ['t1'] } }])
    assert.deepEqual(stubs.tables, [{ project: { $in: ['p1', 'p2'] } }])
    assert.deepEqual(stubs.listings, [{ project: { $in: ['p1', 'p2'] } }, { developer: TARGET }])
    assert.deepEqual(stubs.projects, [{ _id: { $in: ['p1', 'p2'] } }])
    assert.equal(stubs.log[0].meta.projects, 2)
    assert.equal(calls.userDeleted, true)
  })
  await t.test('step 7: projects without tables: no table or record is deleted but the projects are', async (st) => {
    const calls = {}
    const stubs = stubModels(st, { user: target({}, calls), projects: [{ _id: 'p1' }], tables: [] })
    const { res } = await runDelete(TARGET)
    assert.deepEqual(res.body, { ok: true, deleted: { projects: 1 } })
    assert.equal(stubs.records.length, 0)
    assert.equal(stubs.tables.length, 0)
    assert.equal(stubs.projects.length, 1)
  })
  await t.test('step 8: a database error is passed to next() and nothing is answered', async (st) => {
    const boom = new Error('database down')
    stubModels(st, { findError: boom })
    const { res, nextError } = await runDelete(TARGET)
    assert.equal(nextError, boom)
    assert.equal(res.code, null)
  })
})

// ------------------------------------------------------------------------------------------ WB-08
const runStatus = async (id, body, ownId = CALLER) => {
  const res = mockRes(); let nextError = null
  await adminController.updateUserStatus({ params: { id }, body, user: { id: ownId } }, res, (e) => { nextError = e })
  return { res, nextError }
}
test('WB-08 adminController.updateUserStatus: every branch', async (t) => {
  await t.test('step 1: id that is not an object id gives 404', async (st) => {
    stubModels(st)
    assert.equal((await runStatus('abc', { status: 'Active' })).res.code, 404)
  })
  await t.test('step 2: status other than Active or Suspended gives 400 (also without a body)', async (st) => {
    const stubs = stubModels(st)
    assert.equal((await runStatus(TARGET, { status: 'Banned' })).res.code, 400)
    assert.equal((await runStatus(TARGET, undefined)).res.code, 400)
    assert.equal(stubs.findById, 0)
  })
  await t.test('step 3: the own account gives 400', async (st) => {
    stubModels(st)
    const { res } = await runStatus(CALLER, { status: 'Suspended' })
    assert.equal(res.code, 400)
    assert.match(res.body.message, /own account/)
  })
  await t.test('step 4: user not found gives 404', async (st) => {
    stubModels(st, { user: null })
    assert.equal((await runStatus(TARGET, { status: 'Suspended' })).res.code, 404)
  })
  await t.test('step 5: suspending an Admin gives 400 and the status is not saved', async (st) => {
    const calls = {}
    stubModels(st, { user: target({ role: 'Admin' }, calls) })
    assert.equal((await runStatus(TARGET, { status: 'Suspended' })).res.code, 400)
    assert.equal(calls.saved, undefined)
  })
  await t.test('step 6: suspending a Developer saves the status and logs user.suspend', async (st) => {
    const calls = {}
    const stubs = stubModels(st, { user: target({}, calls) })
    const { res } = await runStatus(TARGET, { status: 'Suspended' })
    assert.equal(res.body.user.status, 'Suspended')
    assert.equal(calls.saved, true)
    assert.equal(stubs.log[0].action, 'user.suspend')
  })
  await t.test('step 7: activating a suspended Developer logs user.activate', async (st) => {
    const calls = {}
    const stubs = stubModels(st, { user: target({ status: 'Suspended' }, calls) })
    const { res } = await runStatus(TARGET, { status: 'Active' })
    assert.equal(res.body.user.status, 'Active')
    assert.equal(stubs.log[0].action, 'user.activate')
  })
  await t.test('step 8: an Admin account may be set to Active (only suspending is refused)', async (st) => {
    stubModels(st, { user: target({ role: 'Admin' }, {}) })
    assert.equal((await runStatus(TARGET, { status: 'Active' })).res.body.user.status, 'Active')
  })
  await t.test('step 9: a database error is passed to next()', async (st) => {
    const boom = new Error('database down')
    stubModels(st, { findError: boom })
    assert.equal((await runStatus(TARGET, { status: 'Active' })).nextError, boom)
  })
})

// ------------------------------------------------------------------------------------------ WB-09
const runList = async (fn, query = {}) => {
  const res = mockRes(); let nextError = null
  await fn({ query }, res, (e) => { nextError = e })
  return { res, nextError }
}
const logRow = (n, email = 'a@qa.test') => ({ id: 'l' + n, action: 'x', target: 't', meta: {}, createdAt: new Date(), actor: email ? { id: 'u', name: 'N', email, role: 'Developer' } : null })
function stubLogs(t, logs, captured = {}) {
  t.mock.method(ActivityLogModel, 'find', (filter) => { captured.filter = filter; return { sort: () => ({ limit: (n) => { captured.limit = n; return { populate: async () => { if (captured.error) throw captured.error; return logs } } } }) } })
  return captured
}
test('WB-09 adminController.listUsers and listLogs: filters, limits and error paths', async (t) => {
  await t.test('step 1: listUsers returns the public fields only (no password)', async (st) => {
    st.mock.method(UserModel, 'find', () => ({ sort: () => ({ limit: async () => [{ id: 'u1', name: 'N', email: 'e@qa.test', role: 'Developer', status: 'Active', createdAt: 1, password: 'hash' }] }) }))
    const { res } = await runList(adminController.listUsers)
    assert.deepEqual(Object.keys(res.body.users[0]).sort(), ['createdAt', 'email', 'id', 'name', 'role', 'status'])
  })
  await t.test('step 2: listUsers passes a database error to next()', async (st) => {
    const boom = new Error('down')
    st.mock.method(UserModel, 'find', () => { throw boom })
    assert.equal((await runList(adminController.listUsers)).nextError, boom)
  })
  await t.test('step 3: listLogs without filters uses an empty filter and the limit 300', async (st) => {
    const c = stubLogs(st, [logRow(1)])
    const { res } = await runList(adminController.listLogs)
    assert.deepEqual(c.filter, {})
    assert.equal(c.limit, 300)
    assert.equal(res.body.logs.length, 1)
  })
  await t.test('step 4: the action filter is a case-insensitive pattern in which special characters are escaped', async (st) => {
    const c = stubLogs(st, [])
    await runList(adminController.listLogs, { action: 'user.delete' })
    assert.ok(c.filter.action instanceof RegExp)
    assert.equal(c.filter.action.test('USER.DELETE'), true)
    assert.equal(c.filter.action.test('userXdelete'), false)
  })
  await t.test('step 5: from and to make a date range; an invalid date is ignored', async (st) => {
    const c = stubLogs(st, [])
    await runList(adminController.listLogs, { from: '2026-01-01', to: '2026-12-31' })
    assert.ok(c.filter.createdAt.$gte instanceof Date && c.filter.createdAt.$lte instanceof Date)
    const c2 = stubLogs(st, [])
    await runList(adminController.listLogs, { from: 'not a date' })
    assert.equal(c2.filter.createdAt, undefined)
  })
  await t.test('step 6: the actor filter keeps the entries whose actor email contains the text (case-insensitive)', async (st) => {
    stubLogs(st, [logRow(1, 'Anna@QA.test'), logRow(2, 'bob@qa.test'), logRow(3, null)])
    const { res } = await runList(adminController.listLogs, { actor: 'ANNA' })
    assert.deepEqual(res.body.logs.map((l) => l.id), ['l1'])
  })
  await t.test('step 7: at most 200 entries are returned and an entry whose actor was deleted has actor null', async (st) => {
    const many = Array.from({ length: 300 }, (_, i) => logRow(i, i === 0 ? null : 'a@qa.test'))
    stubLogs(st, many)
    const { res } = await runList(adminController.listLogs)
    assert.equal(res.body.logs.length, 200)
    assert.equal(res.body.logs[0].actor, null)
  })
  await t.test('step 8: listLogs passes a database error to next()', async (st) => {
    const c = stubLogs(st, [])
    c.error = new Error('down')
    assert.equal((await runList(adminController.listLogs)).nextError, c.error)
  })
})
