import mongoose from 'mongoose'

// Component types supported by the visual builder (SRS FR-11).
export const COMPONENT_TYPES = [
  'heading',
  'text',
  'image',
  'button',
  'container',
  'row',
  'column',
  'card',
  'list',
  'table',
  'form',
]

// A component tree node: id, type, properties, style settings and children.
const componentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: COMPONENT_TYPES },
    props: { type: mongoose.Schema.Types.Mixed, default: {} },
    style: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
)

componentSchema.add({ children: [componentSchema] })

const pageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    path: { type: String, required: true, trim: true, maxlength: 200 },
    components: { type: [componentSchema], default: [] },
  },
  { _id: false },
)

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    pages: {
      type: [pageSchema],
      default: [],
    },
  },
  { timestamps: true },
)

const Project = mongoose.model('Project', projectSchema)

export default Project
