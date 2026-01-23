import { openDB } from 'idb';

const DB_NAME = 'feim-notes-db';
const STORE_NAME = 'tree';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function saveTree(tree) {
  const db = await getDB();
  await db.put(STORE_NAME, tree, 'tree-data');
}

export async function loadTree() {
  const db = await getDB();
  return await db.get(STORE_NAME, 'tree-data');
}

export function createDefaultTree() {
  return {
    version: 1,
    roots: []
  };
}
