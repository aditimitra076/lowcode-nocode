import mongoose from 'mongoose'
import DataTable, { FIELD_TYPES } from '../modules/DataTable.js'
import TableRecord from '../modules/TableRecord.js'
import { canEdit, findAccessibleProject } from '../utils/projectAccess.js'

function serializeTable(table) {
  return {
    id: table.id,
    projectId: String(table.project),
    name: table.name,
    fields: table.fields,
    createdAt: table.createdAt,
    updatedAt: table.updatedAt,
  }
}

function serializeRecord(record) {
  return {
    id: record.id,
    tableId: String(record.table),
    data: record.data || {},
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

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
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push({ key, label: label || key, type })
  }

  return result.slice(0, 40)
}

function pickRecordData(fields, payload) {
  const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {}
  const data = {}
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(source, field.key)) {
      data[field.key] = source[field.key]
    }
  }
  return data
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
    const data = pickRecordData(loaded.table.fields, req.body?.data ?? req.body)
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

    record.data = {
      ...record.data,
      ...pickRecordData(loaded.table.fields, req.body?.data ?? req.body),
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
