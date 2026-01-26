/**
 * Graph utilities for node-edge relationships
 */

export function buildAdjacencyMaps(edges) {
  const childrenByFromId = new Map();
  const parentsByToId = new Map();
  const linksOutByFromId = new Map();
  const linksInByToId = new Map();

  for (const edge of edges) {
    if (edge.kind === 'contains') {
      if (!childrenByFromId.has(edge.fromId)) {
        childrenByFromId.set(edge.fromId, []);
      }
      childrenByFromId.get(edge.fromId).push(edge);

      if (!parentsByToId.has(edge.toId)) {
        parentsByToId.set(edge.toId, []);
      }
      parentsByToId.get(edge.toId).push(edge);
    } else if (edge.kind === 'link') {
      if (!linksOutByFromId.has(edge.fromId)) {
        linksOutByFromId.set(edge.fromId, []);
      }
      linksOutByFromId.get(edge.fromId).push(edge);

      if (!linksInByToId.has(edge.toId)) {
        linksInByToId.set(edge.toId, []);
      }
      linksInByToId.get(edge.toId).push(edge);
    }
  }

  for (const [, edges] of childrenByFromId) {
    edges.sort((a, b) => a.order - b.order);
  }

  return {
    childrenByFromId,
    parentsByToId,
    linksOutByFromId,
    linksInByToId
  };
}

export function getCategoryRoots(categoryId, nodes, parentsByToId) {
  return nodes
    .filter(node => {
      if (node.categoryId !== categoryId) return false;
      const parents = parentsByToId.get(node.id);
      return !parents || parents.length === 0;
    })
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function getChildren(nodeId, childrenByFromId) {
  const edges = childrenByFromId.get(nodeId) || [];
  return edges;
}

export function isInPath(nodeId, pathNodeIds) {
  return pathNodeIds.includes(nodeId);
}

export function searchNodes(query, nodes, categoryId = null) {
  const lowerQuery = query.toLowerCase();
  return nodes.filter(node => {
    if (categoryId && node.categoryId !== categoryId) return false;
    return (
      node.title.toLowerCase().includes(lowerQuery) ||
      node.contentMd.toLowerCase().includes(lowerQuery)
    );
  });
}
