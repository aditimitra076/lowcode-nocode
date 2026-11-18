import React, { useEffect, useMemo, useState } from 'react';
import {
  createRecord,
  createTable,
  deleteRecord,
  deleteTable,
  fetchRecords,
  fetchTables,
  updateTable,
} from '../../api/tableApi';

const FIELD_TYPES = ['text', 'number', 'email', 'boolean', 'date'];

function toKey(label) {
  return (
    String(label || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'field'
  );
}

export default function DataManager({ projectId, canEdit, open, onClose }) {
  const [tables, setTables] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [records, setRecords] = useState([]);
  const [tab, setTab] = useState('tables');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [newTableName, setNewTableName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('Name');
  const [draftFields, setDraftFields] = useState([]);
  const [draftName, setDraftName] = useState('');
  const [recordDraft, setRecordDraft] = useState({});

  const selected = useMemo(
    () => tables.find((table) => table.id === selectedId) || null,
    [tables, selectedId],
  );

  const loadTables = async (preferId) => {
    setLoading(true);
    const result = await fetchTables(projectId);
    setLoading(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    const next = result.data.tables || [];
    setTables(next);
    const nextId =
      preferId && next.some((table) => table.id === preferId)
        ? preferId
        : next[0]?.id || '';
    setSelectedId(nextId);
    setMessage('');
  };

  const loadRecords = async (tableId) => {
    if (!tableId) {
      setRecords([]);
      return;
    }
    const result = await fetchRecords(projectId, tableId);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setRecords(result.data.records || []);
  };

  useEffect(() => {
    if (!open) return undefined;
    loadTables();
    return undefined;
  }, [open, projectId]);

  useEffect(() => {
    if (!selected) {
      setDraftFields([]);
      setDraftName('');
      setRecords([]);
      setRecordDraft({});
      return;
    }
    setDraftName(selected.name);
    setDraftFields(
      (selected.fields || []).map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type || 'text',
      })),
    );
    setRecordDraft({});
    loadRecords(selected.id);
  }, [selected?.id, projectId]);

  if (!open) return null;

  const handleCreateTable = async (event) => {
    event.preventDefault();
    if (!canEdit) return;
    const label = newFieldLabel.trim() || 'Name';
    const result = await createTable(projectId, {
      name: newTableName.trim(),
      fields: [{ key: toKey(label), label, type: 'text' }],
    });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setNewTableName('');
    setNewFieldLabel('Name');
    await loadTables(result.data.table.id);
    setTab('fields');
    setMessage(`Created table “${result.data.table.name}”.`);
  };

  const handleSaveFields = async () => {
    if (!canEdit || !selected) return;
    const fields = draftFields
      .map((field) => ({
        key: toKey(field.key || field.label),
        label: field.label.trim() || field.key,
        type: FIELD_TYPES.includes(field.type) ? field.type : 'text',
      }))
      .filter((field) => field.key && field.label);

    if (!fields.length) {
      setMessage('Add at least one field/label.');
      return;
    }

    const result = await updateTable(projectId, selected.id, {
      name: draftName.trim() || selected.name,
      fields,
    });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    await loadTables(selected.id);
    setMessage('Table labels saved.');
  };

  const handleDeleteTable = async () => {
    if (!canEdit || !selected) return;
    if (!window.confirm(`Delete table “${selected.name}” and all its data?`)) return;
    const result = await deleteTable(projectId, selected.id);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage(`Deleted table “${selected.name}”.`);
    await loadTables();
    setTab('tables');
  };

  const handleAddField = () => {
    setDraftFields((current) => [
      ...current,
      { key: `field_${current.length + 1}`, label: `Field ${current.length + 1}`, type: 'text' },
    ]);
  };

  const handleCreateRecord = async (event) => {
    event.preventDefault();
    if (!canEdit || !selected) return;
    const result = await createRecord(projectId, selected.id, recordDraft);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setRecordDraft({});
    await loadRecords(selected.id);
    setMessage('Record added.');
  };

  const handleDeleteRecord = async (recordId) => {
    if (!canEdit || !selected) return;
    if (!window.confirm('Delete this record?')) return;
    const result = await deleteRecord(projectId, selected.id, recordId);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setRecords((current) => current.filter((item) => item.id !== recordId));
  };

  return (
    <div className="vf-modal-overlay" onClick={onClose}>
      <div
        className="vf-modal-card vf-data-manager"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Project data manager"
      >
        <div className="vf-data-manager-head">
          <div>
            <h3>Project data</h3>
            <p>Manage tables, field labels, and records for this project backend.</p>
          </div>
          <button type="button" className="vf-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="vf-data-manager-tabs">
          {['tables', 'fields', 'records'].map((item) => (
            <button
              key={item}
              type="button"
              className={tab === item ? 'is-active' : ''}
              onClick={() => setTab(item)}
            >
              {item === 'tables' ? 'Tables' : item === 'fields' ? 'Labels / Fields' : 'Data / Records'}
            </button>
          ))}
        </div>

        {message ? <p className="vf-panel-note">{message}</p> : null}
        {loading ? <p className="vf-panel-note">Loading…</p> : null}

        <div className="vf-data-manager-body">
          <aside className="vf-data-manager-side">
            <h4>Tables</h4>
            <div className="vf-data-table-list">
              {tables.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  className={table.id === selectedId ? 'is-active' : ''}
                  onClick={() => {
                    setSelectedId(table.id);
                    setTab(tab === 'tables' ? 'fields' : tab);
                  }}
                >
                  <strong>{table.name}</strong>
                  <span>{(table.fields || []).length} fields</span>
                </button>
              ))}
              {!tables.length ? <p className="vf-panel-note">No tables yet.</p> : null}
            </div>
          </aside>

          <section className="vf-data-manager-main">
            {tab === 'tables' ? (
              <div className="vf-data-section">
                <h4>Create table</h4>
                {canEdit ? (
                  <form className="vf-data-form" onSubmit={handleCreateTable}>
                    <label>
                      Table name
                      <input
                        value={newTableName}
                        onChange={(event) => setNewTableName(event.target.value)}
                        placeholder="Leads"
                        required
                      />
                    </label>
                    <label>
                      First field label
                      <input
                        value={newFieldLabel}
                        onChange={(event) => setNewFieldLabel(event.target.value)}
                        placeholder="Name"
                        required
                      />
                    </label>
                    <button type="submit" className="vf-btn vf-btn-primary">
                      Create table
                    </button>
                  </form>
                ) : (
                  <p className="vf-panel-note">View-only access.</p>
                )}

                {selected ? (
                  <div className="vf-data-danger">
                    <h4>Delete “{selected.name}”</h4>
                    <p>Removes the table schema and all stored records.</p>
                    {canEdit ? (
                      <button type="button" className="vf-danger-btn" onClick={handleDeleteTable}>
                        Delete table
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab === 'fields' ? (
              <div className="vf-data-section">
                {!selected ? (
                  <p className="vf-panel-note">Select or create a table first.</p>
                ) : (
                  <>
                    <h4>Labels / fields for “{selected.name}”</h4>
                    <label className="vf-data-inline">
                      Table name
                      <input
                        value={draftName}
                        onChange={(event) => setDraftName(event.target.value)}
                        disabled={!canEdit}
                      />
                    </label>

                    <div className="vf-data-fields">
                      {draftFields.map((field, index) => (
                        <div key={`${field.key}-${index}`} className="vf-data-field-row">
                          <input
                            value={field.label}
                            disabled={!canEdit}
                            placeholder="Label"
                            onChange={(event) => {
                              const label = event.target.value;
                              setDraftFields((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, label, key: toKey(label) }
                                    : item,
                                ),
                              );
                            }}
                          />
                          <select
                            value={field.type}
                            disabled={!canEdit}
                            onChange={(event) => {
                              const type = event.target.value;
                              setDraftFields((current) =>
                                current.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, type } : item,
                                ),
                              );
                            }}
                          >
                            {FIELD_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <code>{field.key}</code>
                          {canEdit ? (
                            <button
                              type="button"
                              className="vf-mini-btn"
                              onClick={() =>
                                setDraftFields((current) =>
                                  current.filter((_, itemIndex) => itemIndex !== index),
                                )
                              }
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {canEdit ? (
                      <div className="vf-data-actions">
                        <button type="button" className="vf-btn" onClick={handleAddField}>
                          + Field
                        </button>
                        <button type="button" className="vf-btn vf-btn-primary" onClick={handleSaveFields}>
                          Save labels
                        </button>
                        <button type="button" className="vf-danger-btn" onClick={handleDeleteTable}>
                          Delete table
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}

            {tab === 'records' ? (
              <div className="vf-data-section">
                {!selected ? (
                  <p className="vf-panel-note">Select or create a table first.</p>
                ) : (
                  <>
                    <h4>Data in “{selected.name}”</h4>

                    {canEdit ? (
                      <form className="vf-data-form" onSubmit={handleCreateRecord}>
                        {(selected.fields || []).map((field) => (
                          <label key={field.key}>
                            {field.label}
                            <input
                              value={recordDraft[field.key] ?? ''}
                              onChange={(event) =>
                                setRecordDraft((current) => ({
                                  ...current,
                                  [field.key]: event.target.value,
                                }))
                              }
                              placeholder={field.key}
                            />
                          </label>
                        ))}
                        <button type="submit" className="vf-btn vf-btn-primary">
                          Add record
                        </button>
                      </form>
                    ) : null}

                    <div className="vf-data-records">
                      {!records.length ? (
                        <p className="vf-panel-note">No records yet.</p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              {(selected.fields || []).map((field) => (
                                <th key={field.key}>{field.label}</th>
                              ))}
                              {canEdit ? <th /> : null}
                            </tr>
                          </thead>
                          <tbody>
                            {records.map((record) => (
                              <tr key={record.id}>
                                {(selected.fields || []).map((field) => (
                                  <td key={field.key}>{String(record.data?.[field.key] ?? '')}</td>
                                ))}
                                {canEdit ? (
                                  <td>
                                    <button
                                      type="button"
                                      className="vf-mini-btn"
                                      onClick={() => handleDeleteRecord(record.id)}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                ) : null}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
