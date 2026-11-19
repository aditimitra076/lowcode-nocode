import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../api/authApi';
import { fetchAdminListings, reviewListing } from '../api/marketplaceApi';
import { deleteUser, fetchLogs, fetchUsers, updateUserStatus } from '../api/adminApi';
import AppHeader from '../components/ui/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import { CheckIcon, StoreIcon, UsersIcon } from '../components/ui/Icons';
import { initials } from '../utils/text';
import './Home.css';
import './Screens.css';

const EMPTY_FILTERS = { action: '', actor: '', from: '', to: '' };
const TABS = [
  { id: 'reviews', label: 'Reviews' },
  { id: 'users', label: 'Users' },
  { id: 'logs', label: 'Activity log' },
];

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '';
}

export default function Admin() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [tab, setTab] = useState('reviews');
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loaded, setLoaded] = useState({}); // which tabs have their data, so a count is shown only then
  const [logDraft, setLogDraft] = useState(EMPTY_FILTERS);
  const [logFilters, setLogFilters] = useState(EMPTY_FILTERS);
  const [message, setMessage] = useState(null); // { text, type: 'success' | 'error' }
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

  const fail = (text) => setMessage({ text, type: 'error' });
  const done = (text) => setMessage({ text, type: 'success' });

  const load = useCallback(async () => {
    setMessage(null);
    const requests = {
      reviews: [() => fetchAdminListings('Pending'), (data) => setListings(data.listings || [])],
      users: [() => fetchUsers(), (data) => setUsers(data.users || [])],
      logs: [() => fetchLogs(logFilters), (data) => setLogs(data.logs || [])],
    };
    const [send, store] = requests[tab];
    const result = await send();
    if (!result.ok) {
      setMessage({ text: result.message, type: 'error' });
      return;
    }
    store(result.data);
    setLoaded((current) => ({ ...current, [tab]: true }));
  }, [tab, logFilters]);

  useEffect(() => {
    if (user?.role === 'Admin') load();
  }, [load, user]);

  const handleReview = async (listingId, action) => {
    const reason = rejectReasons[listingId] || '';
    const result = await reviewListing(listingId, { action, reason });
    if (!result.ok) {
      fail(result.message);
      return;
    }
    setListings((current) => current.filter((item) => item.id !== listingId));
    done(action === 'approve' ? 'Listing approved.' : 'Listing rejected.');
  };

  const handleStatus = async (target, status) => {
    const result = await updateUserStatus(target.id, status);
    if (!result.ok) {
      fail(result.message);
      return;
    }
    setUsers((current) => current.map((item) => (item.id === target.id ? { ...item, status } : item)));
    done(status === 'Suspended' ? 'Account suspended.' : 'Account activated.');
  };

  const handleDelete = async (target) => {
    if (
      !window.confirm(
        `Delete the account of ${target.email}? Their projects, tables and listings are deleted too. This cannot be undone.`,
      )
    ) {
      return;
    }
    const result = await deleteUser(target.id);
    if (!result.ok) {
      fail(result.message);
      return;
    }
    setUsers((current) => current.filter((item) => item.id !== target.id));
    done('Account deleted.');
  };

  const counts = { reviews: listings.length, users: users.length, logs: logs.length };

  if (!user || user.role !== 'Admin') return null;

  return (
    <div className="vf-home-wrapper">
      <div className="vf-home-container">
        <AppHeader section="Admin">
          <button type="button" className="vf-ghost-btn" onClick={() => navigate('/')}>
            Workspace
          </button>
        </AppHeader>

        <div className="vf-workspace">
          <div className="vf-workspace-head">
            <div>
              <p className="vf-eyebrow">Administration</p>
              <h1>Reviews, users and logs</h1>
              <p className="vf-muted">Approve marketplace listings, manage accounts, and review activity.</p>
            </div>
          </div>

          <div className="vf-tabs" role="tablist" aria-label="Administration">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`vf-tab${tab === item.id ? ' is-active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
                {loaded[item.id] ? <span className="vf-tab-count">{counts[item.id]}</span> : null}
              </button>
            ))}
          </div>

          {message ? (
            <div className={`vf-banner vf-banner-${message.type}`} role="status">
              {message.text}
            </div>
          ) : null}

          {tab === 'reviews' ? (
            listings.length === 0 ? (
              <EmptyState
                icon={<StoreIcon className="vf-icon-feature" color="#116dff" />}
                title="Nothing to review"
                text="Listings that developers submit for approval appear here."
              />
            ) : (
              <div className="vf-review-list">
                {listings.map((listing) => (
                  <article key={listing.id} className="vf-review-card">
                    <div className="vf-review-main">
                      <h3>{listing.name}</h3>
                      <p className="vf-review-dev">by {listing.developer?.name || 'Developer'}</p>
                      <p className="vf-review-text">{listing.description}</p>
                      <div className="vf-chip-row">
                        {(listing.tags || []).map((tag) => (
                          <span key={tag} className="vf-chip">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="vf-review-actions">
                      <textarea
                        rows={2}
                        aria-label="Rejection reason"
                        placeholder="Rejection reason (required to reject)"
                        value={rejectReasons[listing.id] || ''}
                        onChange={(event) =>
                          setRejectReasons((current) => ({ ...current, [listing.id]: event.target.value }))
                        }
                      />
                      <div className="vf-button-row">
                        <button type="button" className="vf-primary-btn" onClick={() => handleReview(listing.id, 'approve')}>
                          <CheckIcon className="vf-icon-check" color="#ffffff" />
                          <span>Approve</span>
                        </button>
                        <button type="button" className="vf-ghost-btn" onClick={() => handleReview(listing.id, 'reject')}>
                          Reject
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : null}

          {tab === 'users' ? (
            users.length === 0 ? (
              <EmptyState
                icon={<UsersIcon className="vf-icon-feature" color="#116dff" />}
                title="No users found"
                text="Registered accounts appear here."
              />
            ) : (
              <div className="vf-user-list">
                {users.map((item) => (
                  <article key={item.id} className="vf-user-row">
                    <span className="vf-user-avatar">{initials(item.name) || '?'}</span>
                    <div className="vf-user-info">
                      <strong>{item.name}</strong>
                      <span>{item.email}</span>
                    </div>
                    <span className={`vf-badge ${item.role === 'Admin' ? 'vf-badge-violet' : 'vf-badge-blue'}`}>{item.role}</span>
                    <span className={`vf-badge ${item.status === 'Active' ? 'vf-badge-green' : 'vf-badge-red'}`}>{item.status}</span>
                    <div className="vf-button-row">
                      {item.status === 'Active' ? (
                        <button type="button" className="vf-ghost-btn" onClick={() => handleStatus(item, 'Suspended')}>
                          Suspend
                        </button>
                      ) : (
                        <button type="button" className="vf-outline-btn" onClick={() => handleStatus(item, 'Active')}>
                          Activate
                        </button>
                      )}
                      {item.role !== 'Admin' && item.id !== user.id ? (
                        <button type="button" className="vf-ghost-btn vf-btn-danger" onClick={() => handleDelete(item)}>
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : null}

          {tab === 'logs' ? (
            <div>
              <form
                className="vf-filter-bar"
                onSubmit={(event) => {
                  event.preventDefault();
                  setLogFilters({ ...logDraft });
                }}
              >
                <label className="vf-field">
                  <span className="vf-field-label">Action contains</span>
                  <input
                    value={logDraft.action}
                    onChange={(event) => setLogDraft((current) => ({ ...current, action: event.target.value }))}
                    placeholder="e.g. listing.submit"
                  />
                </label>
                <label className="vf-field">
                  <span className="vf-field-label">Actor email</span>
                  <input
                    value={logDraft.actor}
                    onChange={(event) => setLogDraft((current) => ({ ...current, actor: event.target.value }))}
                    placeholder="user@example.com"
                  />
                </label>
                <label className="vf-field">
                  <span className="vf-field-label">From</span>
                  <input
                    type="date"
                    value={logDraft.from}
                    onChange={(event) => setLogDraft((current) => ({ ...current, from: event.target.value }))}
                  />
                </label>
                <label className="vf-field">
                  <span className="vf-field-label">To</span>
                  <input
                    type="date"
                    value={logDraft.to}
                    onChange={(event) => setLogDraft((current) => ({ ...current, to: event.target.value }))}
                  />
                </label>
                <div className="vf-button-row">
                  <button type="submit" className="vf-primary-btn">
                    Apply
                  </button>
                  <button
                    type="button"
                    className="vf-ghost-btn"
                    onClick={() => {
                      setLogDraft(EMPTY_FILTERS);
                      setLogFilters(EMPTY_FILTERS);
                    }}
                  >
                    Clear
                  </button>
                </div>
              </form>

              {logs.length === 0 ? (
                <EmptyState title="No entries" text="No activity log entry matches these filters." />
              ) : (
                <div className="vf-table-wrap">
                  <table className="vf-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Actor</th>
                        <th>Target</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <code>{log.action}</code>
                          </td>
                          <td>{log.actor?.email || 'system'}</td>
                          <td className="vf-table-muted">{log.target || '—'}</td>
                          <td className="vf-table-muted">{formatDateTime(log.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
