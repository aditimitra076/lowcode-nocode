import React, { useEffect, useState } from 'react';
import { createTable, deleteTable, fetchTables } from '../../api/tableApi';
import { useBuilderStore } from '../../store/builderStore';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export default function TablesPanel({ onOpenManager }) {
  const projectId = useBuilderStore((state) => state.projectId);
  const accessRole = useBuilderStore((state) => state.accessRole);
  const canEdit = accessRole === 'Owner' || accessRole === 'Editor' || !OBJECT_ID.test(projectId);

  const [tables, setTables] = useState([]);
  const [name, setName] = useState('');
  const [fieldLabel, setFieldLabel] = useState('Name');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!OBJECT_ID.test(projectId)) {
      setTables([]);
      setMessage('Save the project first to create tables.');
      return;
    }
    setLoading(true);
    const result = await fetchTables(projectId);
    setLoading(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setTables(result.data.tables || []);
    setMessage('');
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canEdit) return;
    const label = fieldLabel.trim() || 'Name';
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'name';
    const result = await createTable(projectId, {
      name: name.trim(),
      fields: [{ key, label, type: 'text' }],
    });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setName('');
    setFieldLabel('Name');
    setTables((current) => [...current, result.data.table]);
    setMessage('Table created.');
  };

  const handleDelete = async (table) => {
    if (!canEdit) return;
    if (!window.confirm(`Delete table "${table.name}" and its records?`)) return;
    const result = await deleteTable(projectId, table.id);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setTables((current) => current.filter((item) => item.id !== table.id));
  };

  return (
    <div className="vf-panel vf-tables">
      <div className="vf-panel-head">
        <h3>Tables</h3>
        {OBJECT_ID.test(projectId) ? (
          <button type="button" className="vf-mini-btn" onClick={onOpenManager}>
            Manage
          </button>
        ) : null}
      </div>

      {message ? <p className="vf-panel-note">{message}</p> : null}
      {loading ? <p className="vf-panel-note">Loading…</p> : null}

      <div className="vf-tables-list">
        {tables.map((table) => (
          <div key={table.id} className="vf-table-item">
            <div>
              <strong>{table.name}</strong>
              <span>{(table.fields || []).map((field) => field.label).join(', ')}</span>
            </div>
            {canEdit ? (
              <button type="button" className="vf-mini-btn" onClick={() => handleDelete(table)}>
                Delete
              </button>
            ) : null}
          </div>
        ))}
        {!loading && tables.length === 0 && OBJECT_ID.test(projectId) ? (
          <p className="vf-panel-note">No tables yet.</p>
        ) : null}
      </div>

      {canEdit && OBJECT_ID.test(projectId) ? (
        <form className="vf-table-form" onSubmit={handleCreate}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Table name"
            required
          />
          <input
            value={fieldLabel}
            onChange={(event) => setFieldLabel(event.target.value)}
            placeholder="First field label"
            required
          />
          <button type="submit" className="vf-mini-btn">
            + Table
          </button>
        </form>
      ) : null}
    </div>
  );
}
