import mongoose from 'mongoose'
import Project from '../modules/Project.js'
import DataTable from '../modules/DataTable.js'
import TableRecord from '../modules/TableRecord.js'
import { coerceRecordData } from '../utils/fieldData.js'

function findNode(nodes, id) {
  for (const node of nodes || []) {
    if (node.id === id) return node
    const nested = findNode(node.children, id)
    if (nested) return nested
  }
  return null
}

/**
 * Public create-only form submit (no JWT). Maps a form component to its bound table.
 */
export async function submitPublicForm(req, res, next) {
  const { projectId, componentId } = req.params

  if (!mongoose.isValidObjectId(projectId) || !componentId) {
    return res.status(404).json({ message: 'Form not found.' })
  }

  try {
    const project = await Project.findById(projectId)
    if (!project) {
      return res.status(404).json({ message: 'Form not found.' })
    }

    let formNode = null
    for (const page of project.pages || []) {
      formNode = findNode(page.components, componentId)
      if (formNode) break
    }

    if (!formNode || formNode.type !== 'form') {
      return res.status(404).json({ message: 'Form not found.' })
    }

    const tableId = formNode.props?.tableId
    if (!tableId || !mongoose.isValidObjectId(String(tableId))) {
      return res.status(400).json({ message: 'This form is not bound to a table.' })
    }

    const table = await DataTable.findOne({ _id: tableId, project: project._id })
    if (!table) {
      return res.status(400).json({ message: 'The bound table no longer exists.' })
    }

    const payload = req.body?.data ?? req.body
    const { data, errors } = coerceRecordData(table.fields, payload)
    if (errors.length) {
      return res.status(400).json({ message: errors[0] })
    }
    if (!Object.keys(data).length) {
      return res.status(400).json({ message: 'No valid fields were submitted.' })
    }

    const record = await TableRecord.create({ table: table._id, data })
    return res.status(201).json({
      ok: true,
      record: {
        id: record.id,
        tableId: String(table._id),
        data: record.data,
        createdAt: record.createdAt,
      },
    })
  } catch (error) {
    return next(error)
  }
}
