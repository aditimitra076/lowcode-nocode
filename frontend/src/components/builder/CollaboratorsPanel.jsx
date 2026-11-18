import React, { useEffect, useState } from 'react';
import {
  addCollaborator,
  fetchCollaborators,
  removeCollaborator,
} from '../../api/projectApi';
import { useBuilderStore } from '../../store/builderStore';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export default function CollaboratorsPanel() {
  const projectId = useBuilderStore((state) => state.projectId);
  const isOwner = useBuilderStore((state) => state.isOwner);
  const [collaborators, setCollaborators] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Editor');
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!OBJECT_ID.test(projectId)) {
      setCollaborators([]);
      setMessage('Save the project first to invite collaborators.');
      return;
    }
    const result = await fetchCollaborators(projectId);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setCollaborators(result.data.collaborators || []);
    setMessage('');
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const handleInvite = async (event) => {
    event.preventDefault();
    if (!isOwner) return;
    const result = await addCollaborator(projectId, { email: email.trim(), role });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setCollaborators(result.data.collaborators || []);
    setEmail('');
    setMessage('Collaborator added.');
  };

  const handleRemove = async (userId) => {
    if (!isOwner) return;
    const result = await removeCollaborator(projectId, userId);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setCollaborators(result.data.collaborators || []);
  };

  return (
    <div className="vf-panel vf-collab">
      <div className="vf-panel-head">
        <h3>Collaborators</h3>
      </div>
      {message ? <p className="vf-panel-note">{message}</p> : null}

      <div className="vf-collab-list">
        {collaborators.map((member) => (
          <div key={member.user} className="vf-collab-item">
            <div>
              <strong>{member.email}</strong>
              <span>{member.role}</span>
            </div>
            {isOwner ? (
              <button type="button" className="vf-mini-btn" onClick={() => handleRemove(member.user)}>
                Remove
              </button>
            ) : null}
          </div>
        ))}
        {!collaborators.length && OBJECT_ID.test(projectId) ? (
          <p className="vf-panel-note">No collaborators yet.</p>
        ) : null}
      </div>

      {isOwner && OBJECT_ID.test(projectId) ? (
        <form className="vf-collab-form" onSubmit={handleInvite}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Registered user email"
            required
          />
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="Editor">Editor</option>
            <option value="Viewer">Viewer</option>
          </select>
          <button type="submit" className="vf-mini-btn">
            Invite
          </button>
        </form>
      ) : null}
    </div>
  );
}
