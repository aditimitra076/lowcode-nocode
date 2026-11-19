import React, { useEffect, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { COMPONENT_DEFS } from '../../builder/componentRegistry';
import ComponentBody from '../../builder/ComponentBody';
import { useBuilderStore } from '../../store/builderStore';
import DropLine from './DropLine';

const MIN_WIDTH = 120;
const MIN_COL_PCT = 12;

function parseWidthPx(value, fallback) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const match = String(value || '').trim().match(/^(\d+(?:\.\d+)?)px$/i);
  if (match) return Number(match[1]);
  return fallback;
}

function rowChildShellStyle(width) {
  if (!width || width === '100%' || width === 'auto') return null;
  return {
    flex: `1 1 ${width}`,
    width,
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  };
}

/** Drag handle between two row columns to redistribute width %. */
function RowColumnSplitter({ leftId, rightId, zoneRef }) {
  const updateStyle = useBuilderStore((state) => state.updateStyle);
  const sessionRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [chip, setChip] = useState(null);

  useEffect(() => {
    if (!dragging) return undefined;

    const onMove = (event) => {
      const session = sessionRef.current;
      if (!session) return;
      const delta = event.clientX - session.startX;
      const pair = session.leftStart + session.rightStart;
      const nextLeft = Math.min(
        pair - session.minPx,
        Math.max(session.minPx, session.leftStart + delta),
      );
      const nextRight = pair - nextLeft;
      const leftPct = Math.round((nextLeft / session.rowWidth) * 1000) / 10;
      const rightPct = Math.round((nextRight / session.rowWidth) * 1000) / 10;
      const leftWidth = `${leftPct}%`;
      const rightWidth = `${rightPct}%`;
      setChip(`${Math.round(leftPct)}% · ${Math.round(rightPct)}%`);
      updateStyle(leftId, { width: leftWidth, maxWidth: '100%' });
      updateStyle(rightId, { width: rightWidth, maxWidth: '100%' });
    };

    const onUp = () => {
      sessionRef.current = null;
      setDragging(false);
      setChip(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, leftId, rightId, updateStyle]);

  const startSplit = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const zone = zoneRef.current;
    if (!zone) return;
    const leftEl = zone.querySelector(`[data-node-id="${leftId}"]`);
    const rightEl = zone.querySelector(`[data-node-id="${rightId}"]`);
    if (!leftEl || !rightEl) return;

    const rowWidth = zone.getBoundingClientRect().width;
    if (rowWidth < MIN_WIDTH * 2) return;

    const leftStart = leftEl.getBoundingClientRect().width;
    const rightStart = rightEl.getBoundingClientRect().width;
    const minPx = Math.max(MIN_WIDTH, (MIN_COL_PCT / 100) * rowWidth);

    sessionRef.current = {
      startX: event.clientX,
      leftStart,
      rightStart,
      rowWidth,
      minPx,
    };
    setDragging(true);
    setChip(
      `${Math.round((leftStart / rowWidth) * 100)}% · ${Math.round((rightStart / rowWidth) * 100)}%`,
    );
  };

  return (
    <div
      className={`vf-row-splitter${dragging ? ' is-dragging' : ''}`}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize columns"
      onPointerDown={startSplit}
    >
      <span className="vf-row-splitter-bar" aria-hidden="true" />
      {chip ? <span className="vf-row-splitter-chip">{chip}</span> : null}
    </div>
  );
}

// Registers the component as draggable and also as a drop target so that
// dropping on it inserts the dragged item at that position (FR-12).
function ComponentNode({ node, parentId, index, parentType }) {
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
  const previewing = useBuilderStore((state) => state.previewing);
  const select = useBuilderStore((state) => state.select);
  const deleteComponent = useBuilderStore((state) => state.deleteComponent);
  const duplicateComponent = useBuilderStore((state) => state.duplicateComponent);
  const updateStyle = useBuilderStore((state) => state.updateStyle);
  const updateProps = useBuilderStore((state) => state.updateProps);

  const boxRef = useRef(null);
  const resizeRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeWidth, setResizeWidth] = useState(null);
  const [textEditor, setTextEditor] = useState(null);
  const textDraftRef = useRef('');
  const skipTextBlurRef = useRef(false);

  const def = COMPONENT_DEFS[node.type];
  const selected = selectedId === node.id;
  const dropBefore = dropTarget?.parentId === parentId && dropTarget.index === index;
  const canEditText = node.type === 'heading' || node.type === 'text';
  const showChrome = selected && !previewing;

  useEffect(() => {
    if (!selected || previewing) {
      setTextEditor(null);
      setIsResizing(false);
      setResizeWidth(null);
    }
  }, [selected, previewing]);

  useEffect(() => {
    if (!isResizing) return undefined;

    const onMove = (event) => {
      const session = resizeRef.current;
      if (!session) return;
      const delta = event.clientX - session.startX;
      const next =
        session.edge === 'right' ? session.startWidth + delta : session.startWidth - delta;
      const clamped = Math.round(Math.min(session.maxWidth, Math.max(MIN_WIDTH, next)));
      setResizeWidth(clamped);
      updateStyle(node.id, { width: `${clamped}px`, maxWidth: '100%' });
    };

    const onUp = () => {
      resizeRef.current = null;
      setIsResizing(false);
      setResizeWidth(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isResizing, node.id, updateStyle]);

  const startResize = (edge, event) => {
    event.preventDefault();
    event.stopPropagation();
    const box = boxRef.current;
    if (!box) return;

    const rect = box.getBoundingClientRect();
    const page = box.closest('.vf-page') || box.parentElement;
    const pageRect = page?.getBoundingClientRect();
    const measured = Math.round(rect.width);
    const startWidth = parseWidthPx(node.style?.width, measured);
    const maxWidth = pageRect
      ? Math.max(MIN_WIDTH, Math.floor(pageRect.width - 8))
      : Math.max(startWidth, measured);

    resizeRef.current = {
      edge,
      startX: event.clientX,
      startWidth,
      maxWidth,
    };
    setIsResizing(true);
    setResizeWidth(startWidth);
    updateStyle(node.id, { width: `${startWidth}px`, maxWidth: '100%' });
  };

  const openTextEditor = (event) => {
    if (!canEditText || previewing) return;
    event.preventDefault();
    event.stopPropagation();
    select(node.id);
    const box = boxRef.current;
    const rect = box?.getBoundingClientRect();
    const draft = node.props?.text || '';
    textDraftRef.current = draft;
    setTextEditor({
      top: (rect?.bottom || event.clientY) + 8,
      left: rect?.left || event.clientX,
      width: Math.max(220, Math.min(420, rect?.width || 280)),
      draft,
    });
  };

  const commitTextEditor = (save) => {
    if (save) {
      updateProps(node.id, { text: textDraftRef.current });
    }
    setTextEditor(null);
  };

  const handleTextBlur = () => {
    if (skipTextBlurRef.current) {
      skipTextBlurRef.current = false;
      return;
    }
    commitTextEditor(true);
  };

  const handleTextKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      skipTextBlurRef.current = true;
      commitTextEditor(false);
      return;
    }
    if (event.key === 'Enter' && node.type === 'heading') {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const inRow = parentType === 'row';
  const nodeStyle = {
    transform: CSS.Translate.toString(transform),
    ...(inRow ? rowChildShellStyle(node.style?.width) : null),
  };

  return (
    <div
      ref={(element) => {
        setDragRef(element);
        setDropRef(element);
      }}
      className={`vf-node${isDragging ? ' is-dragging' : ''}${isResizing ? ' is-resizing' : ''}${inRow ? ' vf-node--in-row' : ''}`}
      style={nodeStyle}
      data-node-id={node.id}
      onClick={(event) => {
        event.stopPropagation();
        select(node.id);
      }}
      onDoubleClick={openTextEditor}
      {...listeners}
      {...attributes}
    >
      <DropLine show={dropBefore} />

      <div
        ref={boxRef}
        className={`vf-node-box${selected ? ' is-selected' : ''}`}
        data-component-type={node.type}
      >
        <ComponentBody node={node}>
          {def?.isContainer ? <ContainerZone node={node} /> : null}
        </ComponentBody>

        <button
          type="button"
          className="vf-node-duplicate"
          title={`Duplicate ${def?.label || 'component'} (Ctrl+D)`}
          aria-label={`Duplicate ${def?.label || 'component'}`}
          onClick={(event) => {
            event.stopPropagation();
            duplicateComponent(node.id);
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          ⧉
        </button>

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

        {showChrome && !inRow ? (
          <>
            <button
              type="button"
              className="vf-resize-handle vf-resize-handle-left"
              aria-label="Resize from left"
              onPointerDown={(event) => startResize('left', event)}
            />
            <button
              type="button"
              className="vf-resize-handle vf-resize-handle-right"
              aria-label="Resize from right"
              onPointerDown={(event) => startResize('right', event)}
            />
          </>
        ) : null}

        {isResizing && resizeWidth != null ? (
          <span className="vf-resize-chip" aria-live="polite">
            {resizeWidth}px
          </span>
        ) : null}
      </div>

      {textEditor ? (
        <div
          className="vf-float-text-editor"
          style={{
            top: textEditor.top,
            left: textEditor.left,
            width: textEditor.width,
          }}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <label className="vf-float-text-label" htmlFor={`float-text-${node.id}`}>
            Edit {def?.label || 'text'}
          </label>
          {node.type === 'heading' ? (
            <input
              id={`float-text-${node.id}`}
              className="vf-float-text-input"
              autoFocus
              defaultValue={textEditor.draft}
              onChange={(event) => {
                textDraftRef.current = event.target.value;
              }}
              onBlur={handleTextBlur}
              onKeyDown={handleTextKeyDown}
            />
          ) : (
            <textarea
              id={`float-text-${node.id}`}
              className="vf-float-text-input"
              rows={4}
              autoFocus
              defaultValue={textEditor.draft}
              onChange={(event) => {
                textDraftRef.current = event.target.value;
              }}
              onBlur={handleTextBlur}
              onKeyDown={handleTextKeyDown}
            />
          )}
          <p className="vf-float-text-hint">
            {node.type === 'heading' ? 'Enter to save · Esc to cancel' : 'Click away to save · Esc to cancel'}
          </p>
        </div>
      ) : null}
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

  const zoneRef = useRef(null);
  const children = node.children || [];
  const dropTarget = useBuilderStore((state) => state.dropTarget);
  const previewing = useBuilderStore((state) => state.previewing);
  const dropAtEnd = dropTarget?.parentId === node.id && dropTarget.index === children.length;
  const isRow = node.type === 'row';
  const showSplitters = isRow && !previewing && children.length >= 2;

  return (
    <div
      ref={(element) => {
        setNodeRef(element);
        zoneRef.current = element;
      }}
      className={`vf-children${isOver ? ' is-over' : ''}${isRow ? ' vf-children--row' : ''}`}
    >
      {children.length === 0 ? (
        <div className="vf-empty-hint">Drop components here</div>
      ) : (
        children.map((child, childIndex) => (
          <React.Fragment key={child.id}>
            {showSplitters && childIndex > 0 ? (
              <RowColumnSplitter
                leftId={children[childIndex - 1].id}
                rightId={child.id}
                zoneRef={zoneRef}
              />
            ) : null}
            <ComponentNode
              node={child}
              parentId={node.id}
              index={childIndex}
              parentType={node.type}
            />
          </React.Fragment>
        ))
      )}
      <DropLine show={dropAtEnd} />
    </div>
  );
}

// Read-only renderer used by preview mode (FR-16, FR-17).
export function StaticNode({ node, parentType }) {
  const def = COMPONENT_DEFS[node.type];
  const children = def?.isContainer
    ? (node.children || []).map((child) => (
        <StaticNode key={child.id} node={child} parentType={node.type} />
      ))
    : null;

  // Match editor: row flex item is a shell; content fills it (avoids width:100% wrapping).
  if (parentType === 'row') {
    const custom = rowChildShellStyle(node.style?.width);
    const shell = {
      flex: '1 1 0%',
      minWidth: 0,
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden',
      ...custom,
    };
    const bodyNode = {
      ...node,
      style: { ...node.style, width: '100%', maxWidth: '100%' },
    };
    return (
      <div className="vf-static-node vf-static-node--in-row" style={shell}>
        <ComponentBody node={bodyNode}>{children}</ComponentBody>
      </div>
    );
  }

  return <ComponentBody node={node}>{children}</ComponentBody>;
}

export default ComponentNode;
