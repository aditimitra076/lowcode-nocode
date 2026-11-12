import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { COMPONENT_DEFS, COMPONENT_GROUPS } from '../../builder/componentRegistry';

function PaletteIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  switch (name) {
    case 'heading':
      return (
        <svg {...common}>
          <path d="M5 4v16M19 4v16M5 12h14" />
        </svg>
      );
    case 'text':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      );
    case 'image':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="M21 16l-5-5-8 9" />
        </svg>
      );
    case 'button':
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="8" rx="4" />
        </svg>
      );
    case 'container':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 2.5" />
        </svg>
      );
    case 'row':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="5" height="14" rx="1" />
          <rect x="9.5" y="5" width="5" height="14" rx="1" />
          <rect x="16" y="5" width="5" height="14" rx="1" />
        </svg>
      );
    case 'column':
      return (
        <svg {...common}>
          <rect x="7" y="3" width="10" height="18" rx="1" />
        </svg>
      );
    case 'card':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M7 13h7M7 16h5" />
        </svg>
      );
    case 'list':
      return (
        <svg {...common}>
          <circle cx="5" cy="6" r="1" />
          <circle cx="5" cy="12" r="1" />
          <circle cx="5" cy="18" r="1" />
          <path d="M9 6h11M9 12h11M9 18h11" />
        </svg>
      );
    case 'table':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M9 9v11M15 9v11" />
        </svg>
      );
    case 'form':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M7 8h10M7 12h10M7 16h4" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
  }
}

function PaletteItem({ type }) {
  const def = COMPONENT_DEFS[type];
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { kind: 'palette', componentType: type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`vf-palette-item${isDragging ? ' is-dragging' : ''}`}
      title={`Drag ${def.label} onto the canvas`}
    >
      <span className="vf-palette-icon">
        <PaletteIcon name={def.icon} />
      </span>
      <span className="vf-palette-label">{def.label}</span>
    </div>
  );
}

export default function Palette() {
  return (
    <div className="vf-palette">
      <div className="vf-panel-head">
        <h3>Components</h3>
        <span className="vf-panel-hint">Drag onto the canvas</span>
      </div>

      {COMPONENT_GROUPS.map((group) => (
        <div className="vf-palette-group" key={group.label}>
          <div className="vf-palette-group-title">{group.label}</div>
          <div className="vf-palette-items">
            {group.types.map((type) => (
              <PaletteItem key={type} type={type} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
