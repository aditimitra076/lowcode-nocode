import React from 'react';

/** The line that shows where a dragged component will be dropped. */
export default function DropLine({ show }) {
  return show ? <div className="vf-drop-line" aria-hidden="true" /> : null;
}
