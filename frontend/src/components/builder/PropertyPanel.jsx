import React, { useEffect, useMemo, useState } from 'react';
import { COMPONENT_DEFS } from '../../builder/componentRegistry';
import { countNodes, findNode } from '../../builder/treeUtils';
import { useActivePage, useBuilderStore } from '../../store/builderStore';
import { assetUrl } from '../../api/client';
import { fetchTables } from '../../api/tableApi';
import { uploadFile } from '../../api/uploadApi';

const HEX_COLOUR = /^#[0-9a-f]{6}$/i;
const OBJECT_ID = /^[a-f0-9]{24}$/i;
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
const FILE_ACCEPT =
  'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/csv,application/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip,application/x-zip-compressed,.pdf,.txt,.csv,.doc,.docx,.zip';

function isImageUrl(url) {
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(String(url || ''));
}

function UploadSrcField({ field, nodeId, value, onChange, accept, buttonLabel, successLabel }) {
  const inputId = `field-${nodeId}-${field.key}`;
  const fileId = `${inputId}-file`;
  const stringValue = value == null ? '' : String(value);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setMessage('');
    const result = await uploadFile(file);
    setUploading(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    onChange(result.data.url);
    setMessage(successLabel || 'Uploaded.');
  };

  return (
    <div className="vf-field">
      <label htmlFor={inputId}>{field.label}</label>
      <input
        id={inputId}
        type="text"
        placeholder="https://… or upload below"
        value={stringValue}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="vf-upload-row">
        <input
          id={fileId}
          type="file"
          accept={accept}
          disabled={uploading}
          onChange={handleUpload}
        />
        <label htmlFor={fileId} className="vf-mini-btn">
          {uploading ? 'Uploading…' : buttonLabel}
        </label>
      </div>
      {stringValue && isImageUrl(stringValue) ? (
        <img className="vf-upload-preview" src={assetUrl(stringValue)} alt="" />
      ) : null}
      {stringValue && !isImageUrl(stringValue) ? (
        <a className="vf-field-help" href={stringValue} target="_blank" rel="noreferrer">
          Open uploaded file
        </a>
      ) : null}
      {message ? <span className="vf-field-help">{message}</span> : null}
    </div>
  );
}

function ImageSrcField(props) {
  return (
    <UploadSrcField
      {...props}
      accept={IMAGE_ACCEPT}
      buttonLabel="Upload image"
      successLabel="Image uploaded."
    />
  );
}

function FileSrcField(props) {
  return (
    <UploadSrcField
      {...props}
      accept={FILE_ACCEPT}
      buttonLabel="Upload file"
      successLabel="File uploaded."
    />
  );
}

function Field({ field, nodeId, value, onChange, tables, pages }) {
  const inputId = `field-${nodeId}-${field.key}`;
  const stringValue = value == null ? '' : String(value);
  const selectedTable = tables.find((table) => table.id === stringValue);

  if (field.type === 'imageSrc') {
    return (
      <ImageSrcField
        field={field}
        nodeId={nodeId}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (field.type === 'fileSrc') {
    return (
      <FileSrcField
        field={field}
        nodeId={nodeId}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (field.type === 'page') {
    return (
      <div className="vf-field">
        <label htmlFor={inputId}>{field.label}</label>
        <select
          id={inputId}
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select a page…</option>
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.name} ({page.path})
            </option>
          ))}
        </select>
        {!pages.length ? (
          <span className="vf-field-help">Add pages in the left panel first.</span>
        ) : null}
      </div>
    );
  }

  if (field.type === 'urlWhen') {
    return (
      <div className="vf-field">
        <label htmlFor={inputId}>{field.label}</label>
        <input
          id={inputId}
          type="url"
          placeholder="https://example.com"
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }

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

  if (field.type === 'tableColumn') {
    const columnTable = tables.find((item) => item.id === (field.tableId || ''));

    if (!columnTable) {
      return (
        <div className="vf-field">
          <label>{field.label}</label>
          <span className="vf-field-help">Choose a data table first.</span>
        </div>
      );
    }

    return (
      <div className="vf-field">
        <label htmlFor={inputId}>{field.label}</label>
        <select
          id={inputId}
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">All columns</option>
          {(columnTable.fields || []).map((item) => (
            <option key={item.key} value={item.key}>
              {item.label || item.key} ({item.key})
            </option>
          ))}
        </select>
        <span className="vf-field-help">
          Filters every Table, List and Card on this page that uses “{columnTable.name}”. Try it in
          Preview.
        </span>
      </div>
    );
  }

  if (field.type === 'range') {
    const min = field.min ?? 0;
    const max = field.max ?? 100;
    const current = Number(stringValue) || field.defaultValue || min;
    return (
      <div className="vf-field">
        <label htmlFor={inputId}>
          {field.label}: {current}
          {field.unit || ''}
        </label>
        <input
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={field.step || 1}
          value={current}
          onChange={(event) => onChange(event.target.value)}
        />
        {Number(current) !== (field.defaultValue ?? min) ? (
          <button
            type="button"
            className="vf-mini-btn"
            onClick={() => onChange(String(field.defaultValue ?? min))}
          >
            Reset
          </button>
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
    const firstOption = field.options[0];
    const fallback =
      typeof firstOption === 'string' ? firstOption : firstOption?.value || '';
    const selectValue = stringValue || fallback;
    return (
      <div className="vf-field">
        <label htmlFor={inputId}>{field.label}</label>
        <select
          id={inputId}
          value={selectValue}
          onChange={(event) => onChange(event.target.value)}
        >
          {field.options.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const label = typeof option === 'string' ? option : option.label;
            return (
              <option
                key={value}
                value={value}
                style={field.key === 'fontFamily' && value ? { fontFamily: value } : undefined}
              >
                {label}
              </option>
            );
          })}
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
  const pages = useBuilderStore((state) => state.pages);
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
  const linkType = node?.props?.linkType || 'url';
  const redirectOnSuccess = node?.props?.redirectOnSuccess || 'none';
  const dataSource =
    node?.props?.dataSource ||
    (node?.type === 'table' && node?.props?.tableId ? 'api' : 'static');
  const contentFields = useMemo(() => {
    return (def?.fields || []).filter((field) => {
      if (field.section !== 'content') return false;
      if (field.when) {
        return Object.entries(field.when).every(
          ([key, expected]) => (node?.props?.[key] || 'none') === expected,
        );
      }
      if (field.type === 'urlWhen' && linkType !== 'url') return false;
      if (field.type === 'page' && linkType !== 'page') return false;
      if (field.showWhen && field.showWhen !== dataSource) return false;
      return true;
    });
  }, [def, linkType, dataSource, redirectOnSuccess, node?.props]);
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
      field.type === 'tableFields' || field.type === 'tableColumn'
        ? { ...field, tableId: node.props?.tableId || '' }
        : field;

    return (
      <Field
        key={`${field.key}-${field.type}-${field.showWhen || 'all'}`}
        field={enriched}
        nodeId={node.id}
        tables={tables}
        pages={pages}
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
              ...(node.type === 'search' ? { column: '' } : {}),
              ...(node.type === 'table' && table
                ? { columns: (table.fields || []).map((item) => item.key).join(',') }
                : {}),
            });
            return;
          }

          if (field.key === 'linkType') {
            updateProps(node.id, {
              linkType: value,
              ...(value === 'page' ? { href: '#' } : { pageId: '' }),
            });
            return;
          }

          if (field.key === 'redirectOnSuccess') {
            updateProps(node.id, {
              redirectOnSuccess: value,
              ...(value === 'url'
                ? { redirectPageId: '' }
                : value === 'page'
                  ? { redirectUrl: '' }
                  : { redirectUrl: '', redirectPageId: '' }),
            });
            return;
          }

          if (field.key === 'dataSource') {
            if (node.type === 'table') {
              updateProps(node.id, {
                dataSource: value,
                ...(value === 'static'
                  ? { tableId: '', columns: 'Name, Email, Status', rows: node.props?.rows || '2' }
                  : { columns: '', rows: '0' }),
              });
            } else {
              updateProps(node.id, {
                dataSource: value,
                ...(value === 'static' ? { tableId: '' } : {}),
              });
            }
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
