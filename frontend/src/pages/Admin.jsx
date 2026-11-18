import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../api/authApi';
import { fetchAdminListings, reviewListing } from '../api/marketplaceApi';
import { fetchLogs, fetchUsers, updateUserStatus } from '../api/adminApi';
import './Home.css';

export default function Admin() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [tab, setTab] = useState('reviews');
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState('');
  const [rejectReasons, setRejectReasons] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/auth/login', { state: { from: '/admin' } });
      return;
    }
    if (user.role !== 'Admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const load = useCallback(async () => {
    setMessage('');
    if (tab === 'reviews') {
      const result = await fetchAdminListings('Pending');
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setListings(result.data.listings || []);
      return;
    }
    if (tab === 'users') {
      const result = await fetchUsers();
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setUsers(result.data.users || []);
      return;
    }
    const result = await fetchLogs();
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setLogs(result.data.logs || []);
  }, [tab]);

  useEffect(() => {
    if (user?.role === 'Admin') load();
  }, [load, user]);

  const handleReview = async (listingId, action) => {
    const reason = rejectReasons[listingId] || '';
    const result = await reviewListing(listingId, { action, reason });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setListings((current) => current.filter((item) => item.id !== listingId));
    setMessage(action === 'approve' ? 'Listing approved.' : 'Listing rejected.');
  };

  const handleStatus = async (target, status) => {
    const result = await updateUserStatus(target.id, status);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setUsers((current) =>
      current.map((item) => (item.id === target.id ? { ...item, status } : item)),
    );
  };

  if (!user || user.role !== 'Admin') return null;

  return (
    <div className="vf-home-wrapper">
      <div className="vf-home-container">
        <header className="vf-site-nav">
          <div className="vf-site-brand" onClick={() => navigate('/')}>
            <span className="vf-site-wordmark">VisualForge Admin</span>
          </div>
          <div className="vf-site-actions">
            <button type="button" className="vf-ghost-btn" onClick={() => navigate('/')}>
              Workspace
            </button>
          </div>
        </header>

        <div className="vf-workspace">
          <div className="vf-workspace-head">
            <div>
              <p className="vf-eyebrow">Administration</p>
              <h1>Reviews, users and logs</h1>
              <p className="vf-muted">Approve marketplace listings, manage accounts, and review activity.</p>
            </div>
            <div className="vf-workspace-actions">
              {['reviews', 'users', 'logs'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={tab === item ? 'vf-primary-btn' : 'vf-ghost-btn'}
                  onClick={() => setTab(item)}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {message ? <div className="vf-banner">{message}</div> : null}

          {tab === 'reviews' ? (
            <div className="vf-project-grid">
              {listings.length === 0 ? (
                <p className="vf-muted">No pending listings.</p>
              ) : (
                listings.map((listing) => (
                  <article key={listing.id} className="vf-project-card">
                    <h3>{listing.name}</h3>
                    <p className="vf-project-meta">{listing.description}</p>
                    <p className="vf-project-meta">
                      by {listing.developer?.name || 'Developer'} · {(listing.tags || []).join(', ')}
                    </p>
                    <textarea
                      rows={2}
                      placeholder="Rejection reason (required to reject)"
                      value={rejectReasons[listing.id] || ''}
                      onChange={(event) =>
                        setRejectReasons((current) => ({
                          ...current,
                          [listing.id]: event.target.value,
                        }))
                      }
                    />
                    <div className="vf-project-card-foot">
                      <button
                        type="button"
                        className="vf-outline-btn"
                        onClick={() => handleReview(listing.id, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="vf-ghost-btn"
                        onClick={() => handleReview(listing.id, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : null}

          {tab === 'users' ? (
            <div className="vf-project-grid">
              {users.map((item) => (
                <article key={item.id} className="vf-project-card">
                  <h3>{item.name}</h3>
                  <p className="vf-project-meta">
                    {item.email} · {item.role} · {item.status}
                  </p>
                  <div className="vf-project-card-foot">
                    {item.status === 'Active' ? (
                      <button
                        type="button"
                        className="vf-ghost-btn"
                        onClick={() => handleStatus(item, 'Suspended')}
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="vf-outline-btn"
                        onClick={() => handleStatus(item, 'Active')}
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {tab === 'logs' ? (
            <div className="vf-project-grid">
              {logs.map((log) => (
                <article key={log.id} className="vf-project-card">
                  <h3>{log.action}</h3>
                  <p className="vf-project-meta">
                    {log.actor?.email || 'system'} · {log.target || '—'} ·{' '}
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                  </p>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
