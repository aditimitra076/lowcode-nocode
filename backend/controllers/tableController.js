import mongoose from 'mongoose'
import DataTable, { FIELD_TYPES } from '../modules/DataTable.js'
import TableRecord from '../modules/TableRecord.js'
import { coerceRecordData } from '../utils/fieldData.js'
import { serializeRecord, serializeTable } from '../utils/serializers.js'
import { canEdit, findAccessibleProject } from '../utils/projectAccess.js'

function normalizeFields(fields) {
  if (!Array.isArray(fields)) return []
  const seen = new Set()
  const result = []

  for (const field of fields) {
    if (!field || typeof field !== 'object') continue
    const key =
      typeof field.key === 'string'
        ? field.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
        : ''
    const label = typeof field.label === 'string' ? field.label.trim() : key
    const type = FIELD_TYPES.includes(field.type) ? field.type : 'text'
    const required = Boolean(field.required)
    const minLength = Number.isFinite(Number(field.minLength))
      ? Math.max(0, Math.min(5000, Number(field.minLength)))
      : 0
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push({ key, label: label || key, type, required, minLength })
  }

  return result.slice(0, 40)
}

async function loadEditableProject(req, res) {
  const project = await findAccessibleProject(req.params.projectId, req.user.id)
  if (!project) {
    res.status(404).json({ message: 'Project not found' })
    return null
  }
  if (!canEdit(project, req.user.id)) {
    res.status(403).json({ message: 'You have view-only access to this project.' })
    return null
  }
  return project
}

async function loadTable(req, res, { requireEdit = false } = {}) {
  const project = await findAccessibleProject(req.params.projectId, req.user.id)
  if (!project) {
    res.status(404).json({ message: 'Project not found' })
    return null
  }
  if (requireEdit && !canEdit(project, req.user.id)) {
    res.status(403).json({ message: 'You have view-only access to this project.' })
    return null
  }
  if (!mongoose.isValidObjectId(req.params.tableId)) {
    res.status(404).json({ message: 'Table not found' })
    return null
  }
  const table = await DataTable.findOne({ _id: req.params.tableId, project: project._id })
  if (!table) {
    res.status(404).json({ message: 'Table not found' })
    return null
  }
  return { project, table }
}

export async function listTables(req, res, next) {
  try {
    const project = await findAccessibleProject(req.params.projectId, req.user.id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    const tables = await DataTable.find({ project: project._id }).sort({ createdAt: 1 })
    return res.json({ tables: tables.map(serializeTable) })
  } catch (error) {
    return next(error)
  }
}

export async function createTable(req, res, next) {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  const fields = normalizeFields(req.body?.fields)

  if (!name) {
    return res.status(400).json({ message: 'A table needs a name.' })
  }
  if (!fields.length) {
    return res.status(400).json({ message: 'Add at least one field.' })
  }

  try {
    const project = await loadEditableProject(req, res)
    if (!project) return undefined

    const table = await DataTable.create({
      project: project._id,
      name,
      fields,
    })
    return res.status(201).json({ table: serializeTable(table) })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A table with that name already exists.' })
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }
    return next(error)
  }
}

export async function getTable(req, res, next) {
  try {
    const loaded = await loadTable(req, res)
    if (!loaded) return undefined
    return res.json({ table: serializeTable(loaded.table) })
  } catch (error) {
    return next(error)
  }
}

function sampleValueForType(type) {
  switch (type) {
    case 'number':
      return 1
    case 'email':
      return 'name@example.com'
    case 'boolean':
      return true
    case 'date':
      return '2026-01-15'
    default:
      return 'example'
  }
}

/**
 * Generated CRUD API docs for a project table (UC-05).
 */
export async function getTableDocs(req, res, next) {
  try {
    const loaded = await loadTable(req, res)
    if (!loaded) return undefined

    const table = serializeTable(loaded.table)
    const projectId = req.params.projectId
    const tableId = table.id
    const base = `/api/projects/${projectId}/tables/${tableId}`
    const sampleData = {}
    for (const field of table.fields || []) {
      sampleData[field.key] = sampleValueForType(field.type)
    }

    const endpoints = [
      {
        id: 'list-tables',
        method: 'GET',
        path: `/api/projects/${projectId}/tables`,
        summary: 'List all tables in this project',
        auth: 'Bearer JWT required',
      },
      {
        id: 'get-table',
        method: 'GET',
        path: base,
        summary: `Get schema for “${table.name}”`,
        auth: 'Bearer JWT required',
      },
      {
        id: 'list-records',
        method: 'GET',
        path: `${base}/records`,
        summary: `List records in “${table.name}”`,
        auth: 'Bearer JWT required',
      },
      {
        id: 'create-record',
        method: 'POST',
        path: `${base}/records`,
        summary: `Create a record in “${table.name}”`,
        auth: 'Bearer JWT required (Owner or Editor)',
        sampleBody: { data: sampleData },
      },
      {
        id: 'update-record',
        method: 'PUT',
        path: `${base}/records/:recordId`,
        summary: `Update a record in “${table.name}”`,
        auth: 'Bearer JWT required (Owner or Editor)',
        sampleBody: { data: sampleData },
      },
      {
        id: 'delete-record',
        method: 'DELETE',
        path: `${base}/records/:recordId`,
        summary: `Delete a record from “${table.name}”`,
        auth: 'Bearer JWT required (Owner or Editor)',
      },
      {
        id: 'public-form',
        method: 'POST',
        path: `/api/public/projects/${projectId}/forms/:componentId`,
        summary: 'Public form submit into a bound table (no JWT)',
        auth: 'None — form component must be bound to this table',
        sampleBody: { data: sampleData },
      },
    ]

    return res.json({
      docs: {
        table,
        baseUrl: base,
        endpoints,
      },
    })
  } catch (error) {
    return next(error)
  }
}

export async function updateTable(req, res, next) {
  try {
    const loaded = await loadTable(req, res, { requireEdit: true })
    if (!loaded) return undefined
    const { table } = loaded

    if (typeof req.body?.name === 'string' && req.body.name.trim()) {
      table.name = req.body.name.trim()
    }
    if (req.body?.fields !== undefined) {
      const fields = normalizeFields(req.body.fields)
      if (!fields.length) {
        return res.status(400).json({ message: 'Add at least one field.' })
      }
      table.fields = fields
    }

    await table.save()
    return res.json({ table: serializeTable(table) })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A table with that name already exists.' })
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message })
    }
    return next(error)
  }
}

export async function deleteTable(req, res, next) {
  try {
    const loaded = await loadTable(req, res, { requireEdit: true })
    if (!loaded) return undefined
    await TableRecord.deleteMany({ table: loaded.table._id })
    await loaded.table.deleteOne()
    return res.json({ ok: true })
  } catch (error) {
    return next(error)
  }
}

export async function listRecords(req, res, next) {
  try {
    const loaded = await loadTable(req, res)
    if (!loaded) return undefined
    const records = await TableRecord.find({ table: loaded.table._id }).sort({ createdAt: -1 }).limit(500)
    return res.json({ records: records.map(serializeRecord) })
  } catch (error) {
    return next(error)
  }
}

export async function createRecord(req, res, next) {
  try {
    const loaded = await loadTable(req, res, { requireEdit: true })
    if (!loaded) return undefined
    const { data, errors } = coerceRecordData(loaded.table.fields, req.body?.data ?? req.body)
    if (errors.length) {
      return res.status(400).json({ message: errors[0] })
    }
    const record = await TableRecord.create({ table: loaded.table._id, data })
    return res.status(201).json({ record: serializeRecord(record) })
  } catch (error) {
    return next(error)
  }
}

export async function updateRecord(req, res, next) {
  try {
    const loaded = await loadTable(req, res, { requireEdit: true })
    if (!loaded) return undefined
    if (!mongoose.isValidObjectId(req.params.recordId)) {
      return res.status(404).json({ message: 'Record not found' })
    }

    const record = await TableRecord.findOne({
      _id: req.params.recordId,
      table: loaded.table._id,
    })
    if (!record) {
      return res.status(404).json({ message: 'Record not found' })
    }

    const { data, errors } = coerceRecordData(loaded.table.fields, req.body?.data ?? req.body)
    if (errors.length) {
      return res.status(400).json({ message: errors[0] })
    }

    record.data = {
      ...record.data,
      ...data,
    }
    await record.save()
    return res.json({ record: serializeRecord(record) })
  } catch (error) {
    return next(error)
  }
}

export async function deleteRecord(req, res, next) {
  try {
    const loaded = await loadTable(req, res, { requireEdit: true })
    if (!loaded) return undefined
    if (!mongoose.isValidObjectId(req.params.recordId)) {
      return res.status(404).json({ message: 'Record not found' })
    }

    const record = await TableRecord.findOneAndDelete({
      _id: req.params.recordId,
      table: loaded.table._id,
    })
    if (!record) {
      return res.status(404).json({ message: 'Record not found' })
    }
    return res.json({ ok: true })
  } catch (error) {
    return next(error)
  }
}
