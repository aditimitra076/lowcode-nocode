// Black box tests (Member 1): release testing through the HTTP interface only.
// The tester uses the requirements (SRS) and the REST interface; the expected results come from the SRS.
// Run: node test/blackbox.mjs   (the backend must be running; default http://127.0.0.1:5000, change with the variable API_URL)
// The tests create test users (qa.m1.<stamp>.*@qa.test) and two temporary Administrators (qa.admin1/2.<stamp>@qa.test);
// at the end all of them are deleted again (the users through the administrator's delete-account function).
import fs from 'node:fs'
import path from 'node:path'
import { createTestAdmin, removeTestAdmins } from './helpers/testAdmin.mjs'

const API = process.env.API_URL || 'http://127.0.0.1:5000'
const STAMP = Date.now().toString(36)
const PASSWORD = 'Test1234pass'
const email = (tag) => `qa.m1.${STAMP}.${tag}@qa.test`
const results = []
const uploaded = []

async function call(method, url, { token, body, form } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let payload
  if (form) payload = form
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetch(API + url, { method, headers, body: payload })
  let data = {}
  try { data = await res.json() } catch { /* empty body */ }
  return { status: res.status, data }
}

function record(id, step, input, expected, actual, pass) {
  results.push({ id, step, input, expected, actual, pass: Boolean(pass) })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id} ${step}  expected: ${expected}  actual: ${actual}`)
}

function check(id, step, input, expected, res, predicate, describe) {
  const actual = describe ? describe(res) : String(res.status)
  record(id, step, input, expected, actual, predicate(res))
}

async function register(tag, password = PASSWORD, extra = {}) {
  return call('POST', '/api/auth/register', { body: { name: `QA ${tag}`, email: email(tag), password, ...extra } })
}
const login = (mail, password = PASSWORD) => call('POST', '/api/auth/login', { body: { email: mail, password } })

// ---------------------------------------------------------------- BB-01
{
  const id = 'BB-01'
  const r1 = await register('a')
  check(id, '1', 'register name, new email, password Test1234pass', '201, token, role Developer, no password in answer', r1,
    (r) => r.status === 201 && typeof r.data.token === 'string' && r.data.user?.role === 'Developer' && !JSON.stringify(r.data).includes(PASSWORD) && !('password' in (r.data.user || {})),
    (r) => `${r.status}, token ${typeof r.data.token}, role ${r.data.user?.role}, password in answer: ${JSON.stringify(r.data).includes(PASSWORD) || 'password' in (r.data.user || {})}`)
  const r2 = await register('a')
  check(id, '2', 'register again with the same email', '409 already registered', r2, (r) => r.status === 409, (r) => `${r.status} ${r.data.message || ''}`)
}
// ---------------------------------------------------------------- BB-02
{
  const id = 'BB-02'
  const cases = [
    ['3', 'password abc1234 (7 characters)', 'abc1234', 400],
    ['4', 'password abcdefgh (8 characters, no digit)', 'abcdefgh', 400],
    ['5', 'password 12345678 (8 characters, no letter)', '12345678', 400],
    ['6', 'password abcd1234 (8 characters, letter and digit)', 'abcd1234', 201],
  ]
  for (const [step, input, pw, exp] of cases) {
    const r = await register('b' + step, pw)
    check(id, step, input, String(exp), r, (x) => x.status === exp)
  }
  const bad = await call('POST', '/api/auth/register', { body: { name: 'QA', email: 'not-an-email', password: PASSWORD } })
  check(id, '7', 'email not-an-email', '400', bad, (x) => x.status === 400)
  const empty = await call('POST', '/api/auth/register', { body: { name: '   ', email: email('b8'), password: PASSWORD } })
  check(id, '8', 'name with spaces only', '400', empty, (x) => x.status === 400)
}
// ---------------------------------------------------------------- BB-03
{
  const id = 'BB-03'
  const ok = await login(email('a'))
  check(id, '1', 'registered email, right password', '200 and token', ok, (r) => r.status === 200 && typeof r.data.token === 'string')
  const wrongPw = await login(email('a'), 'Wrong1234pass')
  check(id, '2', 'registered email, wrong password', '401', wrongPw, (r) => r.status === 401, (r) => `${r.status} ${r.data.message || ''}`)
  const unknown = await login(email('nobody'))
  check(id, '3', 'unknown email, any password', '401', unknown, (r) => r.status === 401, (r) => `${r.status} ${r.data.message || ''}`)
  check(id, '4', 'messages of step 2 and step 3 are the same (no user enumeration)', 'same text', unknown,
    () => wrongPw.data.message === unknown.data.message, () => wrongPw.data.message === unknown.data.message ? 'same text' : 'different text')
  const none = await call('POST', '/api/auth/login', { body: {} })
  check(id, '5', 'empty body', '401', none, (r) => r.status === 401)
}
const owner = (await login(email('a'))).data
const ownerToken = owner.token
// ---------------------------------------------------------------- BB-04
{
  const id = 'BB-04'
  const a = await call('GET', '/api/projects')
  check(id, '1', 'GET /api/projects without token', '401', a, (r) => r.status === 401)
  const b = await call('GET', '/api/projects', { token: 'abc' })
  check(id, '2', 'GET /api/projects with token "abc"', '401', b, (r) => r.status === 401)
  const c = await call('GET', '/api/admin/users', { token: ownerToken })
  check(id, '3', 'GET /api/admin/users as a Developer', '403', c, (r) => r.status === 403)
  const d = await call('POST', '/api/uploads')
  check(id, '4', 'POST /api/uploads without token', '401', d, (r) => r.status === 401)
  const e = await call('POST', '/api/marketplace/admin/listings/000000000000000000000000/review', { token: ownerToken, body: { action: 'approve' } })
  check(id, '5', 'review route as a Developer', '403', e, (r) => r.status === 403)
}
// ---------------------------------------------------------------- BB-05
const page = (i) => ({ id: `p${i}`, name: `Page ${i}`, path: `/p${i}`, components: [] })
const chain = (n) => {
  let node = { id: 'n' + n, type: 'container', props: {}, style: {}, children: [] }
  for (let i = n - 1; i >= 1; i--) node = { id: 'n' + i, type: 'container', props: {}, style: {}, children: [node] }
  return node
}
let projectId
{
  const id = 'BB-05'
  const noName = await call('POST', '/api/projects', { token: ownerToken, body: { name: '  ' } })
  check(id, '1', 'create project with empty name', '400', noName, (r) => r.status === 400)
  const created = await call('POST', '/api/projects', { token: ownerToken, body: { name: 'QA project' } })
  projectId = created.data.project?.id
  check(id, '2', 'create project with a name, no pages', '201 and project with one page', created,
    (r) => r.status === 201 && r.data.project?.pages?.length === 1, (r) => `${r.status}, pages ${r.data.project?.pages?.length}`)
  const p20 = await call('PUT', `/api/projects/${projectId}`, { token: ownerToken, body: { pages: Array.from({ length: 20 }, (_, i) => page(i)) } })
  check(id, '3', 'save 20 pages (upper boundary)', '200', p20, (r) => r.status === 200)
  const p21 = await call('PUT', `/api/projects/${projectId}`, { token: ownerToken, body: { pages: Array.from({ length: 21 }, (_, i) => page(i)) } })
  check(id, '4', 'save 21 pages (above the boundary)', '400', p21, (r) => r.status === 400, (r) => `${r.status} ${r.data.message || ''}`)
  const bad = page(1); bad.components = [{ id: 'c1', type: 'spaceship', props: {}, style: {} }]
  const unk = await call('PUT', `/api/projects/${projectId}`, { token: ownerToken, body: { pages: [bad] } })
  check(id, '5', 'save a component of unknown type', '400', unk, (r) => r.status === 400, (r) => `${r.status} ${r.data.message || ''}`)
  const reread = await call('GET', `/api/projects/${projectId}`, { token: ownerToken })
  check(id, '6', 'the stored project is unchanged by the refused saves (still 20 pages)', '20 pages', reread,
    (r) => r.data.project?.pages?.length === 20, (r) => `${r.data.project?.pages?.length} pages`)
  const d12 = await call('PUT', `/api/projects/${projectId}`, { token: ownerToken, body: { pages: [{ ...page(1), components: [chain(12)] }] } })
  check(id, '7', 'save a page tree nested 12 levels deep (upper boundary)', '200', d12, (r) => r.status === 200, (r) => `${r.status} ${r.data.message || ''}`.trim())
  const d13 = await call('PUT', `/api/projects/${projectId}`, { token: ownerToken, body: { pages: [{ ...page(1), components: [chain(13)] }] } })
  check(id, '8', 'save a page tree nested 13 levels deep (above the boundary)', '400', d13, (r) => r.status === 400, (r) => `${r.status} ${r.data.message || ''}`.trim())
  // put the 20 pages back so that the later tests start from the same state
  await call('PUT', `/api/projects/${projectId}`, { token: ownerToken, body: { pages: Array.from({ length: 20 }, (_, i) => page(i)) } })
}
// ---------------------------------------------------------------- BB-06
let tableId
{
  const id = 'BB-06'
  const fields = [
    { key: 'name', label: 'Name', type: 'text', required: true, minLength: 3 },
    { key: 'age', label: 'Age', type: 'number' },
    { key: 'email', label: 'Email', type: 'email', required: true },
  ]
  const t = await call('POST', `/api/projects/${projectId}/tables`, { token: ownerToken, body: { name: 'Customers', fields } })
  tableId = t.data.table?.id
  check(id, '1', 'create table Customers with 3 fields', '201', t, (r) => r.status === 201)
  const dup = await call('POST', `/api/projects/${projectId}/tables`, { token: ownerToken, body: { name: 'Customers', fields } })
  check(id, '2', 'create a second table with the same name', '409', dup, (r) => r.status === 409)
  const base = `/api/projects/${projectId}/tables/${tableId}/records`
  const good = await call('POST', base, { token: ownerToken, body: { name: 'Anna', age: '31', email: 'Anna@Example.com' } })
  const rec = good.data.record
  check(id, '3', 'record name Anna, age "31", email Anna@Example.com', '201, age 31 as number, email in lower case', good,
    (r) => r.status === 201 && rec?.data?.age === 31 && rec?.data?.email === 'anna@example.com', (r) => `${r.status}, age ${JSON.stringify(rec?.data?.age)}, email ${rec?.data?.email}`)
  const missing = await call('POST', base, { token: ownerToken, body: { age: 5, email: 'b@example.com' } })
  check(id, '4', 'required field name missing', '400', missing, (r) => r.status === 400, (r) => `${r.status} ${r.data.message || ''}`)
  const short = await call('POST', base, { token: ownerToken, body: { name: 'Al', email: 'b@example.com' } })
  check(id, '5', 'name Al (2 characters, minimum 3)', '400', short, (r) => r.status === 400)
  const exact = await call('POST', base, { token: ownerToken, body: { name: 'Ali', email: 'b@example.com' } })
  check(id, '6', 'name Ali (3 characters, boundary)', '201', exact, (r) => r.status === 201)
  const mail = await call('POST', base, { token: ownerToken, body: { name: 'Anna', email: 'no-at-sign' } })
  check(id, '7', 'email no-at-sign', '400', mail, (r) => r.status === 400)
  const num = await call('POST', base, { token: ownerToken, body: { name: 'Anna', age: 'abc', email: 'c@example.com' } })
  check(id, '8', 'age abc (not a number)', '400', num, (r) => r.status === 400)
  const list = await call('GET', base, { token: ownerToken })
  check(id, '9', 'list records: only the 2 valid records were stored', '2 records', list, (r) => r.data.records?.length === 2, (r) => `${r.data.records?.length} records`)
}
// ---------------------------------------------------------------- BB-07
{
  const id = 'BB-07'
  const send = async (name, type, bytes) => {
    const f = new FormData()
    f.append('file', new Blob([bytes], { type }), name)
    const r = await call('POST', '/api/uploads', { token: ownerToken, form: f })
    if (r.data.filename) uploaded.push(r.data.filename)
    return r
  }
  const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])
  check(id, '1', 'PNG file of 12 bytes, type image/png', '201 and an address', await send('dot.png', 'image/png', png), (r) => r.status === 201 && /^\/uploads\//.test(r.data.url || ''))
  check(id, '2', 'program file setup.exe, type application/x-msdownload', '400', await send('setup.exe', 'application/x-msdownload', png), (r) => r.status === 400, (r) => `${r.status} ${r.data.message || ''}`)
  const eight = 8 * 1024 * 1024
  check(id, '3', 'ZIP of exactly 8 MB', '201', await send('exact.zip', 'application/zip', new Uint8Array(eight)), (r) => r.status === 201)
  check(id, '4', 'ZIP of 8 MB + 1 byte', '400', await send('over.zip', 'application/zip', new Uint8Array(eight + 1)), (r) => r.status === 400, (r) => `${r.status} ${r.data.message || ''}`)
  const none = await call('POST', '/api/uploads', { token: ownerToken, form: new FormData() })
  check(id, '5', 'request without a file', '400', none, (r) => r.status === 400)
}
// ---------------------------------------------------------------- BB-08
{
  const id = 'BB-08'
  const b = (await register('viewer')).data
  const c = (await register('outsider')).data
  const add = await call('POST', `/api/projects/${projectId}/collaborators`, { token: ownerToken, body: { email: email('viewer'), role: 'Viewer' } })
  check(id, '1', 'owner adds a registered user as Viewer', '201', add, (r) => r.status === 201)
  const open = await call('GET', `/api/projects/${projectId}`, { token: b.token })
  check(id, '2', 'Viewer opens the project', '200', open, (r) => r.status === 200)
  const viewerSave = await call('PUT', `/api/projects/${projectId}`, { token: b.token, body: { name: 'Changed by viewer' } })
  check(id, '3', 'Viewer saves the project', '403', viewerSave, (r) => r.status === 403, (r) => `${r.status} ${r.data.message || ''}`)
  const role = await call('PATCH', `/api/projects/${projectId}/collaborators/${b.user.id}`, { token: ownerToken, body: { role: 'Editor' } })
  check(id, '4', 'owner changes the role to Editor', '200', role, (r) => r.status === 200)
  const editorSave = await call('PUT', `/api/projects/${projectId}`, { token: b.token, body: { name: 'QA project (edited)' } })
  check(id, '5', 'Editor saves the project', '200', editorSave, (r) => r.status === 200)
  const outsider = await call('GET', `/api/projects/${projectId}`, { token: c.token })
  check(id, '6', 'a user who is not a member opens the project', '404', outsider, (r) => r.status === 404)
  const unknown = await call('POST', `/api/projects/${projectId}/collaborators`, { token: ownerToken, body: { email: email('nobody'), role: 'Editor' } })
  check(id, '7', 'owner adds an email that is not registered', '404', unknown, (r) => r.status === 404)
  const self = await call('POST', `/api/projects/${projectId}/collaborators`, { token: ownerToken, body: { email: email('a'), role: 'Editor' } })
  check(id, '8', 'owner adds himself', '400', self, (r) => r.status === 400)
  const twice = await call('POST', `/api/projects/${projectId}/collaborators`, { token: ownerToken, body: { email: email('viewer'), role: 'Viewer' } })
  check(id, '9', 'owner adds the same user again', '409', twice, (r) => r.status === 409)
  const editorDelete = await call('DELETE', `/api/projects/${projectId}`, { token: b.token })
  check(id, '10', 'Editor deletes the project', 'refused (only the owner can delete)', editorDelete, (r) => [403, 404].includes(r.status), (r) => `${r.status} ${r.data.message || ''}`)
}

// ---------------------------------------------------------------- administrators for BB-09 and BB-10
const admin1 = `qa.admin1.${STAMP}@qa.test`
const admin2 = `qa.admin2.${STAMP}@qa.test`
await createTestAdmin(admin1, PASSWORD)
await createTestAdmin(admin2, PASSWORD)
const adminSession = (await login(admin1)).data
const adminToken = adminSession.token
const adminId = adminSession.user?.id
const adminUsers = async () => (await call('GET', '/api/admin/users', { token: adminToken })).data.users || []
const userByEmail = async (mail) => (await adminUsers()).find((u) => u.email === mail.toLowerCase())

// ---------------------------------------------------------------- BB-09
{
  const id = 'BB-09'
  const asAdmin = await login(admin1)
  check(id, '1', 'log in with the administrator account', '200, role Admin', asAdmin, (r) => r.status === 200 && r.data.user?.role === 'Admin', (r) => `${r.status}, role ${r.data.user?.role}`)
  const users = await call('GET', '/api/admin/users', { token: adminToken })
  check(id, '2', 'administrator lists the users', '200, the list contains the test owner', users,
    (r) => r.status === 200 && r.data.users?.some((u) => u.email === email('a')), (r) => `${r.status}, ${r.data.users?.length} users`)
  const outsider = await userByEmail(email('outsider'))
  const outsiderToken = (await login(email('outsider'))).data.token
  const suspend = await call('PATCH', `/api/admin/users/${outsider?.id}/status`, { token: adminToken, body: { status: 'Suspended' } })
  check(id, '3', 'administrator suspends a Developer', '200, status Suspended', suspend, (r) => r.status === 200 && r.data.user?.status === 'Suspended', (r) => `${r.status}, status ${r.data.user?.status}`)
  check(id, '4', 'the suspended user logs in', '403', await login(email('outsider')), (r) => r.status === 403)
  check(id, '5', 'the suspended user uses a token that was issued before', '403', await call('GET', '/api/projects', { token: outsiderToken }), (r) => r.status === 403)
  const activate = await call('PATCH', `/api/admin/users/${outsider?.id}/status`, { token: adminToken, body: { status: 'Active' } })
  const again = await login(email('outsider'))
  record(id, '6', 'administrator activates the account; the user logs in again', '200 and login 200', `${activate.status} and login ${again.status}`, activate.status === 200 && again.status === 200)
  check(id, '7', 'administrator suspends the own account', '400', await call('PATCH', `/api/admin/users/${adminId}/status`, { token: adminToken, body: { status: 'Suspended' } }), (r) => r.status === 400)
  const other = await userByEmail(admin2)
  check(id, '8', 'administrator suspends another administrator', '400', await call('PATCH', `/api/admin/users/${other?.id}/status`, { token: adminToken, body: { status: 'Suspended' } }), (r) => r.status === 400)
  check(id, '9', 'status value Banned (not Active or Suspended)', '400', await call('PATCH', `/api/admin/users/${outsider?.id}/status`, { token: adminToken, body: { status: 'Banned' } }), (r) => r.status === 400)
  // ---- delete account
  check(id, '10', 'administrator deletes the own account', '400', await call('DELETE', `/api/admin/users/${adminId}`, { token: adminToken }), (r) => r.status === 400, (r) => `${r.status} ${r.data.message || ''}`)
  check(id, '11', 'administrator deletes another administrator', '400', await call('DELETE', `/api/admin/users/${other?.id}`, { token: adminToken }), (r) => r.status === 400, (r) => `${r.status} ${r.data.message || ''}`)
  check(id, '12', 'a Developer calls the delete-account route', '403', await call('DELETE', `/api/admin/users/${outsider?.id}`, { token: ownerToken }), (r) => r.status === 403)
  check(id, '13', 'delete with an id that is not valid (abc)', '404', await call('DELETE', '/api/admin/users/abc', { token: adminToken }), (r) => r.status === 404)
  check(id, '14', 'delete with a valid id that no user has', '404', await call('DELETE', '/api/admin/users/000000000000000000000000', { token: adminToken }), (r) => r.status === 404)
  const viewer = await userByEmail(email('viewer'))
  const del = await call('DELETE', `/api/admin/users/${viewer?.id}`, { token: adminToken })
  check(id, '15', 'administrator deletes a Developer who is a collaborator of a project', '200', del, (r) => r.status === 200, (r) => `${r.status} ${JSON.stringify(r.data)}`)
  check(id, '16', 'the deleted user logs in', '401', await login(email('viewer')), (r) => r.status === 401)
  const proj = await call('GET', `/api/projects/${projectId}`, { token: ownerToken })
  check(id, '17', 'the owner opens the project: the deleted user is no longer a collaborator', 'collaborator list without the deleted user', proj,
    (r) => r.status === 200 && !r.data.project?.collaborators?.some((c) => c.email === email('viewer')), (r) => `${r.status}, ${r.data.project?.collaborators?.length} collaborators`)
  check(id, '18', 'delete the same user again', '404', await call('DELETE', `/api/admin/users/${viewer?.id}`, { token: adminToken }), (r) => r.status === 404)
  // ---- delete an account that owns a project, a table and a listing
  const victim = (await register('victim')).data
  const vp = (await call('POST', '/api/projects', { token: victim.token, body: { name: 'Victim project' } })).data.project
  const vt = (await call('POST', `/api/projects/${vp.id}/tables`, { token: victim.token, body: { name: 'Items', fields: [{ key: 'n', label: 'N', type: 'text' }] } })).data.table
  await call('POST', `/api/projects/${vp.id}/tables/${vt.id}/records`, { token: victim.token, body: { n: 'x' } })
  await call('POST', '/api/marketplace/listings', { token: victim.token, body: { projectId: vp.id, description: 'Victim listing', tags: [], screenshots: [], submit: true } })
  const isVictim = (l) => l.projectId === vp.id || l.name === 'Victim project'
  const pendingBefore = (await call('GET', '/api/marketplace/admin/listings', { token: adminToken })).data.listings || []
  const victimUser = await userByEmail(email('victim'))
  const del2 = await call('DELETE', `/api/admin/users/${victimUser?.id}`, { token: adminToken })
  check(id, '19', 'administrator deletes a Developer who owns a project with a table, a record and a pending listing', '200, 1 project deleted', del2,
    (r) => r.status === 200 && r.data.deleted?.projects === 1, (r) => `${r.status} ${JSON.stringify(r.data)}`)
  check(id, '20', 'the project of the deleted user can no longer be found', '404', await call('GET', `/api/public/projects/${vp.id}/tables`), (r) => r.status === 404)
  const pendingAfter = (await call('GET', '/api/marketplace/admin/listings', { token: adminToken })).data.listings || []
  record(id, '21', 'the pending listing of the deleted user is gone', 'in the pending list before, not after', `before ${pendingBefore.some(isVictim)}, after ${pendingAfter.some(isVictim)}`,
    pendingBefore.some(isVictim) && !pendingAfter.some(isVictim))
  const logs = await call('GET', '/api/admin/logs?action=user.delete', { token: adminToken })
  const mine = (l) => l.actor?.email === admin1
  check(id, '22', 'the activity log, filtered by user.delete, shows the deletions', '200 and at least 2 entries by the administrator', logs,
    (r) => r.status === 200 && (r.data.logs || []).filter(mine).length >= 2, (r) => `${r.status}, ${(r.data.logs || []).filter(mine).length} entries`)
  const logs2 = await call('GET', '/api/admin/logs?action=user.suspend', { token: adminToken })
  check(id, '23', 'the activity log, filtered by user.suspend, shows the suspension', '200 and at least 1 entry', logs2,
    (r) => r.status === 200 && (r.data.logs || []).some(mine), (r) => `${r.status}, ${(r.data.logs || []).filter(mine).length} entries`)
}

// ---------------------------------------------------------------- BB-10
{
  const id = 'BB-10'
  const cloner = (await register('cloner')).data
  const text = `QA marketplace listing ${STAMP}`
  const listBody = (extra = {}) => ({ projectId, description: text, tags: ['qa', 'demo'], screenshots: [], submit: true, ...extra })
  const submit = await call('POST', '/api/marketplace/listings', { token: ownerToken, body: listBody() })
  const listingId = submit.data.listing?.id
  const has = (r) => (r.data.listings || []).some((l) => l.id === listingId)
  check(id, '1', 'owner submits the project with description and 2 tags', '200, status Pending', submit, (r) => r.status === 200 && r.data.listing?.status === 'Pending', (r) => `${r.status}, status ${r.data.listing?.status}`)
  check(id, '2', 'submit with an empty description', '400', await call('POST', '/api/marketplace/listings', { token: ownerToken, body: listBody({ description: '  ' }) }), (r) => r.status === 400)
  check(id, '3', 'description of 2501 characters (above the boundary)', '400', await call('POST', '/api/marketplace/listings', { token: ownerToken, body: listBody({ description: 'x'.repeat(2501) }) }), (r) => r.status === 400)
  check(id, '4', '13 tags (above the boundary)', '400', await call('POST', '/api/marketplace/listings', { token: ownerToken, body: listBody({ tags: Array.from({ length: 13 }, (_, i) => 't' + i) }) }), (r) => r.status === 400)
  const hidden = await call('GET', '/api/marketplace/listings')
  check(id, '5', 'a visitor lists the marketplace while the listing is Pending', 'the listing is not shown', hidden, (r) => r.status === 200 && !has(r), (r) => `${r.status}, listed: ${has(r)}`)
  const pending = await call('GET', '/api/marketplace/admin/listings', { token: adminToken })
  check(id, '6', 'administrator lists the pending listings', '200 and the listing is in the list', pending, (r) => r.status === 200 && has(r))
  check(id, '7', 'reject without a reason', '400', await call('POST', `/api/marketplace/admin/listings/${listingId}/review`, { token: adminToken, body: { action: 'reject' } }), (r) => r.status === 400)
  const reject = await call('POST', `/api/marketplace/admin/listings/${listingId}/review`, { token: adminToken, body: { action: 'reject', reason: 'Add screenshots' } })
  check(id, '8', 'reject with a reason', '200, status Rejected', reject, (r) => r.status === 200 && r.data.listing?.status === 'Rejected', (r) => `${r.status}, status ${r.data.listing?.status}`)
  check(id, '9', 'review the same listing again (it is no longer Pending)', '409', await call('POST', `/api/marketplace/admin/listings/${listingId}/review`, { token: adminToken, body: { action: 'approve' } }), (r) => r.status === 409)
  const resubmit = await call('POST', '/api/marketplace/listings', { token: ownerToken, body: listBody() })
  check(id, '10', 'owner submits the rejected listing again', '200, status Pending', resubmit, (r) => r.status === 200 && r.data.listing?.status === 'Pending')
  const approve = await call('POST', `/api/marketplace/admin/listings/${listingId}/review`, { token: adminToken, body: { action: 'approve' } })
  check(id, '11', 'administrator approves the listing', '200, status Approved', approve, (r) => r.status === 200 && r.data.listing?.status === 'Approved', (r) => `${r.status}, status ${r.data.listing?.status}`)
  check(id, '12', 'a visitor lists the marketplace after the approval', 'the listing is shown', await call('GET', '/api/marketplace/listings'), has)
  check(id, '13', 'search with a word of the description', 'the listing is found', await call('GET', `/api/marketplace/listings?search=${encodeURIComponent(STAMP)}`), has)
  check(id, '14', 'search with a word that no listing has', 'the listing is not found', await call('GET', '/api/marketplace/listings?search=zzzz-no-such-word'), (r) => !has(r))
  check(id, '15', 'filter by the tag qa', 'the listing is found', await call('GET', '/api/marketplace/listings?tag=qa'), has)
  const clone = await call('POST', `/api/marketplace/listings/${listingId}/clone`, { token: cloner.token })
  const cloneId = clone.data.project?.id || clone.data.projectId
  check(id, '16', 'another user uses the approved listing as a template', '201 and a new project', clone, (r) => r.status === 201 && Boolean(cloneId), (r) => `${r.status}, project ${Boolean(cloneId)}`)
  const ct = await call('GET', `/api/projects/${cloneId}/tables`, { token: cloner.token })
  const copiedTable = (ct.data.tables || [])[0]
  const cr = copiedTable ? await call('GET', `/api/projects/${cloneId}/tables/${copiedTable.id}/records`, { token: cloner.token }) : { status: 0, data: {} }
  record(id, '17', 'the copy has the table Customers with its 2 records', 'table Customers, 2 records', `${copiedTable?.name}, ${cr.data.records?.length} records`, copiedTable?.name === 'Customers' && cr.data.records?.length === 2)
  check(id, '18', 'the owner uses the own listing as a template', '400', await call('POST', `/api/marketplace/listings/${listingId}/clone`, { token: ownerToken }), (r) => r.status === 400)
  check(id, '19', 'template with an unknown listing id', '404', await call('POST', '/api/marketplace/listings/000000000000000000000000/clone', { token: cloner.token }), (r) => r.status === 404)
  check(id, '20', 'a visitor without login uses the template', '401', await call('POST', `/api/marketplace/listings/${listingId}/clone`), (r) => r.status === 401)
  const ownerUser = await userByEmail(email('a'))
  const delOwner = await call('DELETE', `/api/admin/users/${ownerUser?.id}`, { token: adminToken })
  check(id, '21', 'administrator deletes the owner of the approved listing', '200', delOwner, (r) => r.status === 200, (r) => `${r.status} ${JSON.stringify(r.data)}`)
  check(id, '22', 'a visitor lists the marketplace after the deletion', 'the listing is no longer shown', await call('GET', '/api/marketplace/listings'), (r) => !has(r))
  check(id, '23', 'the copy of the other user is not deleted with the owner of the template', '200', await call('GET', `/api/projects/${cloneId}`, { token: cloner.token }), (r) => r.status === 200)
}

// ---------------------------------------------------------------- clean up what the tests created
let usersDeleted = 0
for (const u of await adminUsers()) {
  if (/^qa\.m1\..+@qa\.test$/.test(u.email) && u.role === 'Developer') {
    const r = await call('DELETE', `/api/admin/users/${u.id}`, { token: adminToken })
    if (r.status === 200) usersDeleted += 1
  }
}
const uploads = path.join(import.meta.dirname, '..', 'backend', 'uploads')
for (const f of uploaded) { try { fs.unlinkSync(path.join(uploads, f)) } catch { /* already gone */ } }
const adminsRemoved = await removeTestAdmins([admin1, admin2])

const out = { stamp: STAMP, when: new Date().toISOString(), cleanup: { testUsersDeleted: usersDeleted, testAdminsRemoved: adminsRemoved, filesDeleted: uploaded.length }, results }
fs.mkdirSync(path.join(import.meta.dirname, 'results'), { recursive: true })
fs.writeFileSync(path.join(import.meta.dirname, 'results', 'blackbox-results.json'), JSON.stringify(out, null, 2))
const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length} checks, ${results.length - failed.length} passed, ${failed.length} failed; cleanup: ${JSON.stringify(out.cleanup)}`)
