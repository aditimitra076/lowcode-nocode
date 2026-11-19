import React from 'react';

/** A centred card for lists that have nothing to show yet. `icon` is an element, `children` the actions. */
export default function EmptyState({ icon, title, text, children }) {
  return (
    <div className="vf-empty-state">
      {icon ? <span className="vf-empty-icon">{icon}</span> : null}
      <h3>{title}</h3>
      {text ? <p>{text}</p> : null}
      {children ? <div className="vf-empty-actions">{children}</div> : null}
    </div>
  );
}
