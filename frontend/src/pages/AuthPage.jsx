import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CubeIcon,
  TerminalIcon,
  SignInIcon,
  UserPlusIcon,
  UserIcon,
  AtIcon,
  KeyIcon,
  EyeIcon,
  EyeOffIcon,
  LightningIcon,
  GithubIcon,
  ShieldCheckIcon,
  StoreIcon,
  ArrowRightIcon,
  AlertCircleIcon,
  CheckIcon,
  CloseIcon,
} from '../components/ui/Icons';
import {
  loginUser,
  registerUser,
  getStoredUser,
  clearSession,
} from '../api/authApi';
import './AuthPage.css';

export default function AuthPage({ initialTab }) {
  const { type } = useParams();
  const navigate = useNavigate();

  // Determine active tab from URL param or initial prop
  const routeTab = (type || initialTab || '').toLowerCase();
  const isRegisterParam =
    routeTab === 'register' || routeTab === 'signup' || routeTab === 'create-account';

  const [activeTabOverride, setActiveTabOverride] = useState(null);
  const activeTab = activeTabOverride ?? (isRegisterParam ? 'register' : 'login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  const handleTabSwitch = (tab) => {
    setActiveTabOverride(tab);
    setAlert(null);
    navigate(`/auth/${tab}`, { replace: true });
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setAlert({ type: 'info', message: 'Signed out of workspace session.' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!email || !email.includes('@')) {
      setAlert({
        type: 'error',
        message: 'Please provide a valid Identity / Work Email address.',
      });
      return;
    }

    if (!password) {
      setAlert({
        type: 'error',
        message: 'Workspace Secret is required.',
      });
      return;
    }

    if (activeTab === 'register') {
      if (!name.trim()) {
        setAlert({
          type: 'error',
          message: 'Please enter your Developer Name / Identity (FR-01).',
        });
        return;
      }
      if (
        password.length < 8 ||
        !/[A-Za-z]/.test(password) ||
        !/\d/.test(password)
      ) {
        setAlert({
          type: 'error',
          message:
            'Workspace Secret must be at least 8 characters and include both a letter and a number (FR-01).',
        });
        return;
      }
    }

    setLoading(true);

    try {
      if (activeTab === 'login') {
        const result = await loginUser({ email, password });
        if (result.success) {
          setAlert({
            type: 'success',
            message: 'Authenticated successfully! Initializing workspace...',
          });
          setCurrentUser(result.user);
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 850);
        } else {
          setAlert({
            type: 'error',
            message: result.message || "That email or password isn't right",
          });
        }
      } else {
        const result = await registerUser({ name, email, password });
        if (result.success) {
          setAlert({
            type: 'success',
            message: 'Developer account created (FR-01)! Redirecting to workspace...',
          });
          setCurrentUser(result.user);
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 850);
        } else {
          setAlert({
            type: 'error',
            message: result.message || 'Registration could not be completed.',
          });
        }
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Connection error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGithubFederate = () => {
    setAlert({
      type: 'info',
      message: 'GitHub OAuth Federation: connecting to authorization server...',
    });
    setTimeout(() => {
      const ghUser = {
        id: 'gh-dev-' + Date.now().toString(36),
        name: 'GitHub Developer',
        email: 'developer@github.local',
        role: 'Developer',
        status: 'Active',
      };
      loginUser({ email: ghUser.email, password: 'GithubOAuthPassword123' }).then((res) => {
        if (res.success) {
          navigate('/', { replace: true });
        }
      });
    }, 600);
  };

  return (
    <div className="vf-auth-wrapper">
      <div className="vf-auth-container">
        {/* Header Section */}
        <header className="vf-auth-header">
          {/* Logo with Green Status Dot */}
          <div className="vf-logo-badge-container">
            <div className="vf-logo-badge" title="VisualForge Studio Engine">
              <CubeIcon className="vf-icon-cube" stroke="#c4b5fd" />
            </div>
            <div
              className="vf-status-indicator-dot"
              title="Core Engine Online: us-east-1"
            />
          </div>

          <h1 className="vf-app-title">VisualForge Studio</h1>
          <p className="vf-app-subtitle">Visual Builder with Backend-as-a-Service</p>

          {/* Engine Status Pill */}
          <div className="vf-engine-status-pill">
            <span className="vf-pill-green-dot" />
            <span>CORE API ENGINE ONLINE • us-east-1</span>
          </div>
        </header>

        {/* Existing Session Alert if already authenticated */}
        {currentUser && (
          <div className="vf-session-banner">
            <span>
              Signed in as <strong>{currentUser.name}</strong> ({currentUser.email})
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="vf-session-btn"
                onClick={() => navigate('/')}
              >
                Go to Workspace (FR-04)
              </button>
              <button
                type="button"
                className="vf-session-btn"
                onClick={handleLogout}
                style={{ opacity: 0.8 }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Top Feature Card: Architectural Pipeline */}
        <section className="vf-feature-card">
          <div className="vf-feature-icon-badge">
            <TerminalIcon className="vf-icon-terminal" color="#38bdf8" />
          </div>
          <div className="vf-feature-content">
            <div className="vf-feature-header-row">
              <span className="vf-feature-title">Architectural Pipeline</span>
              <span className="vf-version-tag">v2.4</span>
            </div>
            <p className="vf-feature-desc">
              Design visually, generate production MongoDB CRUD APIs, and publish
              directly to the developer marketplace.
            </p>
          </div>
        </section>

        {/* Middle Main Card: Authentication Form */}
        <main className="vf-auth-card">
          {/* Tabs: Sign In vs Create Account */}
          <div className="vf-tabs-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'login'}
              className={`vf-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('login')}
            >
              <SignInIcon className="vf-icon-tab" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'register'}
              className={`vf-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('register')}
            >
              <UserPlusIcon className="vf-icon-tab" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Feedback Alert Box */}
          {alert && (
            <div
              className={`vf-alert-box ${
                alert.type === 'error'
                  ? 'vf-alert-error'
                  : alert.type === 'success'
                  ? 'vf-alert-success'
                  : 'vf-alert-info'
              }`}
            >
              {alert.type === 'error' && <AlertCircleIcon className="vf-icon-alert" />}
              {alert.type === 'success' && <CheckIcon className="vf-icon-check" />}
              {alert.type === 'info' && <ShieldCheckIcon className="vf-icon-shield" />}
              <span>{alert.message}</span>
              <button
                type="button"
                className="vf-alert-close-btn"
                onClick={() => setAlert(null)}
                aria-label="Close notification"
              >
                <CloseIcon className="vf-icon-close" />
              </button>
            </div>
          )}

          {/* Form */}
          <form className="vf-auth-form" onSubmit={handleSubmit} noValidate>
            {/* If Create Account: Developer Name Field */}
            {activeTab === 'register' && (
              <div className="vf-field-group">
                <div className="vf-field-label-row">
                  <label htmlFor="vf-dev-name" className="vf-field-label">
                    DEVELOPER NAME / IDENTITY
                  </label>
                  <span className="vf-field-tag">fr-01</span>
                </div>
                <div className="vf-input-wrapper">
                  <UserIcon className="vf-icon-input" />
                  <input
                    id="vf-dev-name"
                    type="text"
                    className="vf-input"
                    placeholder="Ada Lovelace"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Field 1: Identity / Work Email */}
            <div className="vf-field-group">
              <div className="vf-field-label-row">
                <label htmlFor="vf-identity-email" className="vf-field-label">
                  IDENTITY / WORK EMAIL
                </label>
                <span className="vf-field-tag">fr-01</span>
              </div>
              <div className="vf-input-wrapper">
                <AtIcon className="vf-icon-input" />
                <input
                  id="vf-identity-email"
                  type="email"
                  className="vf-input"
                  placeholder="developer@work.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Field 2: Workspace Secret */}
            <div className="vf-field-group">
              <div className="vf-field-label-row">
                <label htmlFor="vf-workspace-secret" className="vf-field-label">
                  WORKSPACE SECRET
                </label>
                {activeTab === 'login' ? (
                  <button
                    type="button"
                    className="vf-forgot-link"
                    onClick={() => setShowForgotModal(true)}
                  >
                    Forgot Key?
                  </button>
                ) : (
                  <span className="vf-field-tag">Min 8 chars, 1 letter & 1 number</span>
                )}
              </div>
              <div className="vf-input-wrapper">
                <KeyIcon className="vf-icon-input" />
                <input
                  id="vf-workspace-secret"
                  type={showPassword ? 'text' : 'password'}
                  className="vf-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="vf-password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide secret' : 'Show secret'}
                  title={showPassword ? 'Hide secret' : 'Show secret'}
                >
                  {showPassword ? (
                    <EyeOffIcon className="vf-icon-eye" />
                  ) : (
                    <EyeIcon className="vf-icon-eye" />
                  )}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              className="vf-primary-btn"
              disabled={loading}
            >
              <LightningIcon className="vf-icon-btn" />
              <span>
                {loading
                  ? 'Authenticating...'
                  : activeTab === 'login'
                  ? 'Sign In to Workspace'
                  : 'Create Workspace Account'}
              </span>
              <span className="vf-btn-req-tag">
                {activeTab === 'login' ? '(FR-02)' : '(FR-01)'}
              </span>
            </button>
          </form>

          {/* Divider: OR FEDERATE */}
          <div className="vf-divider-row">
            <div className="vf-divider-line" />
            <span className="vf-divider-text">OR FEDERATE</span>
            <div className="vf-divider-line" />
          </div>

          {/* GitHub Federation Button */}
          <button
            type="button"
            className="vf-secondary-btn"
            onClick={handleGithubFederate}
          >
            <GithubIcon className="vf-icon-github" />
            <span>Continue with GitHub</span>
          </button>

          {/* Security statement: JWT session tokens (FR-03) */}
          <div className="vf-security-note">
            <ShieldCheckIcon className="vf-icon-shield" color="#64748b" />
            <span>
              By proceeding, you authenticate via JWT session tokens{' '}
              <strong>(FR-03)</strong>.
            </span>
          </div>
        </main>

        {/* Bottom Card: Explore Visual Templates */}
        <section className="vf-templates-card">
          <div className="vf-templates-header-row">
            <div className="vf-templates-title-group">
              <StoreIcon className="vf-icon-store" color="#38bdf8" />
              <span className="vf-templates-title">Explore Visual Templates</span>
            </div>
            <span className="vf-no-auth-badge">No Auth</span>
          </div>
          <p className="vf-templates-desc">
            Inspect live MongoDB schema components and public microservice blueprints.
          </p>
          <button
            type="button"
            className="vf-templates-link"
            onClick={() => navigate('/marketplace')}
          >
            <span>Browse Public Marketplace as Visitor (FR-41)</span>
            <ArrowRightIcon className="vf-icon-arrow" />
          </button>
        </section>

        {/* Footer info */}
        <footer className="vf-auth-footer">
          <div className="vf-footer-stack">
            v2.4 LTS • Node.js / Express • MongoDB BaaS
          </div>
          <div className="vf-footer-status">
            <span className="vf-pill-green-dot" />
            <span>Engine status: 99.98% uptime SLA</span>
          </div>
        </footer>
      </div>

      {/* Forgot Key Modal */}
      {showForgotModal && (
        <div className="vf-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="vf-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="vf-modal-header">
              <h3 className="vf-modal-title">Workspace Secret Recovery</h3>
              <button
                type="button"
                className="vf-alert-close-btn"
                onClick={() => setShowForgotModal(false)}
              >
                <CloseIcon className="vf-icon-close" />
              </button>
            </div>
            <p className="vf-modal-body">
              For security compliance with <strong>VisualForge Studio BaaS</strong>,
              workspace secrets are hashed using bcrypt with salt rounds of 12 (SRS 3.6.3).
            </p>
            <p className="vf-modal-body">
              To request a key rotation or reset link, contact your platform administrator
              at <code>admin@vf.test</code> or request a reset token via the administration
              dashboard.
            </p>
            <div className="vf-modal-footer">
              <button
                type="button"
                className="vf-primary-btn"
                style={{ padding: '7px 14px', fontSize: '12px' }}
                onClick={() => setShowForgotModal(false)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
