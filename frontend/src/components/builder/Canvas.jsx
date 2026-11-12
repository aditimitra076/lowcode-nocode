import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useActivePage, useBuilderStore } from '../../store/builderStore';
import ComponentNode, { StaticNode } from './ComponentNode';

function DropLine({ show }) {
  return show ? <div className="vf-drop-line" aria-hidden="true" /> : null;
}

export default function Canvas() {
  const page = useActivePage();
  const previewing = useBuilderStore((state) => state.previewing);
  const loading = useBuilderStore((state) => state.loading);
  const viewport = useBuilderStore((state) => state.viewport);
  const dropTarget = useBuilderStore((state) => state.dropTarget);
  const select = useBuilderStore((state) => state.select);

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-root',
    data: { kind: 'container', containerId: 'root' },
    disabled: previewing,
  });

  const components = page?.components || [];
  const dropAtEnd = dropTarget?.parentId === 'root' && dropTarget.index === components.length;

  return (
    <div
      className={`vf-canvas-wrap${previewing ? ' is-preview' : ''}`}
      onClick={() => select(null)}
    >
      <div className={`vf-canvas-stage vf-canvas-stage--${viewport}`}>
        <div className={`vf-canvas${previewing ? ' vf-canvas--preview' : ' vf-canvas--editing'}`}>
          <div className="vf-canvas-chrome">
            <span className="vf-canvas-dot" />
            <span className="vf-canvas-dot" />
            <span className="vf-canvas-dot" />
            <span className="vf-canvas-url">
              visualforge.local{previewing ? page?.path || '/' : ` — editing "${page?.name || 'Page'}"`}
            </span>
          </div>

          <div
            ref={setNodeRef}
            className={`vf-page${isOver ? ' is-over' : ''}`}
            onClick={(event) => {
              event.stopPropagation();
              select(null);
            }}
          >
            {loading ? (
              <div className="vf-canvas-empty">
                <div className="vf-canvas-empty-title">Loading project…</div>
              </div>
            ) : components.length === 0 ? (
              <div className="vf-canvas-empty">
                <div className="vf-canvas-empty-title">This page is empty</div>
                <p>Drag a component from the left panel and drop it here to start building.</p>
              </div>
            ) : (
              components.map((node, index) =>
                previewing ? (
                  <StaticNode key={node.id} node={node} />
                ) : (
                  <ComponentNode key={node.id} node={node} parentId="root" index={index} />
                ),
              )
            )}

            {!previewing && <DropLine show={dropAtEnd} />}
          </div>
        </div>
      </div>
    </div>
  );
}
