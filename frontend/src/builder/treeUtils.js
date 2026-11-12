// Helpers for the page component tree stored in the page JSON.
// A page holds a flat list of root components; each component may have children.

export function createId(prefix = 'cmp') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function findNode(nodes, id) {
  for (const node of nodes || []) {
    if (node.id === id) return node;
    const match = findNode(node.children, id);
    if (match) return match;
  }
  return null;
}

// Returns where a component lives: its parent container id and index inside it.
export function findParentInfo(nodes, id, parentId = 'root') {
  const list = nodes || [];
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].id === id) {
      return { parentId, index: i, siblings: list };
    }
    const match = findParentInfo(list[i].children, id, list[i].id);
    if (match) return match;
  }
  return null;
}

export function containsNode(node, id) {
  if (!node) return false;
  if (node.id === id) return true;
  return (node.children || []).some((child) => containsNode(child, id));
}

export function removeNode(nodes, id) {
  const list = nodes || [];
  for (let i = 0; i < list.length; i += 1) {
    if (list[i].id === id) {
      return { nodes: [...list.slice(0, i), ...list.slice(i + 1)], removed: list[i] };
    }
    const childResult = removeNode(list[i].children, id);
    if (childResult.removed) {
      const updated = { ...list[i], children: childResult.nodes };
      return {
        nodes: [...list.slice(0, i), updated, ...list.slice(i + 1)],
        removed: childResult.removed,
      };
    }
  }
  return { nodes: list, removed: null };
}

export function insertNode(nodes, parentId, index, node) {
  const list = nodes || [];
  if (parentId === 'root') {
    const copy = [...list];
    copy.splice(clamp(index, 0, copy.length), 0, node);
    return copy;
  }
  return list.map((item) => {
    if (item.id === parentId) {
      const children = [...(item.children || [])];
      children.splice(clamp(index, 0, children.length), 0, node);
      return { ...item, children };
    }
    return { ...item, children: insertNode(item.children, parentId, index, node) };
  });
}

export function updateNode(nodes, id, updater) {
  return (nodes || []).map((item) => {
    if (item.id === id) return updater(item);
    if (item.children?.length) {
      return { ...item, children: updateNode(item.children, id, updater) };
    }
    return item;
  });
}

export function countNodes(nodes) {
  return (nodes || []).reduce((total, node) => total + 1 + countNodes(node.children), 0);
}
