const API = 'http://127.0.0.1:5000'

async function req(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status} ${data.message || ''}`)
  }
  return data
}

function page(id = 'page1') {
  return {
    id,
    name: 'Home',
    path: '/',
    components: [
      {
        id: 'form1',
        type: 'form',
        props: { submitText: 'Send', tableId: '', fieldKeys: 'name,email' },
        style: {},
        children: [],
      },
    ],
  }
}

try {
  const stamp = Date.now().toString(36)
  const email = `dev_${stamp}@vf.test`
  const collabEmail = `mate_${stamp}@vf.test`

  const registered = await req('/api/auth/register', {
    method: 'POST',
    body: { name: 'Smoke Dev', email, password: 'DevPass123' },
  })
  console.log('UC01 register ok')

  const collab = await req('/api/auth/register', {
    method: 'POST',
    body: { name: 'Smoke Mate', email: collabEmail, password: 'DevPass123' },
  })
  console.log('UC06 collab user ok')

  const login = await req('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'DevPass123' },
  })
  const token = login.token
  console.log('UC01 login ok')

  const adminLogin = await req('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@vf.test', password: 'AdminPass123' },
  })
  const adminToken = adminLogin.token
  console.log('UC11 admin login ok')

  const created = await req('/api/projects', {
    method: 'POST',
    token,
    body: { name: `Smoke ${stamp}`, pages: [page()] },
  })
  const projectId = created.project.id
  console.log('UC02 create project ok', projectId)

  const listed = await req('/api/projects', { token })
  if (!listed.projects.some((item) => item.id === projectId)) throw new Error('project missing from list')
  console.log('UC02 list/open ok')

  const pages = [
    {
      ...page('page1'),
      name: 'Home',
      path: '/',
    },
    {
      id: 'page2',
      name: 'About',
      path: '/about',
      components: [],
    },
  ]
  await req(`/api/projects/${projectId}`, {
    method: 'PUT',
    token,
    body: { pages },
  })
  console.log('UC03 manage pages ok')

  const table = await req(`/api/projects/${projectId}/tables`, {
    method: 'POST',
    token,
    body: {
      name: 'Leads',
      fields: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'email', label: 'Email', type: 'email' },
      ],
    },
  })
  const tableId = table.table.id
  console.log('UC05 create table ok', tableId)

  pages[0].components[0].props.tableId = tableId
  await req(`/api/projects/${projectId}`, {
    method: 'PUT',
    token,
    body: { pages },
  })
  console.log('UC04 bind form ok')

  await req(`/api/projects/${projectId}/collaborators`, {
    method: 'POST',
    token,
    body: { email: collabEmail, role: 'Editor' },
  })
  console.log('UC06 invite collaborator ok')

  const submitted = await req(`/api/public/projects/${projectId}/forms/form1`, {
    method: 'POST',
    body: { data: { name: 'Ada', email: 'ada@example.com' } },
  })
  if (!submitted.record?.id) throw new Error('public form missing record')
  console.log('UC07 public form submit ok')

  const records = await req(`/api/projects/${projectId}/tables/${tableId}/records`, { token })
  if (!records.records.length) throw new Error('no records')
  console.log('UC05 list records ok')

  const listing = await req('/api/marketplace/listings', {
    method: 'POST',
    token,
    body: {
      projectId,
      description: 'Smoke test blueprint for VisualForge',
      tags: ['Smoke', 'Demo'],
      submit: true,
    },
  })
  const listingId = listing.listing.id
  console.log('UC08 publish ok', listingId)

  const pending = await req('/api/marketplace/admin/listings?status=Pending', { token: adminToken })
  if (!pending.listings.some((item) => item.id === listingId)) throw new Error('listing not pending')
  console.log('UC10 pending queue ok')

  await req(`/api/marketplace/admin/listings/${listingId}/review`, {
    method: 'POST',
    token: adminToken,
    body: { action: 'approve' },
  })
  console.log('UC10 approve ok')

  const publicList = await req('/api/marketplace/listings')
  if (!publicList.listings.some((item) => item.id === listingId)) throw new Error('listing not public')
  console.log('UC09 browse marketplace ok')

  const users = await req('/api/admin/users', { token: adminToken })
  const logs = await req('/api/admin/logs', { token: adminToken })
  if (!users.users.length || !logs.logs.length) throw new Error('admin users/logs empty')
  console.log('UC11 users/logs ok')

  const collabToken = collab.token
  const asCollab = await req(`/api/projects/${projectId}`, { token: collabToken })
  if (asCollab.project.accessRole !== 'Editor') throw new Error('collaborator access missing')
  console.log('UC06 collaborator access ok')

  await req(`/api/projects/${projectId}`, { method: 'DELETE', token })
  console.log('UC02 delete project ok')

  console.log('\nALL SMOKE CHECKS PASSED')
} catch (error) {
  console.error('\nSMOKE FAILED:', error.message)
  process.exitCode = 1
}
