import React from 'react';
import { COMPONENT_DEFS } from '../../builder/componentRegistry';
import { countNodes, findNode } from '../../builder/treeUtils';
import { useActivePage, useBuilderStore } from '../../store/builderStore';

const HEX_COLOUR = /^#[0-9a-f]{6}$/i;

function Field({ field, nodeId, value, onChange }) {
  const inputId = `field-${nodeId}-${field.key}`;
  const stringValue = value == null ? '' : String(value);

  if (field.type === 'textarea') {
    return (
      <div className="vf-field">
        <label htmlFor={inputId}>{field.label}</label>
        <textarea
          id={inputId}
          rows={4}
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className="vf-field">
        <label htmlFor={inputId}>{field.label}</label>
        <select id={inputId} value={stringValue} onChange={(event) => onChange(event.target.value)}>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'color') {
    return (
      <div className="vf-field">
        <label htmlFor={inputId}>{field.label}</label>
        <div className="vf-color-field">
          <input
            id={inputId}
            type="color"
            value={HEX_COLOUR.test(stringValue) ? stringValue : '#000000'}
            onChange={(event) => onChange(event.target.value)}
          />
          <input
            type="text"
            value={stringValue}
            placeholder="transparent"
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="vf-field">
      <label htmlFor={inputId}>{field.label}</label>
      <input
        id={inputId}
        type={field.type === 'number' ? 'number' : 'text'}
        value={stringValue}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export default function PropertyPanel() {
  const page = useActivePage();
  const selectedId = useBuilderStore((state) => state.selectedId);
  const updateProps = useBuilderStore((state) => state.updateProps);
  const updateStyle = useBuilderStore((state) => state.updateStyle);
  const deleteComponent = useBuilderStore((state) => state.deleteComponent);

  const node = selectedId && page ? findNode(page.components, selectedId) : null;

  if (!node) {
    return (
      <div className="vf-panel vf-props">
        <div className="vf-panel-head">
          <h3>Properties</h3>
        </div>
        <div className="vf-props-empty">
          <p>Select a component on the canvas to edit its content and style.</p>
          <dl className="vf-props-stats">
            <div>
              <dt>Page</dt>
              <dd>{page?.name || '—'}</dd>
            </div>
            <div>
              <dt>Path</dt>
              <dd>{page?.path || '—'}</dd>
            </div>
            <div>
              <dt>Components</dt>
              <dd>{countNodes(page?.components)}</dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  const def = COMPONENT_DEFS[node.type];
  const contentFields = (def?.fields || []).filter((field) => field.section === 'content');
  const styleFields = (def?.fields || []).filter((field) => field.section === 'style');

  const renderField = (field) => (
    <Field
      key={field.key}
      field={field}
      nodeId={node.id}
      value={(field.section === 'content' ? node.props : node.style)[field.key]}
      onChange={(value) =>
        field.section === 'content'
          ? updateProps(node.id, { [field.key]: value })
          : updateStyle(node.id, { [field.key]: value })
      }
    />
  );

  return (
    <div className="vf-panel vf-props">
      <div className="vf-panel-head">
        <h3>Properties</h3>
        <span className="vf-props-type">{def?.label || node.type}</span>
      </div>

      <div className="vf-props-body">
        {contentFields.length ? (
          <section className="vf-props-section">
            <h4>Content</h4>
            {contentFields.map(renderField)}
          </section>
        ) : null}

        {styleFields.length ? (
          <section className="vf-props-section">
            <h4>Style</h4>
            {styleFields.map(renderField)}
          </section>
        ) : null}

        <section className="vf-props-section">
          <h4>Component</h4>
          <div className="vf-field">
            <label>Type</label>
            <input type="text" value={node.type} readOnly />
          </div>
          <div className="vf-field">
            <label>ID</label>
            <input type="text" value={node.id} readOnly />
          </div>
        </section>

        <button type="button" className="vf-danger-btn" onClick={() => deleteComponent(node.id)}>
          Delete component
        </button>
      </div>
    </div>
  );
}
