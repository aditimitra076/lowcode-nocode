import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import Palette from '../components/builder/Palette';
import Canvas from '../components/builder/Canvas';
import PropertyPanel from '../components/builder/PropertyPanel';
import { COMPONENT_DEFS } from '../builder/componentRegistry';
import { containsNode, findNode, findParentInfo } from '../builder/treeUtils';
import { useActivePage, useBuilderStore } from '../store/builderStore';
import './Builder.css';

function currentPage(state) {
  return state.pages.find((page) => page.id === state.activePageId) || state.pages[0];
}

function rectArea(rect) {
  return rect ? rect.width * rect.height : Number.POSITIVE_INFINITY;
}

// Nested droppables overlap, so prefer the smallest one under the pointer:
// that is the innermost component or container the user is aiming at.
function collisionDetection(args) {
  const collisions = pointerWithin(args);
  if (collisions.length < 2) return collisions;
  const { droppableRects } = args;
  return [...collisions].sort(
    (a, b) => rectArea(droppableRects.get(a.id)) - rectArea(droppableRects.get(b.id)),
  );
}

// Works out where the dragged item would land, based on the element under the pointer.
function resolveTarget(over, activeId) {
  const state = useBuilderStore.getState();
  const page = currentPage(state);
  const data = over?.data.current;
  if (!page || !data) return null;

  const isPaletteItem = String(activeId).startsWith('palette:');
  const activeNode = isPaletteItem ? null : findNode(page.components, activeId);

  if (data.kind === 'container') {
    const { containerId } = data;
    if (!isPaletteItem && (containerId === activeId || containsNode(activeNode, containerId))) {
      return null;
    }
    const count =
      containerId === 'root'
        ? page.components.length
        : findNode(page.components, containerId)?.children?.length ?? 0;
    return { parentId: containerId, index: count };
  }

  if (data.kind !== 'component') return null;
  if (!isPaletteItem && activeId === data.nodeId) return null;
  if (activeNode && containsNode(activeNode, data.nodeId)) return null;

  const info = findParentInfo(page.components, data.nodeId);
  if (!info) return null;

  let index = info.index;
  if (!isPaletteItem) {
    const from = findParentInfo(page.components, activeId);
    if (from && from.parentId === info.parentId && from.index < info.index) {
      index += 1;
    }
  }
  return { parentId: info.parentId, index };
}

export default function Builder() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const projectName = useBuilderStore((state) => state.projectName);
  const pages = useBuilderStore((state) => state.pages);
  const activePageId = useBuilderStore((state) => state.activePageId);
  const viewport = useBuilderStore((state) => state.viewport);
  const previewing = useBuilderStore((state) => state.previewing);
  const savedAt = useBuilderStore((state) => state.savedAt);
  const loadError = useBuilderStore((state) => state.loadError);
  const loadProject = useBuilderStore((state) => state.loadProject);
  const saveProject = useBuilderStore((state) => state.saveProject);
  const setProjectName = useBuilderStore((state) => state.setProjectName);
  const setActivePage = useBuilderStore((state) => state.setActivePage);
  const addPage = useBuilderStore((state) => state.addPage);
  const setViewport = useBuilderStore((state) => state.setViewport);
  const togglePreview = useBuilderStore((state) => state.togglePreview);
  const setDropTarget = useBuilderStore((state) => state.setDropTarget);

  const page = useActivePage();
  const [activeLabel, setActiveLabel] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const saveTimer = useRef(null);

  useEffect(() => {
    // The dashboard title is only a fallback for projects that are not saved yet.
    loadProject(projectId, location.state?.projectName);
  }, [projectId, loadProject, location.state]);

  useEffect(
    () => () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    },
    [],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const state = useBuilderStore.getState();
      if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedId) {
        event.preventDefault();
        state.deleteComponent(state.selectedId);
      } else if (event.key === 'Escape') {
        if (state.previewing) state.togglePreview(false);
        else state.select(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDragStart = (event) => {
    const data = event.active.data.current;
    if (data?.kind === 'palette') {
      setActiveLabel(COMPONENT_DEFS[data.componentType]?.label || 'Component');
      return;
    }
    const node = findNode(currentPage(useBuilderStore.getState()).components, event.active.id);
    setActiveLabel(node ? COMPONENT_DEFS[node.type]?.label || node.type : 'Component');
  };

  const handleDragOver = (event) => {
    setDropTarget(resolveTarget(event.over, event.active.id));
  };

  const handleDragEnd = (event) => {
    const state = useBuilderStore.getState();
    const target = resolveTarget(event.over, event.active.id);
    const data = event.active.data.current;

    if (target) {
      if (data?.kind === 'palette') {
        state.addComponent(data.componentType, target.parentId, target.index);
      } else {
        state.moveComponent(event.active.id, target.parentId, target.index);
      }
    }

    state.clearDrag();
    setActiveLabel(null);
  };

  const handleDragCancel = () => {
    useBuilderStore.getState().clearDrag();
    setActiveLabel(null);
  };

  const handleSave = async () => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    if (saveTimer.current) window.clearTimeout(saveTimer.current);

    const result = await saveProject();

    if (!result.ok) {
      setSaveStatus('error');
      setSaveMessage(result.message);
      saveTimer.current = window.setTimeout(() => setSaveStatus('idle'), 6000);
      return;
    }

    setSaveStatus('saved');
    setSaveMessage('');
    // A brand-new project now has a server id; put it in the URL.
    if (result.projectId !== projectId) {
      navigate(`/builder/${result.projectId}`, { replace: true });
    }
    saveTimer.current = window.setTimeout(() => setSaveStatus('idle'), 2500);
  };

  return (
    <div className={`vf-builder${previewing ? ' is-previewing' : ''}`}>
      <header className="vf-toolbar">
        <div className="vf-toolbar-left">
          <button type="button" className="vf-ghost-btn" onClick={() => navigate('/dashboard')}>
            &larr; Projects
          </button>
          <span className="vf-toolbar-divider" />
          <input
            className="vf-project-name"
            value={projectName}
            aria-label="Project name"
            onChange={(event) => setProjectName(event.target.value)}
          />
          <span className="vf-toolbar-page">
            {page?.name}
            <span className="vf-toolbar-path">{page?.path}</span>
          </span>
        </div>

        <div className="vf-toolbar-right">
          <div className="vf-device-toggle" role="group" aria-label="Preview width">
            <button
              type="button"
              className={viewport === 'desktop' ? 'is-active' : ''}
              onClick={() => setViewport('desktop')}
            >
              Desktop
            </button>
            <button
              type="button"
              className={viewport === 'mobile' ? 'is-active' : ''}
              onClick={() => setViewport('mobile')}
            >
              Mobile
            </button>
          </div>

          <button
            type="button"
            className={`vf-btn${previewing ? ' is-active' : ''}`}
            onClick={() => togglePreview()}
          >
            {previewing ? 'Back to editor' : 'Preview'}
          </button>

          <button
            type="button"
            className="vf-btn vf-btn-primary"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : 'Save'}
          </button>
          {saveStatus === 'error' ? (
            <span className="vf-save-note is-error">{saveMessage}</span>
          ) : loadError && saveStatus !== 'saved' ? (
            <span className="vf-save-note is-error">{loadError}</span>
          ) : savedAt && saveStatus === 'idle' ? (
            <span className="vf-save-note">
              Saved {new Date(savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : null}
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="vf-builder-body">
          {!previewing && (
            <aside className="vf-builder-left">
              <div className="vf-panel vf-pages">
                <div className="vf-panel-head">
                  <h3>Pages</h3>
                  <button type="button" className="vf-mini-btn" onClick={addPage}>
                    + Page
                  </button>
                </div>
                <div className="vf-pages-list">
                  {pages.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`vf-page-item${item.id === activePageId ? ' is-active' : ''}`}
                      onClick={() => setActivePage(item.id)}
                    >
                      <span>{item.name}</span>
                      <span className="vf-page-item-path">{item.path}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Palette />
            </aside>
          )}

          <main className="vf-builder-main">
            <Canvas />
          </main>

          {!previewing && (
            <aside className="vf-builder-right">
              <PropertyPanel />
            </aside>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLabel ? <div className="vf-drag-chip">{activeLabel}</div> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
