import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { COMPONENT_DEFS } from '../../builder/componentRegistry';
import ComponentBody from '../../builder/ComponentBody';
import { useBuilderStore } from '../../store/builderStore';

function DropLine({ show }) {
  return show ? <div className="vf-drop-line" aria-hidden="true" /> : null;
}

// Registers the component as draggable and also as a drop target so that
// dropping on it inserts the dragged item at that position (FR-12).
function ComponentNode({ node, parentId, index }) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: node.id,
    data: { kind: 'component', nodeId: node.id, parentId },
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `node:${node.id}`,
    data: { kind: 'component', nodeId: node.id, parentId },
  });

  const selectedId = useBuilderStore((state) => state.selectedId);
  const dropTarget = useBuilderStore((state) => state.dropTarget);
  const select = useBuilderStore((state) => state.select);
  const deleteComponent = useBuilderStore((state) => state.deleteComponent);

  const def = COMPONENT_DEFS[node.type];
  const selected = selectedId === node.id;
  const dropBefore = dropTarget?.parentId === parentId && dropTarget.index === index;

  return (
    <div
      ref={(element) => {
        setDragRef(element);
        setDropRef(element);
      }}
      className={`vf-node${isDragging ? ' is-dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform) }}
      onClick={(event) => {
        event.stopPropagation();
        select(node.id);
      }}
      {...listeners}
      {...attributes}
    >
      <DropLine show={dropBefore} />

      <div className={`vf-node-box${selected ? ' is-selected' : ''}`} data-component-type={node.type}>
        <ComponentBody node={node}>
          {def?.isContainer ? <ContainerZone node={node} /> : null}
        </ComponentBody>

        <button
          type="button"
          className="vf-node-delete"
          title={`Delete ${def?.label || 'component'}`}
          aria-label={`Delete ${def?.label || 'component'}`}
          onClick={(event) => {
            event.stopPropagation();
            deleteComponent(node.id);
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          &times;
        </button>

        <span className="vf-node-tag">{def?.label}</span>
      </div>
    </div>
  );
}

// Children area of a container, row, column, card or form. It is a separate
// drop target so a component can be nested inside it (FR-13).
function ContainerZone({ node }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `zone:${node.id}`,
    data: { kind: 'container', containerId: node.id },
  });

  const children = node.children || [];
  const dropTarget = useBuilderStore((state) => state.dropTarget);
  const dropAtEnd = dropTarget?.parentId === node.id && dropTarget.index === children.length;

  return (
    <div ref={setNodeRef} className={`vf-children${isOver ? ' is-over' : ''}`}>
      {children.length === 0 ? (
        <div className="vf-empty-hint">Drop components here</div>
      ) : (
        children.map((child, childIndex) => (
          <ComponentNode key={child.id} node={child} parentId={node.id} index={childIndex} />
        ))
      )}
      <DropLine show={dropAtEnd} />
    </div>
  );
}

// Read-only renderer used by preview mode (FR-16, FR-17).
export function StaticNode({ node }) {
  const def = COMPONENT_DEFS[node.type];
  const children = def?.isContainer
    ? (node.children || []).map((child) => <StaticNode key={child.id} node={child} />)
    : null;

  return <ComponentBody node={node}>{children}</ComponentBody>;
}

export default ComponentNode;
