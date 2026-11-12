import React from 'react';
import { COMPONENT_DEFS } from './componentRegistry';

function TablePreview({ props }) {
  const headers = String(props.columns || '')
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean);
  const rowCount = Math.max(0, Number(props.rows) || 0);
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

// Renders one component. `children` is the already-rendered child tree for
// container-like components; the editor supplies its drop zone there.
export default function ComponentBody({ node, children }) {
  const { type, props = {}, style = {} } = node;
  const def = COMPONENT_DEFS[type];
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
          <TablePreview props={props} />
        </div>
      );
    case 'form':
      return (
        <form className="vf-el vf-el-form" style={style} onSubmit={(event) => event.preventDefault()}>
          {children}
          <button type="submit" className="vf-el-submit" tabIndex={-1}>
            {props.submitText || 'Submit'}
          </button>
        </form>
      );
    default:
      return null;
  }
}
