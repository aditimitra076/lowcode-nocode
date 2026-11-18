import mongoose from 'mongoose'

const FIELD_TYPES = ['text', 'number', 'email', 'boolean', 'date']

const fieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, maxlength: 60 },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    type: { type: String, enum: FIELD_TYPES, default: 'text' },
  },
  { _id: false },
)

const dataTableSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    fields: {
      type: [fieldSchema],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length <= 40
        },
        message: 'A table can have at most 40 fields.',
      },
    },
  },
  { timestamps: true },
)

dataTableSchema.index({ project: 1, name: 1 }, { unique: true })

const DataTable = mongoose.model('DataTable', dataTableSchema)

export { FIELD_TYPES }
export default DataTable
