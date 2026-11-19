import { create } from 'zustand';
import { createComponent } from '../builder/componentRegistry';
import {
  cloneNode,
  containsNode,
  createId,
  findNode,
  findParentInfo,
  insertNode,
  removeNode,
  updateNode,
} from '../builder/treeUtils';
import { createProject, fetchProject, updateProject } from '../api/projectApi';

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const HISTORY_LIMIT = 50;
const STYLE_BATCH_MS = 500;

let styleBatchOpen = false;
let styleBatchTimer = null;
let propsBatchOpen = false;
let propsBatchTimer = null;

function createPage(name, path) {
  return { id: createId('page'), name, path, components: [] };
}

const initialPage = createPage('Home', '/');

function activePageOf(state) {
  return state.pages.find((page) => page.id === state.activePageId) || state.pages[0];
}

function clonePages(pages) {
  return typeof structuredClone === 'function'
    ? structuredClone(pages)
    : JSON.parse(JSON.stringify(pages));
}

function historySnapshot(state) {
  return {
    pages: clonePages(state.pages),
    selectedId: state.selectedId,
    activePageId: state.activePageId,
  };
}

function pushHistory(state) {
  const past = [...(state.past || []), historySnapshot(state)].slice(-HISTORY_LIMIT);
  return { past, future: [] };
}

// Owners and Editors may change the project; Viewers may only open and preview it.
function canModify(state) {
  return state.isOwner || state.accessRole === 'Editor';
}

function emptyProject(projectName = 'Untitled Project') {
  const page = createPage('Home', '/');
  return {
    projectName,
    pages: [page],
    activePageId: page.id,
    selectedId: null,
    viewport: 'desktop',
    previewing: false,
    dropTarget: null,
    savedAt: null,
    isOwner: true,
    accessRole: 'Owner',
    past: [],
    future: [],
  };
}

function clearStyleBatch() {
  styleBatchOpen = false;
  if (styleBatchTimer) {
    clearTimeout(styleBatchTimer);
    styleBatchTimer = null;
  }
}

function clearPropsBatch() {
  propsBatchOpen = false;
  if (propsBatchTimer) {
    clearTimeout(propsBatchTimer);
    propsBatchTimer = null;
  }
}

export const useBuilderStore = create((set, get) => ({
  projectId: 'draft',
  projectName: 'Untitled Project',
  pages: [initialPage],
  activePageId: initialPage.id,
  selectedId: null,
  viewport: 'desktop',
  previewing: false,
  dropTarget: null,
  savedAt: null,
  loading: false,
  loadError: null,
  isOwner: true,
  accessRole: 'Owner',
  past: [],
  future: [],
  dataRevision: 0,

  setProjectName(projectName) {
    set({ projectName });
  },

  /** Notify table previews to refetch after a successful form submit. */
  bumpDataRevision() {
    set((state) => ({ dataRevision: (state.dataRevision || 0) + 1 }));
  },

  setActivePage(pageId) {
    set({ activePageId: pageId, selectedId: null, dropTarget: null });
  },

  addPage() {
    set((state) => {
      if (!canModify(state)) return state;
      const page = createPage(`Page ${state.pages.length + 1}`, `/page-${state.pages.length + 1}`);
      return {
        ...pushHistory(state),
        pages: [...state.pages, page],
        activePageId: page.id,
        selectedId: null,
      };
    });
  },

  renamePage(pageId, patch = {}) {
    set((state) => (!canModify(state) ? state : {
      pages: state.pages.map((page) => {
        if (page.id !== pageId) return page;
        return {
          ...page,
          name:
            typeof patch.name === 'string' && patch.name.trim()
              ? patch.name.trim().slice(0, 80)
              : page.name,
          path:
            typeof patch.path === 'string' && patch.path.trim()
              ? patch.path.trim().slice(0, 200)
              : page.path,
        };
      }),
    }));
  },

  removePage(pageId) {
    set((state) => {
      if (!canModify(state) || state.pages.length <= 1) return state;
      const pages = state.pages.filter((page) => page.id !== pageId);
      const activePageId =
        state.activePageId === pageId ? pages[0].id : state.activePageId;
      return {
        ...pushHistory(state),
        pages,
        activePageId,
        selectedId: null,
        dropTarget: null,
      };
    });
  },

  setViewport(viewport) {
    set({ viewport });
  },

  togglePreview(previewing) {
    set((state) => ({
      previewing: previewing ?? !state.previewing,
      selectedId: null,
      dropTarget: null,
    }));
  },

  select(selectedId) {
    set({ selectedId });
  },

  canUndo() {
    return (get().past || []).length > 0;
  },

  canRedo() {
    return (get().future || []).length > 0;
  },

  undo() {
    clearStyleBatch();
    clearPropsBatch();
    set((state) => {
      const past = state.past || [];
      if (!canModify(state) || !past.length) return state;
      const previous = past[past.length - 1];
      return {
        pages: previous.pages,
        selectedId: previous.selectedId,
        activePageId: previous.activePageId,
        past: past.slice(0, -1),
        future: [...(state.future || []), historySnapshot(state)],
        dropTarget: null,
      };
    });
  },

  redo() {
    clearStyleBatch();
    clearPropsBatch();
    set((state) => {
      const future = state.future || [];
      if (!canModify(state) || !future.length) return state;
      const next = future[future.length - 1];
      return {
        pages: next.pages,
        selectedId: next.selectedId,
        activePageId: next.activePageId,
        past: [...(state.past || []), historySnapshot(state)].slice(-HISTORY_LIMIT),
        future: future.slice(0, -1),
        dropTarget: null,
      };
    });
  },

  addComponent(type, parentId = 'root', index) {
    const node = createComponent(type);
    set((state) => {
      const page = activePageOf(state);
      if (!page || !canModify(state)) return state;
      if (parentId !== 'root' && !findNode(page.components, parentId)) return state;
      const targetIndex =
        index ?? (findNode(page.components, parentId)?.children?.length ?? page.components.length);
      const pages = state.pages.map((item) =>
        item.id === page.id
          ? { ...item, components: insertNode(item.components, parentId, targetIndex, node) }
          : item,
      );
      return {
        ...pushHistory(state),
        pages,
        selectedId: node.id,
        dropTarget: null,
      };
    });
    return node;
  },

  moveComponent(id, parentId, index) {
    set((state) => {
      const page = activePageOf(state);
      if (!page || !canModify(state)) return state;
      const node = findNode(page.components, id);
      if (!node) return state;
      if (parentId === id || containsNode(node, parentId)) return state;

      const info = findParentInfo(page.components, id);
      if (!info) return state;

      const { nodes: withoutNode, removed } = removeNode(page.components, id);
      if (!removed) return state;
      if (parentId !== 'root' && !findNode(withoutNode, parentId)) return state;

      const pages = state.pages.map((item) =>
        item.id === page.id
          ? { ...item, components: insertNode(withoutNode, parentId, index, removed) }
          : item,
      );
      return { ...pushHistory(state), pages, dropTarget: null };
    });
  },

  deleteComponent(id) {
    set((state) => {
      const page = activePageOf(state);
      if (!page || !canModify(state)) return state;
      const { nodes, removed } = removeNode(page.components, id);
      if (!removed) return state;
      return {
        ...pushHistory(state),
        pages: state.pages.map((item) =>
          item.id === page.id ? { ...item, components: nodes } : item,
        ),
        selectedId: state.selectedId === id ? null : state.selectedId,
        dropTarget: null,
      };
    });
  },

  duplicateComponent(id) {
    set((state) => {
      const page = activePageOf(state);
      if (!page || !canModify(state)) return state;
      const info = findParentInfo(page.components, id);
      const source = findNode(page.components, id);
      if (!info || !source) return state;
      const copy = cloneNode(source);
      const pages = state.pages.map((item) =>
        item.id === page.id
          ? {
              ...item,
              components: insertNode(item.components, info.parentId, info.index + 1, copy),
            }
          : item,
      );
      return {
        ...pushHistory(state),
        pages,
        selectedId: copy.id,
        dropTarget: null,
      };
    });
  },

  updateProps(id, patch) {
    set((state) => {
      if (!canModify(state)) return state;
      let history = {};
      if (!propsBatchOpen) {
        history = pushHistory(state);
        propsBatchOpen = true;
      }
      clearTimeout(propsBatchTimer);
      propsBatchTimer = setTimeout(() => {
        propsBatchOpen = false;
      }, STYLE_BATCH_MS);

      return {
        ...history,
        pages: state.pages.map((page) => ({
          ...page,
          components: updateNode(page.components, id, (node) => ({
            ...node,
            props: { ...node.props, ...patch },
          })),
        })),
      };
    });
  },

  updateStyle(id, patch) {
    set((state) => {
      if (!canModify(state)) return state;
      let history = {};
      if (!styleBatchOpen) {
        history = pushHistory(state);
        styleBatchOpen = true;
      }
      clearTimeout(styleBatchTimer);
      styleBatchTimer = setTimeout(() => {
        styleBatchOpen = false;
      }, STYLE_BATCH_MS);

      return {
        ...history,
        pages: state.pages.map((page) => ({
          ...page,
          components: updateNode(page.components, id, (node) => ({
            ...node,
            style: { ...node.style, ...patch },
          })),
        })),
      };
    });
  },

  setDropTarget(dropTarget) {
    set((state) => {
      const current = state.dropTarget;
      if (current === dropTarget) return state;
      if (
        current &&
        dropTarget &&
        current.parentId === dropTarget.parentId &&
        current.index === dropTarget.index
      ) {
        return state;
      }
      return { dropTarget };
    });
  },

  clearDrag() {
    set({ dropTarget: null });
  },

  async loadProject(projectId, fallbackName) {
    const id = projectId || 'draft';
    const requestId = (get()._loadRequestId || 0) + 1;
    clearStyleBatch();
    clearPropsBatch();
    set({
      _loadRequestId: requestId,
      projectId: id,
      loading: true,
      loadError: null,
      selectedId: null,
      previewing: false,
      dropTarget: null,
      savedAt: null,
      past: [],
      future: [],
    });

    if (!OBJECT_ID.test(id)) {
      if (get()._loadRequestId !== requestId) return;
      set({
        ...emptyProject(fallbackName || 'Untitled Project'),
        projectId: 'draft',
        loading: false,
      });
      return;
    }

    const result = await fetchProject(id);
    if (get()._loadRequestId !== requestId) return;

    if (!result.ok && (result.status === 404 || result.status === 0)) {
      set({
        ...emptyProject(fallbackName || 'Untitled Project'),
        projectId: id,
        loading: false,
        loadError: result.status === 0 ? result.message : null,
      });
      return;
    }

    if (!result.ok) {
      set({
        ...emptyProject(fallbackName || 'Untitled Project'),
        projectId: id,
        loading: false,
        loadError: result.message,
      });
      return;
    }

    const project = result.data.project;
    const pages = Array.isArray(project.pages) && project.pages.length
      ? project.pages
      : [createPage('Home', '/')];

    set({
      projectId: project.id,
      projectName: project.name || fallbackName || 'Untitled Project',
      pages,
      activePageId: pages[0].id,
      viewport: 'desktop',
      loading: false,
      savedAt: project.updatedAt || null,
      isOwner: project.isOwner !== false,
      accessRole: project.accessRole || (project.isOwner === false ? 'Viewer' : 'Owner'),
      past: [],
      future: [],
    });
  },

  async saveProjectName() {
    const { projectId, projectName, accessRole, isOwner } = get();
    if (!isOwner && accessRole === 'Viewer') {
      return { ok: false, message: 'You have view-only access to this project.' };
    }

    const name = (projectName || '').trim() || 'Untitled Project';
    set({ projectName: name });

    if (!OBJECT_ID.test(projectId)) {
      return get().saveProject();
    }

    const result = await updateProject(projectId, { name });
    if (!result.ok) {
      return { ok: false, message: result.message };
    }

    const project = result.data.project;
    set({
      projectId: project.id,
      projectName: project.name || name,
      savedAt: project.updatedAt,
      loadError: null,
    });
    return { ok: true, projectId: project.id, savedAt: project.updatedAt };
  },

  async saveProject() {
    const { projectId, projectName, pages, isOwner, accessRole } = get();
    if (!canModify({ isOwner, accessRole })) {
      return { ok: false, message: 'You have view-only access to this project.' };
    }
    const name = (projectName || '').trim() || 'Untitled Project';
    set({ projectName: name });

    const payload = {
      name,
      pages,
    };

    let result = OBJECT_ID.test(projectId)
      ? await updateProject(projectId, payload)
      : await createProject(payload);

    // A 404 means the saved project is gone. Only its owner may start over with a new one: a
    // collaborator who was removed (or whose project was deleted) must not get a private copy.
    if (!result.ok && result.status === 404 && isOwner) {
      result = await createProject(payload);
    }

    if (!result.ok) {
      set({ loadError: result.message });
      return { ok: false, message: result.message };
    }

    const project = result.data.project;
    set({
      projectId: project.id,
      projectName: project.name || name,
      savedAt: project.updatedAt,
      loadError: null,
    });
    return { ok: true, projectId: project.id, savedAt: project.updatedAt };
  },
}));

export function useActivePage() {
  return useBuilderStore((state) => activePageOf(state));
}
