import React, { useEffect, useMemo, useState } from 'react';
import { COMPONENT_DEFS, resolveLayoutStyle } from './componentRegistry';
import { fetchRecords, fetchTables, submitPublicForm } from '../api/tableApi';
import { useBuilderStore } from '../store/builderStore';

function inputTypeForField(type) {
  if (type === 'email') return 'email';
  if (type === 'number') return 'number';
  if (type === 'date') return 'date';
  return 'text';
}

function TablePreview({ props, projectId }) {
  const [rows, setRows] = useState([]);
  const [schemaFields, setSchemaFields] = useState([]);
  const dataRevision = useBuilderStore((state) => state.dataRevision);
  const isApi =
    props.dataSource === 'api' ||
    (!props.dataSource && Boolean(props.tableId));
  const columnKeys = String(props.columns || '')
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean);
  const rowCount = Math.max(0, Number(props.rows) || 0);

  useEffect(() => {
    let cancelled = false;
    if (!isApi || !props.tableId || !projectId || !/^[a-f0-9]{24}$/i.test(projectId)) {
      setRows([]);
      setSchemaFields([]);
      return undefined;
    }

    fetchTables(projectId).then((result) => {
      if (cancelled || !result.ok) return;
      const table = (result.data.tables || []).find((item) => item.id === props.tableId);
      setSchemaFields(table?.fields || []);
    });

    fetchRecords(projectId, props.tableId).then((result) => {
      if (cancelled) return;
      if (result.ok) setRows(result.data.records || []);
      else setRows([]);
    });

    return () => {
      cancelled = true;
    };
  }, [isApi, props.tableId, projectId, dataRevision]);

  if (isApi) {
    if (!props.tableId) {
      return <div className="vf-el-placeholder">Table — choose a data table in properties</div>;
    }

    const keys = columnKeys.length
      ? columnKeys
      : schemaFields.map((field) => field.key).filter(Boolean);
    const labelFor = (key) =>
      schemaFields.find((field) => field.key === key)?.label || key;

    if (!keys.length) {
      return <div className="vf-el-placeholder">Table — select columns to fetch</div>;
    }

    return (
      <table className="vf-el-table">
        <thead>
          <tr>
            {keys.map((key) => (
              <th key={key}>{labelFor(key)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((record) => (
              <tr key={record.id}>
                {keys.map((key) => (
                  <td key={key}>{String(record.data?.[key] ?? '')}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={keys.length}>No records yet</td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  if (!columnKeys.length) {
    return <div className="vf-el-placeholder">Table — add column headers</div>;
  }

  return (
    <table className="vf-el-table">
      <thead>
        <tr>
          {columnKeys.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rowCount }, (_, rowIndex) => (
          <tr key={rowIndex}>
            {columnKeys.map((header) => (
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
  const [formKey, setFormKey] = useState(0);
  const [tableFields, setTableFields] = useState([]);
  const selectedKeys = useMemo(
    () =>
      String(node.props?.fieldKeys || '')
        .split(',')
        .map((key) => key.trim())
        .filter(Boolean),
    [node.props?.fieldKeys],
  );

  useEffect(() => {
    let cancelled = false;
    const tableId = node.props?.tableId;
    if (!tableId || !projectId || !/^[a-f0-9]{24}$/i.test(projectId)) {
      setTableFields([]);
      return undefined;
    }
    fetchTables(projectId).then((result) => {
      if (cancelled || !result.ok) return;
      const table = (result.data.tables || []).find((item) => item.id === tableId);
      setTableFields(table?.fields || []);
    });
    return () => {
      cancelled = true;
    };
  }, [node.props?.tableId, projectId]);

  const fields = useMemo(() => {
    if (!tableFields.length) {
      return selectedKeys.map((key) => ({ key, label: key, type: 'text' }));
    }
    if (!selectedKeys.length) return tableFields;
    const byKey = new Map(tableFields.map((field) => [field.key, field]));
    return selectedKeys.map(
      (key) => byKey.get(key) || { key, label: key, type: 'text' },
    );
  }, [tableFields, selectedKeys]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!previewing) return;

    if (!node.props?.tableId) {
      setStatus('Bind this form to a table id first.');
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const data = {};
    for (const field of fields) {
      if (field.type === 'boolean') {
        data[field.key] = formData.get(field.key) === 'true';
      } else {
        data[field.key] = formData.get(field.key) || '';
      }
    }

    const result = await submitPublicForm(projectId, node.id, data);
    if (result.ok) {
      form.reset();
      setFormKey((key) => key + 1);
      setStatus('Submitted.');
      useBuilderStore.getState().bumpDataRevision();

      const redirect = node.props?.redirectOnSuccess || 'none';
      if (redirect === 'url') {
        const url = String(node.props?.redirectUrl || '').trim();
        if (url && url !== '#') {
          window.location.assign(url);
          return;
        }
      }
      if (redirect === 'page') {
        const pageId = node.props?.redirectPageId;
        const pages = useBuilderStore.getState().pages || [];
        const target = pages.find((page) => page.id === pageId);
        if (target) {
          useBuilderStore.getState().setActivePage(target.id);
          setStatus(`Submitted — opened ${target.name}.`);
        }
      }
      return;
    }
    setStatus(result.message);
  };

  return (
    <form
      key={formKey}
      className="vf-el vf-el-form"
      style={style}
      onSubmit={handleSubmit}
    >
      {fields.length ? (
        <div className="vf-el-form-fields">
          {fields.map((field) => (
            <label key={field.key} className="vf-el-form-field">
              <span>{field.label || field.key}</span>
              {field.type === 'boolean' ? (
                <select name={field.key} disabled={!previewing} defaultValue="false">
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              ) : (
                <input
                  name={field.key}
                  type={inputTypeForField(field.type)}
                  disabled={!previewing}
                  required={field.type === 'email'}
                  inputMode={field.type === 'email' ? 'email' : field.type === 'number' ? 'decimal' : undefined}
                  autoComplete={field.type === 'email' ? 'email' : undefined}
                />
              )}
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
  const layoutStyle = resolveLayoutStyle(style);
  if (!def) return null;

  switch (type) {
    case 'heading':
      return <h2 style={layoutStyle}>{props.text}</h2>;
    case 'text':
      return (
        <p style={{ ...layoutStyle, margin: layoutStyle.margin ?? '0 0 12px 0' }}>{props.text}</p>
      );
    case 'image': {
      const align = props.align === 'center' || props.align === 'right' ? props.align : 'left';
      const justify =
        align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
      const imageStyle = resolveLayoutStyle({ ...style, horizontalAlign: undefined });
      const containedImageStyle = {
        ...imageStyle,
        display: 'block',
        maxWidth: '100%',
        width: imageStyle.width || '100%',
        height: 'auto',
        boxSizing: 'border-box',
      };
      return (
        <div
          className="vf-el-image-wrap"
          style={{
            display: 'flex',
            justifyContent: justify,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          {props.src ? (
            <img
              src={props.src}
              alt={props.alt || ''}
              style={containedImageStyle}
              draggable={false}
            />
          ) : (
            <div className="vf-el-placeholder" style={containedImageStyle}>
              Image — set a URL in the property panel
            </div>
          )}
        </div>
      );
    }
    case 'button': {
      const pages = useBuilderStore.getState().pages || [];
      const previewing = useBuilderStore.getState().previewing;
      const linkType = props.linkType === 'page' ? 'page' : 'url';
      const targetPage =
        linkType === 'page' ? pages.find((item) => item.id === props.pageId) : null;
      const href =
        linkType === 'page' ? targetPage?.path || '#' : props.href || '#';
      const align = style.horizontalAlign || 'left';
      const buttonStyle = {
        ...layoutStyle,
        display: 'inline-block',
        textDecoration: 'none',
        marginLeft: undefined,
        marginRight: undefined,
      };

      const button = (
        <a
          href={href}
          style={buttonStyle}
          className="vf-el-button"
          onClick={(event) => {
            if (!previewing) {
              event.preventDefault();
              return;
            }
            if (linkType === 'page') {
              event.preventDefault();
              if (targetPage) {
                useBuilderStore.getState().setActivePage(targetPage.id);
              }
            }
          }}
          {...(linkType === 'url' && previewing && href && href !== '#'
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {props.text}
        </a>
      );

      if (align === 'center' || align === 'right') {
        return (
          <div
            style={{
              display: 'flex',
              justifyContent: align === 'center' ? 'center' : 'flex-end',
              width: '100%',
            }}
          >
            {button}
          </div>
        );
      }

      return button;
    }
    case 'container':
      return (
        <div
          className="vf-el vf-el-container"
          style={{ ...layoutStyle, display: 'flex', flexDirection: 'column' }}
        >
          {children}
        </div>
      );
    case 'row':
      return (
        <div
          className="vf-el vf-el-row"
          style={{
            ...layoutStyle,
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            alignItems: 'stretch',
            minWidth: 0,
          }}
        >
          {children}
        </div>
      );
    case 'column':
      return (
        <div
          className="vf-el vf-el-column"
          style={{ ...layoutStyle, display: 'flex', flexDirection: 'column' }}
        >
          {children}
        </div>
      );
    case 'spacer':
      return (
        <div
          className="vf-el vf-el-spacer"
          style={{
            ...layoutStyle,
            height: style.height || '32px',
            width: layoutStyle.width || '100%',
            minHeight: style.height || '32px',
          }}
          aria-hidden="true"
        />
      );
    case 'divider': {
      const thickness = style.borderWidth || '1px';
      const color = style.borderColor || '#d0d0c8';
      return (
        <hr
          className="vf-el vf-el-divider"
          style={{
            ...layoutStyle,
            border: 'none',
            borderTop: `${thickness} solid ${color}`,
            height: 0,
            margin: layoutStyle.margin || '16px 0',
            width: layoutStyle.width || '100%',
          }}
        />
      );
    }
    case 'card':
      return (
        <div className="vf-el vf-el-card" style={layoutStyle}>
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
        <ul className="vf-el-list" style={layoutStyle}>
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      );
    }
    case 'table':
      return (
        <div
          style={{
            ...layoutStyle,
            padding: layoutStyle.padding,
            overflowX: 'auto',
            boxSizing: 'border-box',
          }}
        >
          <TablePreview props={props} projectId={projectId} />
        </div>
      );
    case 'form':
      return (
        <BoundForm node={node} style={{ ...layoutStyle, boxSizing: 'border-box' }}>
          {children}
        </BoundForm>
      );
    default:
      return null;
  }
}
