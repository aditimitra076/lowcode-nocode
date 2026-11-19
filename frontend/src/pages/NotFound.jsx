import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppHeader from '../components/ui/AppHeader';
import { ArrowRightIcon, StoreIcon } from '../components/ui/Icons';
import './Home.css';
import './Screens.css';

export default function NotFound() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="vf-home-wrapper">
      <div className="vf-home-container">
        <AppHeader />
        <main className="vf-notfound">
          <p className="vf-notfound-code">404</p>
          <h1>This page does not exist.</h1>
          <p className="vf-muted">
            There is nothing at <code>{pathname}</code>. The link may be old, or the address may have a
            typing mistake.
          </p>
          <div className="vf-notfound-actions">
            <button type="button" className="vf-primary-btn vf-primary-btn-lg" onClick={() => navigate('/')}>
              <span>Back to the home page</span>
              <ArrowRightIcon className="vf-icon-arrow" />
            </button>
            <button type="button" className="vf-ghost-btn vf-ghost-btn-lg" onClick={() => navigate('/marketplace')}>
              <StoreIcon className="vf-icon-tab" />
              <span>Browse blueprints</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
