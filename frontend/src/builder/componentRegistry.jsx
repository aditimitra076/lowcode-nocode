import { createId } from './treeUtils';

// Component catalogue for the visual builder (SRS FR-11).
// Every definition declares its default content/style and the property-panel fields.

const TEXT_STYLE_FIELDS = [
  { key: 'color', label: 'Text colour', type: 'color', section: 'style' },
  { key: 'fontSize', label: 'Font size', type: 'text', section: 'style' },
  {
    key: 'textAlign',
    label: 'Text alignment',
    type: 'select',
    options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ],
    section: 'style',
  },
];

const LAYOUT_STYLE_FIELDS = [
  { key: 'width', label: 'Width (e.g. 480px or 80%)', type: 'text', section: 'style' },
  { key: 'maxWidth', label: 'Max width', type: 'text', section: 'style' },
  {
    key: 'horizontalAlign',
    label: 'Position on page',
    type: 'select',
    options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ],
    section: 'style',
  },
];

/** Turn width / maxWidth / horizontalAlign into real CSS for the canvas. */
export function resolveLayoutStyle(style = {}) {
  const next = { ...style };
  const align = next.horizontalAlign || 'left';
  delete next.horizontalAlign;

  if (align === 'center') {
    next.marginLeft = 'auto';
    next.marginRight = 'auto';
  } else if (align === 'right') {
    next.marginLeft = 'auto';
    next.marginRight = '0';
  }

  if (next.width || next.maxWidth || align !== 'left') {
    if (!next.display || next.display === 'inline') {
      next.display = 'block';
    }
  }

  return next;
}

export const COMPONENT_DEFS = {
  heading: {
    label: 'Heading',
    icon: 'heading',
    isContainer: false,
    defaults: {
      props: { text: 'Your heading goes here' },
      style: {
        fontSize: '28px',
        color: '#0b0b0c',
        textAlign: 'left',
        margin: '0 0 12px 0',
        width: '100%',
        horizontalAlign: 'left',
      },
    },
    fields: [
      { key: 'text', label: 'Heading text', type: 'textarea', section: 'content' },
      ...TEXT_STYLE_FIELDS,
      ...LAYOUT_STYLE_FIELDS,
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
    ],
  },
  text: {
    label: 'Text',
    icon: 'text',
    isContainer: false,
    defaults: {
      props: { text: 'Write something about your project.' },
      style: {
        fontSize: '15px',
        color: '#5f5f68',
        textAlign: 'left',
        margin: '0 0 12px 0',
        width: '100%',
        horizontalAlign: 'left',
      },
    },
    fields: [
      { key: 'text', label: 'Text', type: 'textarea', section: 'content' },
      ...TEXT_STYLE_FIELDS,
      ...LAYOUT_STYLE_FIELDS,
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
    ],
  },
  image: {
    label: 'Image',
    icon: 'image',
    isContainer: false,
    defaults: {
      props: { src: '', alt: 'Project image', align: 'left' },
      style: {
        width: '100%',
        maxWidth: '420px',
        borderRadius: '10px',
        horizontalAlign: 'left',
      },
    },
    fields: [
      { key: 'src', label: 'Image URL or upload', type: 'imageSrc', section: 'content' },
      { key: 'alt', label: 'Alt text', type: 'text', section: 'content' },
      {
        key: 'align',
        label: 'Alignment',
        type: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ],
        section: 'content',
      },
      { key: 'width', label: 'Width', type: 'text', section: 'style' },
      { key: 'maxWidth', label: 'Max width', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
    ],
  },
  button: {
    label: 'Button',
    icon: 'button',
    isContainer: false,
    defaults: {
      props: { text: 'Click me', linkType: 'url', href: '#', pageId: '' },
      style: {
        background: '#0b0b0c',
        color: '#ffffff',
        fontSize: '14px',
        padding: '10px 18px',
        borderRadius: '8px',
        width: 'auto',
        horizontalAlign: 'left',
      },
    },
    fields: [
      { key: 'text', label: 'Button text', type: 'text', section: 'content' },
      {
        key: 'linkType',
        label: 'Link type',
        type: 'select',
        options: ['url', 'page'],
        section: 'content',
      },
      { key: 'href', label: 'URL', type: 'urlWhen', section: 'content' },
      { key: 'pageId', label: 'Page', type: 'page', section: 'content' },
      { key: 'background', label: 'Background', type: 'color', section: 'style' },
      { key: 'color', label: 'Text colour', type: 'color', section: 'style' },
      { key: 'fontSize', label: 'Font size', type: 'text', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
      ...LAYOUT_STYLE_FIELDS,
    ],
  },
  container: {
    label: 'Container',
    icon: 'container',
    isContainer: true,
    defaults: {
      props: {},
      style: {
        background: '#f6f6f2',
        padding: '16px',
        borderRadius: '12px',
        width: '100%',
        horizontalAlign: 'left',
      },
    },
    fields: [
      { key: 'background', label: 'Background', type: 'color', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
      { key: 'minHeight', label: 'Minimum height', type: 'text', section: 'style' },
      ...LAYOUT_STYLE_FIELDS,
    ],
  },
  row: {
    label: 'Row',
    icon: 'row',
    isContainer: true,
    defaults: {
      props: {},
      style: {
        background: 'transparent',
        padding: '4px',
        borderRadius: '10px',
        gap: '12px',
        width: '100%',
        horizontalAlign: 'left',
      },
    },
    fields: [
      { key: 'gap', label: 'Gap', type: 'text', section: 'style' },
      { key: 'background', label: 'Background', type: 'color', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
      ...LAYOUT_STYLE_FIELDS,
    ],
  },
  column: {
    label: 'Column',
    icon: 'column',
    isContainer: true,
    defaults: {
      props: {},
      style: {
        background: 'transparent',
        padding: '4px',
        borderRadius: '10px',
        width: '100%',
        horizontalAlign: 'left',
      },
    },
    fields: [
      { key: 'background', label: 'Background', type: 'color', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
      ...LAYOUT_STYLE_FIELDS,
    ],
  },
  spacer: {
    label: 'Spacer',
    icon: 'spacer',
    isContainer: false,
    defaults: {
      props: {},
      style: {
        height: '32px',
        width: '100%',
      },
    },
    fields: [
      { key: 'height', label: 'Height', type: 'text', section: 'style' },
      ...LAYOUT_STYLE_FIELDS,
    ],
  },
  divider: {
    label: 'Divider',
    icon: 'divider',
    isContainer: false,
    defaults: {
      props: {},
      style: {
        borderColor: '#d0d0c8',
        borderWidth: '1px',
        margin: '16px 0',
        width: '100%',
        horizontalAlign: 'left',
      },
    },
    fields: [
      { key: 'borderColor', label: 'Color', type: 'color', section: 'style' },
      { key: 'borderWidth', label: 'Thickness', type: 'text', section: 'style' },
      { key: 'margin', label: 'Margin', type: 'text', section: 'style' },
      ...LAYOUT_STYLE_FIELDS,
    ],
  },
  card: {
    label: 'Card',
    icon: 'card',
    isContainer: true,
    defaults: {
      props: { title: 'Card title', text: 'A short supporting description.' },
      style: {
        background: '#ffffff',
        padding: '18px',
        borderRadius: '12px',
        border: '1px solid #e4e4df',
        width: '100%',
        maxWidth: '420px',
        horizontalAlign: 'left',
      },
    },
    fields: [
      { key: 'title', label: 'Title', type: 'text', section: 'content' },
      { key: 'text', label: 'Description', type: 'textarea', section: 'content' },
      { key: 'background', label: 'Background', type: 'color', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
      ...LAYOUT_STYLE_FIELDS,
    ],
  },
  list: {
    label: 'List',
    icon: 'list',
    isContainer: false,
    defaults: {
      props: { items: 'First list item\nSecond list item\nThird list item' },
      style: {
        fontSize: '14px',
        color: '#0b0b0c',
        padding: '4px 0',
        width: '100%',
        horizontalAlign: 'left',
      },
    },
    fields: [
      { key: 'items', label: 'Items (one per line)', type: 'textarea', section: 'content' },
      ...TEXT_STYLE_FIELDS,
      ...LAYOUT_STYLE_FIELDS,
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
    ],
  },
  table: {
    label: 'Table',
    icon: 'table',
    isContainer: false,
    defaults: {
      props: {
        dataSource: 'static',
        columns: 'Name, Email, Status',
        rows: '2',
        tableId: '',
      },
      style: {
        fontSize: '13px',
        color: '#0b0b0c',
        padding: '4px 0',
        width: '100%',
        horizontalAlign: 'left',
      },
    },
    fields: [
      {
        key: 'dataSource',
        label: 'Data source',
        type: 'select',
        options: [
          { value: 'static', label: 'Static' },
          { value: 'api', label: 'API (fetch records)' },
        ],
        section: 'content',
      },
      {
        key: 'tableId',
        label: 'Fetch from table',
        type: 'table',
        section: 'content',
        showWhen: 'api',
      },
      {
        key: 'columns',
        label: 'Columns to fetch',
        type: 'tableFields',
        section: 'content',
        showWhen: 'api',
      },
      {
        key: 'columns',
        label: 'Column headers (comma separated)',
        type: 'text',
        section: 'content',
        showWhen: 'static',
      },
      {
        key: 'rows',
        label: 'Placeholder rows',
        type: 'number',
        section: 'content',
        showWhen: 'static',
      },
      { key: 'fontSize', label: 'Font size', type: 'text', section: 'style' },
      { key: 'color', label: 'Text colour', type: 'color', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
      ...LAYOUT_STYLE_FIELDS,
    ],
  },
  form: {
    label: 'Form',
    icon: 'form',
    isContainer: true,
    defaults: {
      props: {
        submitText: 'Submit',
        tableId: '',
        fieldKeys: 'name',
        redirectOnSuccess: 'none',
        redirectUrl: '',
        redirectPageId: '',
      },
      style: {
        background: '#ffffff',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e4e4df',
        width: '100%',
        maxWidth: '480px',
        horizontalAlign: 'center',
      },
    },
    fields: [
      { key: 'tableId', label: 'Bound data table', type: 'table', section: 'content' },
      {
        key: 'fieldKeys',
        label: 'Form fields',
        type: 'tableFields',
        section: 'content',
      },
      { key: 'submitText', label: 'Submit button text', type: 'text', section: 'content' },
      {
        key: 'redirectOnSuccess',
        label: 'After successful submit',
        type: 'select',
        options: [
          { value: 'none', label: 'Stay on page' },
          { value: 'url', label: 'Redirect to URL' },
          { value: 'page', label: 'Go to project page' },
        ],
        section: 'content',
      },
      {
        key: 'redirectUrl',
        label: 'Redirect URL',
        type: 'urlWhen',
        when: { redirectOnSuccess: 'url' },
        section: 'content',
      },
      {
        key: 'redirectPageId',
        label: 'Redirect page',
        type: 'page',
        when: { redirectOnSuccess: 'page' },
        section: 'content',
      },
      { key: 'background', label: 'Background', type: 'color', section: 'style' },
      { key: 'padding', label: 'Padding', type: 'text', section: 'style' },
      { key: 'borderRadius', label: 'Corner radius', type: 'text', section: 'style' },
      ...LAYOUT_STYLE_FIELDS,
    ],
  },
};

export const COMPONENT_GROUPS = [
  { label: 'Basic', types: ['heading', 'text', 'image', 'button'] },
  { label: 'Layout', types: ['container', 'row', 'column', 'spacer', 'divider'] },
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
