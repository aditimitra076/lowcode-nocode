import mongoose from 'mongoose'

// Component types supported by the visual builder.
export const COMPONENT_TYPES = [
  'heading',
  'text',
  'image',
  'file',
  'button',
  'container',
  'row',
  'column',
  'spacer',
  'divider',
  'card',
  'list',
  'table',
  'form',
  'search',
]

export const COLLABORATOR_ROLES = ['Editor', 'Viewer']

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

const collaboratorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: { type: String, required: true, trim: true, lowercase: true },
    role: { type: String, enum: COLLABORATOR_ROLES, default: 'Viewer', required: true },
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
    collaborators: {
      type: [collaboratorSchema],
      default: [],
    },
  },
  { timestamps: true },
)

const Project = mongoose.model('Project', projectSchema)

export default Project
