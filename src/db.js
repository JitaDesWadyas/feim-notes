import { openDB } from 'idb';
import { Node } from './models/Node.js';
import { Edge } from './models/Edge.js';
import { Category } from './models/Category.js';

const DB_NAME = 'feim-notes-db';
const DB_VERSION = 2;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('tree');
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('categories')) {
            db.createObjectStore('categories');
          }
          if (!db.objectStoreNames.contains('nodes')) {
            db.createObjectStore('nodes');
          }
          if (!db.objectStoreNames.contains('edges')) {
            db.createObjectStore('edges');
          }
        }
      },
    });
  }
  return dbPromise;
}

// Graph storage
export async function saveGraph(categories, nodes, edges) {
  const db = await getDB();
  const tx = db.transaction(['categories', 'nodes', 'edges'], 'readwrite');
  await Promise.all([
    tx.objectStore('categories').put(categories.map(c => c.toJSON()), 'data'),
    tx.objectStore('nodes').put(nodes.map(n => n.toJSON()), 'data'),
    tx.objectStore('edges').put(edges.map(e => e.toJSON()), 'data'),
    tx.done
  ]);
}

export async function loadGraph() {
  const db = await getDB();
  const [categories, nodes, edges] = await Promise.all([
    db.get('categories', 'data'),
    db.get('nodes', 'data'),
    db.get('edges', 'data')
  ]);
  
  if (!categories && !nodes && !edges) {
    // Try loading old tree format
    const oldTree = await db.get('tree', 'tree-data');
    if (oldTree && oldTree.roots) {
      return migrateTreeToGraph(oldTree);
    }
    // Return empty graph instead of null
    return {
      categories: [],
      nodes: [],
      edges: []
    };
  }
  
  return {
    categories: (categories || []).map(c => Category.fromJSON(c)),
    nodes: (nodes || []).map(n => Node.fromJSON(n)),
    edges: (edges || []).map(e => Edge.fromJSON(e))
  };
}

function migrateTreeToGraph(tree) {
  const categories = [];
  const nodes = [];
  const edges = [];
  let edgeOrder = 0;

  function processNode(treeNode, categoryId, parentId = null, order = 0) {
    const node = new Node({
      id: treeNode.id,
      categoryId: categoryId,
      title: treeNode.text || '',
      contentMd: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    nodes.push(node);

    if (parentId) {
      edges.push(new Edge({
        categoryId: categoryId,
        fromId: parentId,
        toId: node.id,
        kind: 'contains',
        order: order
      }));
    }

    if (treeNode.children && treeNode.children.length > 0) {
      treeNode.children.forEach((child, idx) => {
        processNode(child, categoryId, node.id, idx);
      });
    }
  }

  tree.roots.forEach((root, idx) => {
    const category = new Category({
      id: root.id,
      title: root.text || 'Untitled',
      order: idx
    });
    categories.push(category);
    
    if (root.children && root.children.length > 0) {
      root.children.forEach((child, childIdx) => {
        processNode(child, category.id, null, childIdx);
      });
    }
  });

  return { categories, nodes, edges };
}

export function createDefaultGraph() {
  return {
    categories: [],
    nodes: [],
    edges: []
  };
}

// Backward compat
export async function saveTree(tree) {
  // Not used anymore, but keep for any legacy code
}

export async function loadTree() {
  return await loadGraph();
}

export function createDefaultTree() {
  return createDefaultGraph();
}
