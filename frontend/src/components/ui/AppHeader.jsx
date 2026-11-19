import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CubeIcon } from './Icons';

/**
 * The top bar that the inner screens share: logo, name, an optional section label and the actions (children).
 * Needs the styles of Home.css and Screens.css.
 */
export default function AppHeader({ section, children }) {
  const navigate = useNavigate();
  const goHome = () => navigate('/');

  return (
    <header className="vf-site-nav">
      <div
        className="vf-site-brand"
        role="link"
        tabIndex={0}
        onClick={goHome}
        onKeyDown={(event) => {
          if (event.key === 'Enter') goHome();
        }}
      >
        <span className="vf-site-logo">
          <CubeIcon className="vf-icon-cube" stroke="#0b0b0c" />
        </span>
        <span className="vf-site-wordmark">VisualForge</span>
        {section ? <span className="vf-site-section">{section}</span> : null}
      </div>
      <div className="vf-site-actions">{children}</div>
    </header>
  );
}
