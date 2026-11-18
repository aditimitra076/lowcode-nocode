import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  CubeIcon,
  SignInIcon,
  UserPlusIcon,
  UserIcon,
  AtIcon,
  KeyIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  CheckIcon,
  CloseIcon,
  StoreIcon,
  ArrowRightIcon,
} from '../components/ui/Icons';
import { loginUser, registerUser, getStoredUser, clearSession } from '../api/authApi';
import './AuthPage.css';

export default function AuthPage({ initialTab }) {
  const { type } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    typeof location.state?.from === 'string' && location.state.from.startsWith('/')
      ? location.state.from
      : '/';

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
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  const handleTabSwitch = (tab) => {
    setActiveTabOverride(tab);
    setAlert(null);
    navigate(`/auth/${tab}`, { replace: true });
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setAlert({ type: 'info', message: 'Signed out.' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAlert(null);

    if (!email || !email.includes('@')) {
      setAlert({ type: 'error', message: 'Enter a valid email address.' });
      return;
    }
    if (!password) {
      setAlert({ type: 'error', message: 'Password is required.' });
      return;
    }

    if (activeTab === 'register') {
      if (!name.trim()) {
        setAlert({ type: 'error', message: 'Enter your name.' });
        return;
      }
      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        setAlert({
          type: 'error',
          message: 'Password must be at least 8 characters and include a letter and a number.',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const result =
        activeTab === 'login'
          ? await loginUser({ email, password })
          : await registerUser({ name, email, password });

      if (!result.success) {
        setAlert({ type: 'error', message: result.message || 'Could not authenticate.' });
        return;
      }

      setCurrentUser(result.user);
      setAlert({
        type: 'success',
        message: activeTab === 'login' ? 'Signed in. Opening workspace…' : 'Account created. Opening workspace…',
      });
      setTimeout(() => navigate(redirectTo, { replace: true }), 600);
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Connection error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vf-auth-wrapper">
      <div className="vf-auth-container">
        <header className="vf-auth-header">
          <div className="vf-logo-badge-container">
            <div className="vf-logo-badge" title="VisualForge Studio">
              <CubeIcon className="vf-icon-cube" stroke="#0b0b0c" />
            </div>
          </div>
          <h1 className="vf-app-title">VisualForge Studio</h1>
          <p className="vf-app-subtitle">Visual builder with backend-as-a-service</p>
        </header>

        {currentUser ? (
          <div className="vf-session-banner">
            <span>
              Signed in as <strong>{currentUser.name}</strong> ({currentUser.email})
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" className="vf-session-btn" onClick={() => navigate('/')}>
                Go to workspace
              </button>
              <button type="button" className="vf-session-btn" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </div>
        ) : null}

        <main className="vf-auth-card">
          <div className="vf-tabs-bar" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'login'}
              className={`vf-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('login')}
            >
              <SignInIcon className="vf-icon-tab" />
              <span>Sign in</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'register'}
              className={`vf-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('register')}
            >
              <UserPlusIcon className="vf-icon-tab" />
              <span>Create account</span>
            </button>
          </div>

          {alert ? (
            <div
              className={`vf-alert-box ${
                alert.type === 'error'
                  ? 'vf-alert-error'
                  : alert.type === 'success'
                    ? 'vf-alert-success'
                    : 'vf-alert-info'
              }`}
            >
              {alert.type === 'error' ? <AlertCircleIcon className="vf-icon-alert" /> : null}
              {alert.type === 'success' ? <CheckIcon className="vf-icon-check" /> : null}
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
          ) : null}

          <form className="vf-auth-form" onSubmit={handleSubmit} noValidate>
            {activeTab === 'register' ? (
              <div className="vf-field-group">
                <label htmlFor="vf-dev-name" className="vf-field-label">
                  Name
                </label>
                <div className="vf-input-wrapper">
                  <UserIcon className="vf-icon-input" />
                  <input
                    id="vf-dev-name"
                    type="text"
                    className="vf-input"
                    placeholder="Ada Lovelace"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            ) : null}

            <div className="vf-field-group">
              <label htmlFor="vf-identity-email" className="vf-field-label">
                Email
              </label>
              <div className="vf-input-wrapper">
                <AtIcon className="vf-icon-input" />
                <input
                  id="vf-identity-email"
                  type="email"
                  className="vf-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="vf-field-group">
              <div className="vf-field-label-row">
                <label htmlFor="vf-workspace-secret" className="vf-field-label">
                  Password
                </label>
                {activeTab === 'register' ? (
                  <span className="vf-field-tag">Min 8 chars, letter + number</span>
                ) : null}
              </div>
              <div className="vf-input-wrapper">
                <KeyIcon className="vf-icon-input" />
                <input
                  id="vf-workspace-secret"
                  type={showPassword ? 'text' : 'password'}
                  className="vf-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="vf-password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon className="vf-icon-eye" />
                  ) : (
                    <EyeIcon className="vf-icon-eye" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="vf-primary-btn" disabled={loading}>
              <span>
                {loading
                  ? 'Please wait…'
                  : activeTab === 'login'
                    ? 'Sign in'
                    : 'Create account'}
              </span>
            </button>
          </form>
        </main>

        <section className="vf-templates-card">
          <div className="vf-templates-header-row">
            <div className="vf-templates-title-group">
              <StoreIcon className="vf-icon-store" color="#38bdf8" />
              <span className="vf-templates-title">Marketplace</span>
            </div>
            <span className="vf-no-auth-badge">No login needed</span>
          </div>
          <p className="vf-templates-desc">Browse approved project blueprints as a visitor.</p>
          <button type="button" className="vf-templates-link" onClick={() => navigate('/marketplace')}>
            <span>Browse marketplace</span>
            <ArrowRightIcon className="vf-icon-arrow" />
          </button>
        </section>
      </div>
    </div>
  );
}
