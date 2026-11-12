import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CubeIcon,
  SignInIcon,
  UserPlusIcon,
  StoreIcon,
} from '../components/ui/Icons';
import { getStoredUser, clearSession } from '../api/authApi';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getStoredUser());

  const handleLogout = () => {
    clearSession();
    setUser(null);
  };

  const savedProjects = [
    {
      id: 'proj-101',
      name: 'Customer Success Ticket System',
      description: 'Internal support ticket management with MongoDB CRUD APIs and email notifications.',
      lastUpdated: 'Today at 2:15 PM',
      pages: 4,
      tables: 2,
    },
    {
      id: 'proj-102',
      name: 'Startup Investor Presentation Portal',
      description: 'Landing page with responsive desktop/mobile view and investor waitlist form.',
      lastUpdated: 'Yesterday at 6:40 PM',
      pages: 2,
      tables: 1,
    },
  ];

  return (
    <div className="vf-home-wrapper">
      <div className="vf-home-container">
        {/* Top Navbar */}
        <header className="vf-home-navbar">
          <div className="vf-home-brand" onClick={() => navigate('/')}>
            <div className="vf-home-logo-box">
              <CubeIcon className="vf-icon-cube" stroke="#c4b5fd" />
            </div>
            <div>
              <div className="vf-home-brand-title">VisualForge Studio</div>
              <div className="vf-home-brand-sub">Visual Builder with Backend-as-a-Service</div>
            </div>
          </div>

          <div className="vf-home-nav-actions">
            <button
              type="button"
              className="vf-nav-link-btn"
              onClick={() => navigate('/marketplace')}
            >
              <StoreIcon className="vf-icon-store" color="#38bdf8" />
              <span>Marketplace (FR-41)</span>
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="vf-user-badge">
                  {user.name} ({user.role})
                </span>
                <button
                  type="button"
                  className="vf-nav-link-btn"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="vf-nav-primary-btn"
                onClick={() => navigate('/auth/login')}
              >
                <SignInIcon className="vf-icon-tab" />
                <span>Sign In (FR-02)</span>
              </button>
            )}
          </div>
        </header>

        {user ? (
          /* Authenticated Developer Workspace View (FR-04) */
          <div>
            <div className="vf-workspace-header">
              <div>
                <h1 className="vf-workspace-title">Developer Workspace</h1>
                <p className="vf-workspace-subtitle">
                  Active JWT session token for <strong>{user.email}</strong> (FR-03). Access
                  your previously saved projects below (FR-04).
                </p>
              </div>
              <button
                type="button"
                className="vf-nav-primary-btn"
                style={{ padding: '9px 16px', fontSize: '13px' }}
              >
                + New Project (FR-05)
              </button>
            </div>

            <div className="vf-projects-grid">
              {savedProjects.map((proj) => (
                <div key={proj.id} className="vf-project-card">
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#c7d2fe',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '4px',
                        }}
                      >
                        Saved Project (FR-04)
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {proj.lastUpdated}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#fff',
                        margin: '0 0 6px 0',
                      }}
                    >
                      {proj.name}
                    </h3>
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: '#8692a6',
                        lineHeight: 1.45,
                        margin: '0 0 14px 0',
                      }}
                    >
                      {proj.description}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '10px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      marginTop: 'auto',
                    }}
                  >
                    <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {proj.pages} Pages • {proj.tables} BaaS Tables
                    </span>
                    <button
                      type="button"
                      className="vf-nav-link-btn"
                      style={{ padding: '5px 10px', fontSize: '11.5px' }}
                    >
                      Open in Builder (FR-07)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Public Hero Section */
          <div className="vf-home-hero">
            <div className="vf-status-badge">
              <span className="vf-pill-green-dot" />
              <span>VISUALFORGE STUDIO v2.4 LTS • CORE API ONLINE</span>
            </div>

            <h1 className="vf-hero-title">
              Visual Builder with <br />
              <span className="vf-gradient-text">Backend-as-a-Service</span>
            </h1>

            <p className="vf-hero-desc">
              Design responsive web applications visually, generate MongoDB CRUD APIs
              automatically without code, and publish directly to the developer marketplace.
            </p>

            <div className="vf-hero-actions">
              <button
                type="button"
                className="vf-hero-btn-primary"
                onClick={() => navigate('/auth/login')}
              >
                <SignInIcon className="vf-icon-tab" />
                <span>Sign In to Workspace (FR-02)</span>
              </button>

              <button
                type="button"
                className="vf-hero-btn-secondary"
                onClick={() => navigate('/auth/register')}
              >
                <UserPlusIcon className="vf-icon-tab" />
                <span>Create Developer Account (FR-01)</span>
              </button>

              <button
                type="button"
                className="vf-hero-btn-outline"
                onClick={() => navigate('/marketplace')}
              >
                <StoreIcon className="vf-icon-store" />
                <span>Browse Marketplace (FR-41)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
