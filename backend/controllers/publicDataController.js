import mongoose from 'mongoose'
import Project from '../modules/Project.js'
import DataTable from '../modules/DataTable.js'
import TableRecord from '../modules/TableRecord.js'
import { serializeRecord, serializeTable } from '../utils/serializers.js'

// Any existing project can be read through the public routes, so that Preview works after a save.
// (A stricter rule, for example "only projects with an Approved listing", would be made here.)
async function loadPublicProject(projectId) {
  if (!mongoose.isValidObjectId(projectId)) return null
  return Project.findById(projectId)
}

/**
 * Public read-only table schema for marketplace Visit / preview without JWT.
 */
export async function listPublicTables(req, res, next) {
  try {
    const project = await loadPublicProject(req.params.projectId)
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' })
    }
    const tables = await DataTable.find({ project: project._id }).sort({ createdAt: 1 })
    return res.json({ tables: tables.map(serializeTable) })
  } catch (error) {
    return next(error)
  }
}

/**
 * Public read-only records for API-bound tables on Visit / preview.
 */
export async function listPublicRecords(req, res, next) {
  try {
    const project = await loadPublicProject(req.params.projectId)
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' })
    }
    if (!mongoose.isValidObjectId(req.params.tableId)) {
      return res.status(404).json({ message: 'Table not found.' })
    }
    const table = await DataTable.findOne({
      _id: req.params.tableId,
      project: project._id,
    })
    if (!table) {
      return res.status(404).json({ message: 'Table not found.' })
    }
    const records = await TableRecord.find({ table: table._id }).sort({ createdAt: -1 }).limit(500)
    return res.json({ records: records.map(serializeRecord) })
  } catch (error) {
    return next(error)
  }
}
