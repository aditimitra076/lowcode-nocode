import mongoose from 'mongoose'

const tableRecordSchema = new mongoose.Schema(
  {
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DataTable',
      required: true,
      index: true,
    },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

const TableRecord = mongoose.model('TableRecord', tableRecordSchema)

export default TableRecord
