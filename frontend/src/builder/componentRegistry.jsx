import { createId } from './treeUtils';

// Component catalogue for the visual builder (SRS FR-11).
// Every definition declares its default content/style and the property-panel fields.

const TEXT_STYLE_FIELDS = [
  { key: 'color', label: 'Text colour', type: 'color', section: 'style' },
  { key: 'fontSize', label: 'Font size', type: 'text', section: 'style' },
  {
    key: 'textAlign',
    label: 'Alignment',
    type: 'select',
    options: ['left', 'center', 'right'],
    section: 'style',
  },
];

export const COMPONENT_DEFS = {
  heading: {
    label: 'Heading',
    icon: 'heading',
    isContainer: false,
    defaults: {
      props: { text: 'Your heading goes here' },
      style: { fontSize: '28px', color: '#f8fafc', textAlign: 'left', margin: '0 0 12px 0' },
    },
    fields: [
      { key: 'text', label: 'Heading text', type: 'textarea', section: 'content' },
      ...TEXT_STYLE_FIELDS,
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
    ],
  },
  text: {
    label: 'Text',
    icon: 'text',
    isContainer: false,
    defaults: {
      props: { text: 'Write something about your project.' },
      style: { fontSize: '15px', color: '#94a3b8', textAlign: 'left', margin: '0 0 12px 0' },
    },
    fields: [
      { key: 'text', label: 'Text', type: 'textarea', section: 'content' },
      ...TEXT_STYLE_FIELDS,
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
    ],
  },
  image: {
    label: 'Image',
    icon: 'image',
    isContainer: false,
    defaults: {
      props: { src: '', alt: 'Project image' },
      style: { width: '100%', maxWidth: '420px', borderRadius: '10px' },
    },
    fields: [
      { key: 'src', label: 'Image URL', type: 'text', section: 'content' },
      { key: 'alt', label: 'Alt text', type: 'text', section: 'content' },
      { key: 'width', label: 'Width', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
    ],
  },
  button: {
    label: 'Button',
    icon: 'button',
    isContainer: false,
    defaults: {
      props: { text: 'Click me', href: '#' },
      style: {
        background: '#6366f1',
        color: '#ffffff',
        fontSize: '14px',
        padding: '10px 18px',
        borderRadius: '8px',
      },
    },
    fields: [
      { key: 'text', label: 'Button text', type: 'text', section: 'content' },
      { key: 'href', label: 'Link', type: 'text', section: 'content' },
      { key: 'background', label: 'Background', type: 'color', section: 'style' },
      { key: 'color', label: 'Text colour', type: 'color', section: 'style' },
      { key: 'fontSize', label: 'Font size', type: 'text', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
    ],
  },
  container: {
    label: 'Container',
    icon: 'container',
    isContainer: true,
    defaults: {
      props: {},
      style: { background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px' },
    },
    fields: [
      { key: 'background', label: 'Background', type: 'color', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
      { key: 'minHeight', label: 'Minimum height', type: 'text', section: 'style' },
    ],
  },
  row: {
    label: 'Row',
    icon: 'row',
    isContainer: true,
    defaults: {
      props: {},
      style: { background: 'transparent', padding: '4px', borderRadius: '10px', gap: '12px' },
    },
    fields: [
      { key: 'gap', label: 'Gap', type: 'text', section: 'style' },
      { key: 'background', label: 'Background', type: 'color', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
    ],
  },
  column: {
    label: 'Column',
    icon: 'column',
    isContainer: true,
    defaults: {
      props: {},
      style: { background: 'transparent', padding: '4px', borderRadius: '10px' },
    },
    fields: [
      { key: 'background', label: 'Background', type: 'color', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
    ],
  },
  card: {
    label: 'Card',
    icon: 'card',
    isContainer: true,
    defaults: {
      props: { title: 'Card title', text: 'A short supporting description.' },
      style: {
        background: '#121824',
        padding: '18px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      },
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text', section: 'content' },
      { key: 'text', label: 'Description', type: 'textarea', section: 'content' },
      { key: 'background', label: 'Background', type: 'color', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
    ],
  },
  list: {
    label: 'List',
    icon: 'list',
    isContainer: false,
    defaults: {
      props: { items: 'First list item\nSecond list item\nThird list item' },
      style: { fontSize: '14px', color: '#cbd5e1', padding: '4px 0' },
    },
    fields: [
      { key: 'items', label: 'Items (one per line)', type: 'textarea', section: 'content' },
      ...TEXT_STYLE_FIELDS,
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
    ],
  },
  table: {
    label: 'Table',
    icon: 'table',
    isContainer: false,
    defaults: {
      props: { columns: 'Name, Email, Status', rows: '2' },
      style: { fontSize: '13px', color: '#cbd5e1', padding: '4px 0' },
    },
    fields: [
      { key: 'columns', label: 'Column headers (comma separated)', type: 'text', section: 'content' },
      { key: 'rows', label: 'Placeholder rows', type: 'number', section: 'content' },
      { key: 'fontSize', label: 'Font size', type: 'text', section: 'style' },
      { key: 'color', label: 'Text colour', type: 'color', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
    ],
  },
  form: {
    label: 'Form',
    icon: 'form',
    isContainer: true,
    defaults: {
      props: { submitText: 'Submit' },
      style: {
        background: '#121824',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      },
    },
    fields: [
      { key: 'submitText', label: 'Submit button text', type: 'text', section: 'content' },
      { key: 'background', label: 'Background', type: 'color', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
    ],
  },
};

export const COMPONENT_GROUPS = [
  { label: 'Basic', types: ['heading', 'text', 'image', 'button'] },
  { label: 'Layout', types: ['container', 'row', 'column'] },
  { label: 'Data', types: ['form', 'list', 'table', 'card'] },
];

export function createComponent(type) {
  const def = COMPONENT_DEFS[type];
  if (!def) throw new Error(`Unknown component type: ${type}`);
  return {
    id: createId(type),
    type,
    props: { ...def.defaults.props },
    style: { ...def.defaults.style },
    children: [],
  };
}

