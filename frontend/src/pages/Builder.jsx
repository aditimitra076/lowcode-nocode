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
import TablesPanel from '../components/builder/TablesPanel';
import CollaboratorsPanel from '../components/builder/CollaboratorsPanel';
import DataManager from '../components/builder/DataManager';
import { COMPONENT_DEFS } from '../builder/componentRegistry';
import { containsNode, findNode, findParentInfo } from '../builder/treeUtils';
import { useActivePage, useBuilderStore } from '../store/builderStore';
import { createListing } from '../api/marketplaceApi';
import { uploadFile } from '../api/uploadApi';
import './Builder.css';

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function currentPage(state) {
  return state.pages.find((page) => page.id === state.activePageId) || state.pages[0];
}

function rectArea(rect) {
  return rect ? rect.width * rect.height : Number.POSITIVE_INFINITY;
}

function collisionDetection(args) {
  const collisions = pointerWithin(args);
  if (collisions.length < 2) return collisions;
  const { droppableRects } = args;
  return [...collisions].sort(
    (a, b) => rectArea(droppableRects.get(a.id)) - rectArea(droppableRects.get(b.id)),
  );
}

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
  const storeProjectId = useBuilderStore((state) => state.projectId);
  const pages = useBuilderStore((state) => state.pages);
  const activePageId = useBuilderStore((state) => state.activePageId);
  const viewport = useBuilderStore((state) => state.viewport);
  const previewing = useBuilderStore((state) => state.previewing);
  const savedAt = useBuilderStore((state) => state.savedAt);
  const loadError = useBuilderStore((state) => state.loadError);
  const isOwner = useBuilderStore((state) => state.isOwner);
  const accessRole = useBuilderStore((state) => state.accessRole);
  const loadProject = useBuilderStore((state) => state.loadProject);
  const saveProject = useBuilderStore((state) => state.saveProject);
  const saveProjectName = useBuilderStore((state) => state.saveProjectName);
  const setProjectName = useBuilderStore((state) => state.setProjectName);
  const setActivePage = useBuilderStore((state) => state.setActivePage);
  const addPage = useBuilderStore((state) => state.addPage);
  const renamePage = useBuilderStore((state) => state.renamePage);
  const removePage = useBuilderStore((state) => state.removePage);
  const setViewport = useBuilderStore((state) => state.setViewport);
  const togglePreview = useBuilderStore((state) => state.togglePreview);
  const setDropTarget = useBuilderStore((state) => state.setDropTarget);
  const undo = useBuilderStore((state) => state.undo);
  const redo = useBuilderStore((state) => state.redo);
  const pastLength = useBuilderStore((state) => (state.past || []).length);
  const futureLength = useBuilderStore((state) => (state.future || []).length);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const duplicateComponent = useBuilderStore((state) => state.duplicateComponent);

  const page = useActivePage();
  const [activeLabel, setActiveLabel] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [showPublish, setShowPublish] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);
  const [publishDescription, setPublishDescription] = useState('');
  const [publishTags, setPublishTags] = useState('');
  const [publishScreenshots, setPublishScreenshots] = useState([]);
  const [publishStatus, setPublishStatus] = useState('');
  const saveTimer = useRef(null);
  const canEditData = isOwner || accessRole === 'Editor';

  useEffect(() => {
    loadProject(projectId, location.state?.projectName);
    // Only reload when the route project changes — not when location.state updates after save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, loadProject]);

  useEffect(
    () => () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    },
    [],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      const mod = event.ctrlKey || event.metaKey;
      const state = useBuilderStore.getState();

      if (mod && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        if (typing) return;
        event.preventDefault();
        state.undo();
        return;
      }
      if (mod && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
        if (typing) return;
        event.preventDefault();
        state.redo();
        return;
      }
      if (mod && event.key.toLowerCase() === 'd' && state.selectedId && !typing) {
        event.preventDefault();
        state.duplicateComponent(state.selectedId);
        return;
      }

      if (typing) return;

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
    if (result.projectId !== projectId) {
      navigate(`/builder/${result.projectId}`, {
        replace: true,
        state: { projectName: useBuilderStore.getState().projectName },
      });
    }
    saveTimer.current = window.setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const handleProjectNameBlur = async () => {
    const trimmed = (useBuilderStore.getState().projectName || '').trim() || 'Untitled Project';
    setProjectName(trimmed);
    if (!canEditData) return;

    const result = await saveProjectName();
    if (!result.ok) {
      setSaveStatus('error');
      setSaveMessage(result.message || 'Could not save project name.');
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => setSaveStatus('idle'), 6000);
      return;
    }

    if (result.projectId && result.projectId !== projectId) {
      navigate(`/builder/${result.projectId}`, {
        replace: true,
        state: { projectName: trimmed },
      });
    }
  };

  const handlePublish = async (event, { submit = true } = {}) => {
    event.preventDefault();
    setPublishStatus(submit ? 'Submitting for review…' : 'Saving draft…');
    let id = storeProjectId;
    if (!/^[a-f0-9]{24}$/i.test(id)) {
      const saved = await saveProject();
      if (!saved.ok) {
        setPublishStatus(saved.message);
        return;
      }
      id = saved.projectId;
      navigate(`/builder/${id}`, { replace: true });
    }

    const result = await createListing({
      projectId: id,
      description: publishDescription.trim(),
      tags: publishTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      screenshots: publishScreenshots,
      submit,
    });

    if (!result.ok) {
      setPublishStatus(result.message);
      return;
    }

    const listingId = result.data?.listing?.id;
    const listingStatus = result.data?.listing?.status;
    setPublishDescription('');
    setPublishTags('');
    setPublishScreenshots([]);
    setPublishStatus('');
    setShowPublish(false);

    // Owner can Visit immediately (even while Pending/Draft). Marketplace browse waits for Approved.
    if (listingId) {
      const goVisit = window.confirm(
        listingStatus === 'Approved'
          ? 'Published! Open the live site now?'
          : listingStatus === 'Draft'
            ? 'Draft saved. Open your site preview now?'
            : 'Submitted for review. Open your site preview now? (Marketplace Visit works for everyone after admin approval.)',
      );
      if (goVisit) {
        navigate(`/site/${listingId}`);
      }
    }
  };

  const handleScreenshotPick = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (publishScreenshots.length >= 8) {
      setPublishStatus('A listing can have at most 8 screenshots.');
      return;
    }

    setPublishStatus('Uploading screenshot…');
    const remaining = 8 - publishScreenshots.length;
    const next = [...publishScreenshots];
    for (const file of files.slice(0, remaining)) {
      const result = await uploadFile(file);
      if (!result.ok) {
        setPublishStatus(result.message);
        return;
      }
      const url = result.data?.url || result.data?.path;
      if (url) next.push(url);
    }
    setPublishScreenshots(next);
    setPublishStatus(next.length ? `${next.length} screenshot${next.length === 1 ? '' : 's'} attached.` : '');
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
            disabled={!canEditData}
            onChange={(event) => setProjectName(event.target.value)}
            onBlur={handleProjectNameBlur}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
          />
          <span className="vf-toolbar-page">
            {page?.name}
            <span className="vf-toolbar-path">{page?.path}</span>
          </span>
        </div>

        <div className="vf-toolbar-right">
          <div className="vf-history-toggle" role="group" aria-label="History">
            <button
              type="button"
              className="vf-btn"
              title="Undo (Ctrl+Z)"
              disabled={!canEditData || pastLength === 0}
              onClick={() => undo()}
            >
              Undo
            </button>
            <button
              type="button"
              className="vf-btn"
              title="Redo (Ctrl+Y)"
              disabled={!canEditData || futureLength === 0}
              onClick={() => redo()}
            >
              Redo
            </button>
            <button
              type="button"
              className="vf-btn"
              title="Duplicate selected (Ctrl+D)"
              disabled={!canEditData || !selectedId || previewing}
              onClick={() => selectedId && duplicateComponent(selectedId)}
            >
              Duplicate
            </button>
          </div>

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

          {OBJECT_ID.test(storeProjectId) ? (
            <button type="button" className="vf-btn" onClick={() => setShowDataManager(true)}>
              Data
            </button>
          ) : null}

          {isOwner ? (
            <button type="button" className="vf-btn" onClick={() => setShowPublish(true)}>
              Publish
            </button>
          ) : null}

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
                    <div
                      key={item.id}
                      className={`vf-page-item${item.id === activePageId ? ' is-active' : ''}`}
                    >
                      <button
                        type="button"
                        className="vf-page-item-main"
                        onClick={() => setActivePage(item.id)}
                      >
                        <input
                          value={item.name}
                          aria-label="Page name"
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => renamePage(item.id, { name: event.target.value })}
                        />
                        <input
                          value={item.path}
                          aria-label="Page path"
                          className="vf-page-item-path"
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => renamePage(item.id, { path: event.target.value })}
                        />
                      </button>
                      {pages.length > 1 ? (
                        <button
                          type="button"
                          className="vf-mini-btn"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete page “${item.name}”? This cannot be undone from here.`,
                              )
                            ) {
                              removePage(item.id);
                            }
                          }}
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <Palette />
              <TablesPanel onOpenManager={() => setShowDataManager(true)} />
              <CollaboratorsPanel />
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

      {showPublish ? (
        <div className="vf-modal-overlay" onClick={() => setShowPublish(false)}>
          <form
            className="vf-modal-card"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => handlePublish(event, { submit: true })}
          >
            <h3>Publish to marketplace</h3>
            <p>Save a draft or submit this project for administrator review.</p>
            <textarea
              rows={4}
              value={publishDescription}
              onChange={(event) => setPublishDescription(event.target.value)}
              placeholder="Description"
              required
            />
            <input
              value={publishTags}
              onChange={(event) => setPublishTags(event.target.value)}
              placeholder="Tags (comma separated)"
            />
            <label className="vf-publish-shots">
              Screenshots
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleScreenshotPick}
              />
            </label>
            {publishScreenshots.length ? (
              <ul className="vf-publish-shot-list">
                {publishScreenshots.map((url) => (
                  <li key={url}>
                    <img src={url} alt="" />
                    <button
                      type="button"
                      className="vf-btn"
                      onClick={() =>
                        setPublishScreenshots((current) => current.filter((item) => item !== url))
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {publishStatus ? <p className="vf-panel-note">{publishStatus}</p> : null}
            <div className="vf-modal-actions">
              <button type="button" className="vf-btn" onClick={() => setShowPublish(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="vf-btn"
                onClick={(event) => handlePublish(event, { submit: false })}
              >
                Save draft
              </button>
              <button type="submit" className="vf-btn vf-btn-primary">
                Submit for review
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <DataManager
        open={showDataManager}
        projectId={storeProjectId}
        canEdit={canEditData}
        onClose={() => setShowDataManager(false)}
      />
    </div>
  );
}
