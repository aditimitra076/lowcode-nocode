import { create } from 'zustand';
import { createComponent } from '../builder/componentRegistry';
import {
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

function createPage(name, path) {
  return { id: createId('page'), name, path, components: [] };
}

const initialPage = createPage('Home', '/');

function activePageOf(state) {
  return state.pages.find((page) => page.id === state.activePageId) || state.pages[0];
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
  };
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

  setProjectName(projectName) {
    set({ projectName });
  },

  setActivePage(pageId) {
    set({ activePageId: pageId, selectedId: null, dropTarget: null });
  },

  addPage() {
    set((state) => {
      const page = createPage(`Page ${state.pages.length + 1}`, `/page-${state.pages.length + 1}`);
      return {
        pages: [...state.pages, page],
        activePageId: page.id,
        selectedId: null,
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

  addComponent(type, parentId = 'root', index) {
    const node = createComponent(type);
    set((state) => {
      const page = activePageOf(state);
      if (!page) return state;
      if (parentId !== 'root' && !findNode(page.components, parentId)) return state;
      const targetIndex =
        index ?? (findNode(page.components, parentId)?.children?.length ?? page.components.length);
      const pages = state.pages.map((item) =>
        item.id === page.id
          ? { ...item, components: insertNode(item.components, parentId, targetIndex, node) }
          : item,
      );
      return { pages, selectedId: node.id, dropTarget: null };
    });
    return node;
  },

  moveComponent(id, parentId, index) {
    set((state) => {
      const page = activePageOf(state);
      if (!page) return state;
      const node = findNode(page.components, id);
      if (!node) return state;
      // A container cannot be moved inside itself or one of its descendants.
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
      return { pages, dropTarget: null };
    });
  },

  deleteComponent(id) {
    set((state) => {
      const page = activePageOf(state);
      if (!page) return state;
      const { nodes, removed } = removeNode(page.components, id);
      if (!removed) return state;
      return {
        pages: state.pages.map((item) =>
          item.id === page.id ? { ...item, components: nodes } : item,
        ),
        selectedId: state.selectedId === id ? null : state.selectedId,
        dropTarget: null,
      };
    });
  },

  updateProps(id, patch) {
    set((state) => ({
      pages: state.pages.map((page) => ({
        ...page,
        components: updateNode(page.components, id, (node) => ({
          ...node,
          props: { ...node.props, ...patch },
        })),
      })),
    }));
  },

  updateStyle(id, patch) {
    set((state) => ({
      pages: state.pages.map((page) => ({
        ...page,
        components: updateNode(page.components, id, (node) => ({
          ...node,
          style: { ...node.style, ...patch },
        })),
      })),
    }));
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
    set({
      projectId: id,
      loading: true,
      loadError: null,
      selectedId: null,
      previewing: false,
      dropTarget: null,
      savedAt: null,
    });

    if (!OBJECT_ID.test(id)) {
      set({ ...emptyProject(fallbackName || 'Untitled Project'), loading: false });
      return;
    }

    const result = await fetchProject(id);

    // The project may have been deleted, or this is a new project URL.
    if (!result.ok && (result.status === 404 || result.status === 0)) {
      set({
        ...emptyProject(fallbackName || 'Untitled Project'),
        loading: false,
        loadError: result.status === 0 ? result.message : null,
      });
      return;
    }

    if (!result.ok) {
      set({
        ...emptyProject(fallbackName || 'Untitled Project'),
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
      projectName: project.name,
      pages,
      activePageId: pages[0].id,
      viewport: 'desktop',
      loading: false,
      savedAt: project.updatedAt || null,
    });
  },

  async saveProject() {
    const { projectId, projectName, pages } = get();
    const payload = {
      name: (projectName || '').trim() || 'Untitled Project',
      pages,
    };

    let result = OBJECT_ID.test(projectId)
      ? await updateProject(projectId, payload)
      : await createProject(payload);

    // Local draft or a project that no longer exists on the server.
    if (!result.ok && result.status === 404) {
      result = await createProject(payload);
    }

    if (!result.ok) {
      set({ loadError: result.message });
      return { ok: false, message: result.message };
    }

    const project = result.data.project;
    set({
      projectId: project.id,
      projectName: project.name,
      savedAt: project.updatedAt,
      loadError: null,
    });
    return { ok: true, projectId: project.id, savedAt: project.updatedAt };
  },
}));

export function useActivePage() {
  return useBuilderStore((state) => activePageOf(state));
}
