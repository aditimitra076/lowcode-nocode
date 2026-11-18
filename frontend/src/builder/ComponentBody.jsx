import React, { useEffect, useState } from 'react';
import { COMPONENT_DEFS } from './componentRegistry';
import { fetchRecords, submitPublicForm } from '../api/tableApi';
import { useBuilderStore } from '../store/builderStore';

function TablePreview({ props, projectId }) {
  const [rows, setRows] = useState([]);
  const headers = String(props.columns || '')
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean);
  const rowCount = Math.max(0, Number(props.rows) || 0);

  useEffect(() => {
    let cancelled = false;
    if (!props.tableId || !projectId || !/^[a-f0-9]{24}$/i.test(projectId)) {
      setRows([]);
      return undefined;
    }
    fetchRecords(projectId, props.tableId).then((result) => {
      if (cancelled) return;
      if (result.ok) setRows(result.data.records || []);
    });
    return () => {
      cancelled = true;
    };
  }, [props.tableId, projectId]);

  if (props.tableId && rows.length) {
    const keys = headers.length
      ? headers
      : Object.keys(rows[0]?.data || {});
    return (
      <table className="vf-el-table">
        <thead>
          <tr>
            {keys.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((record) => (
            <tr key={record.id}>
              {keys.map((header) => (
                <td key={header}>{String(record.data?.[header] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (!headers.length) return <div className="vf-el-placeholder">Table — add column headers</div>;

  return (
    <table className="vf-el-table">
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rowCount }, (_, rowIndex) => (
          <tr key={rowIndex}>
            {headers.map((header) => (
              <td key={header}>&mdash;</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BoundForm({ node, style, children }) {
  const projectId = useBuilderStore((state) => state.projectId);
  const previewing = useBuilderStore((state) => state.previewing);
  const [status, setStatus] = useState('');
  const fieldKeys = String(node.props?.fieldKeys || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!previewing) return;

    if (!node.props?.tableId) {
      setStatus('Bind this form to a table id first.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const data = {};
    for (const key of fieldKeys) {
      data[key] = formData.get(key) || '';
    }

    const result = await submitPublicForm(projectId, node.id, data);
    setStatus(result.ok ? 'Submitted.' : result.message);
    if (result.ok) event.currentTarget.reset();
  };

  return (
    <form className="vf-el vf-el-form" style={style} onSubmit={handleSubmit}>
      {fieldKeys.length ? (
        <div className="vf-el-form-fields">
          {fieldKeys.map((key) => (
            <label key={key} className="vf-el-form-field">
              <span>{key}</span>
              <input name={key} type="text" disabled={!previewing} />
            </label>
          ))}
        </div>
      ) : (
        children
      )}
      <button type="submit" className="vf-el-submit" tabIndex={previewing ? 0 : -1}>
        {node.props?.submitText || 'Submit'}
      </button>
      {status ? <p className="vf-el-form-status">{status}</p> : null}
    </form>
  );
}

export default function ComponentBody({ node, children }) {
  const { type, props = {}, style = {} } = node;
  const def = COMPONENT_DEFS[type];
  const projectId = useBuilderStore((state) => state.projectId);
  if (!def) return null;

  switch (type) {
    case 'heading':
      return <h2 style={style}>{props.text}</h2>;
    case 'text':
      return <p style={{ ...style, margin: style.margin ?? '0 0 12px 0' }}>{props.text}</p>;
    case 'image':
      return props.src ? (
        <img src={props.src} alt={props.alt || ''} style={style} draggable={false} />
      ) : (
        <div className="vf-el-placeholder" style={style}>
          Image — set a URL in the property panel
        </div>
      );
    case 'button':
      return (
        <a
          href={props.href || '#'}
          style={{ ...style, display: 'inline-block', textDecoration: 'none' }}
          className="vf-el-button"
        >
          {props.text}
        </a>
      );
    case 'container':
      return (
        <div className="vf-el vf-el-container" style={style}>
          {children}
        </div>
      );
    case 'row':
      return (
        <div className="vf-el vf-el-row" style={style}>
          {children}
        </div>
      );
    case 'column':
      return (
        <div className="vf-el vf-el-column" style={style}>
          {children}
        </div>
      );
    case 'card':
      return (
        <div className="vf-el vf-el-card" style={style}>
          {props.title ? <h4 className="vf-el-card-title">{props.title}</h4> : null}
          {props.text ? <p className="vf-el-card-text">{props.text}</p> : null}
          {children}
        </div>
      );
    case 'list': {
      const items = String(props.items || '')
        .split('\n')
        .filter((line) => line.trim() !== '');
      return (
        <ul className="vf-el-list" style={style}>
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      );
    }
    case 'table':
      return (
        <div style={{ padding: style.padding, overflowX: 'auto' }}>
          <TablePreview props={props} projectId={projectId} />
        </div>
      );
    case 'form':
      return (
        <BoundForm node={node} style={style}>
          {children}
        </BoundForm>
      );
    default:
      return null;
  }
}
