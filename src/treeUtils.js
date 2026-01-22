export function findNodeById(nodes, id) {
  for (let node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function findParentAndIndex(nodes, targetId, parent = null) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === targetId) {
      return { parent, index: i, siblings: nodes };
    }
    if (nodes[i].children) {
      const result = findParentAndIndex(nodes[i].children, targetId, nodes[i]);
      if (result) return result;
    }
  }
  return null;
}

export function deleteNodeById(nodes, id) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      const deleted = nodes[i];
      nodes.splice(i, 1);
      return deleted;
    }
    if (nodes[i].children) {
      const deleted = deleteNodeById(nodes[i].children, id);
      if (deleted) return deleted;
    }
  }
  return null;
}

export function cloneNode(node) {
  return {
    id: crypto.randomUUID(),
    text: node.text,
    collapsed: node.collapsed,
    children: node.children.map(child => cloneNode(child))
  };
}

export function expandAll(nodes) {
  nodes.forEach(node => {
    node.collapsed = false;
    if (node.children) expandAll(node.children);
  });
}

export function collapseAll(nodes) {
  nodes.forEach(node => {
    node.collapsed = true;
    if (node.children) collapseAll(node.children);
  });
}

export function searchNodes(nodes, query, results = []) {
  if (!query) return results;
  const lowerQuery = query.toLowerCase();
  nodes.forEach(node => {
    if (node.text.toLowerCase().includes(lowerQuery)) {
      results.push(node);
    }
    if (node.children) {
      searchNodes(node.children, query, results);
    }
  });
  return results;
}

export function expandAncestors(nodes, targetId) {
  for (let node of nodes) {
    if (node.id === targetId) {
      return true;
    }
    if (node.children) {
      const found = expandAncestors(node.children, targetId);
      if (found) {
        node.collapsed = false;
        return true;
      }
    }
  }
  return false;
}

export function getAllNodeIds(nodes, ids = []) {
  nodes.forEach(node => {
    ids.push(node.id);
    if (node.children) {
      getAllNodeIds(node.children, ids);
    }
  });
  return ids;
}
