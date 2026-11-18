import React, { useEffect, useMemo, useState } from 'react';
import { COMPONENT_DEFS } from '../../builder/componentRegistry';
import { countNodes, findNode } from '../../builder/treeUtils';
import { useActivePage, useBuilderStore } from '../../store/builderStore';
import { fetchTables } from '../../api/tableApi';

const HEX_COLOUR = /^#[0-9a-f]{6}$/i;
const OBJECT_ID = /^[a-f0-9]{24}$/i;

function Field({ field, nodeId, value, onChange, tables }) {
  const inputId = `field-${nodeId}-${field.key}`;
  const stringValue = value == null ? '' : String(value);
  const selectedTable = tables.find((table) => table.id === stringValue);

  if (field.type === 'table') {
    return (
      <div className="vf-field">
        <label htmlFor={inputId}>{field.label}</label>
        <select
          id={inputId}
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select a table…</option>
          {tables.map((table) => (
            <option key={table.id} value={table.id}>
              {table.name}
            </option>
          ))}
        </select>
        {!tables.length ? (
          <span className="vf-field-help">Save the project, then create a table in the left panel.</span>
        ) : null}
      </div>
    );
  }

  if (field.type === 'tableFields') {
    const tableId = field.tableId || '';
    const table = tables.find((item) => item.id === tableId);
    const selected = new Set(
      stringValue
        .split(',')
        .map((key) => key.trim())
        .filter(Boolean),
    );
    const fields = table?.fields || [];

    if (!tableId) {
      return (
        <div className="vf-field">
          <label>{field.label}</label>
          <span className="vf-field-help">Choose a bound data table first.</span>
        </div>
      );
    }

    if (!fields.length) {
      return (
        <div className="vf-field">
          <label>{field.label}</label>
          <span className="vf-field-help">This table has no fields yet.</span>
        </div>
      );
    }

    return (
      <div className="vf-field">
        <label>{field.label}</label>
        <div className="vf-field-checks">
          {fields.map((item) => {
            const checked = selected.has(item.key);
            return (
              <label key={item.key} className="vf-field-check">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = new Set(selected);
                    if (checked) next.delete(item.key);
                    else next.add(item.key);
                    onChange([...next].join(','));
                  }}
                />
                <span>
                  {item.label} <code>{item.key}</code>
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

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
      {selectedTable ? (
        <span className="vf-field-help">Using table “{selectedTable.name}”.</span>
      ) : null}
    </div>
  );
}

export default function PropertyPanel() {
  const page = useActivePage();
  const projectId = useBuilderStore((state) => state.projectId);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const updateProps = useBuilderStore((state) => state.updateProps);
  const updateStyle = useBuilderStore((state) => state.updateStyle);
  const deleteComponent = useBuilderStore((state) => state.deleteComponent);
  const [tables, setTables] = useState([]);

  const node = selectedId && page ? findNode(page.components, selectedId) : null;

  useEffect(() => {
    let cancelled = false;

    async function loadTables() {
      if (!OBJECT_ID.test(projectId || '')) {
        setTables([]);
        return;
      }
      const result = await fetchTables(projectId);
      if (cancelled) return;
      setTables(result.ok ? result.data.tables || [] : []);
    }

    loadTables();
    return () => {
      cancelled = true;
    };
  }, [projectId, selectedId]);

  const def = node ? COMPONENT_DEFS[node.type] : null;
  const contentFields = useMemo(
    () => (def?.fields || []).filter((field) => field.section === 'content'),
    [def],
  );
  const styleFields = useMemo(
    () => (def?.fields || []).filter((field) => field.section === 'style'),
    [def],
  );

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

  const renderField = (field) => {
    const enriched =
      field.type === 'tableFields'
        ? { ...field, tableId: node.props?.tableId || '' }
        : field;

    return (
      <Field
        key={field.key}
        field={enriched}
        nodeId={node.id}
        tables={tables}
        value={(field.section === 'content' ? node.props : node.style)[field.key]}
        onChange={(value) => {
          if (field.section !== 'content') {
            updateStyle(node.id, { [field.key]: value });
            return;
          }

          if (field.key === 'tableId') {
            const table = tables.find((item) => item.id === value);
            const keys = (table?.fields || []).map((item) => item.key).join(',');
            updateProps(node.id, {
              tableId: value,
              ...(node.type === 'form' ? { fieldKeys: keys } : {}),
              ...(node.type === 'table' && table
                ? { columns: (table.fields || []).map((item) => item.key).join(', ') }
                : {}),
            });
            return;
          }

          updateProps(node.id, { [field.key]: value });
        }}
      />
    );
  };

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
