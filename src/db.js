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
    roots: [
      {
        id: crypto.randomUUID(),
        text: 'FEIM',
        collapsed: false,
        children: [
          { id: crypto.randomUUID(), text: '00 Inbox', collapsed: true, children: [] },
          { id: crypto.randomUUID(), text: '10 Lore', collapsed: true, children: [] },
          { id: crypto.randomUUID(), text: '20 Regions', collapsed: true, children: [] },
          { id: crypto.randomUUID(), text: '30 NPC', collapsed: true, children: [] },
          { id: crypto.randomUUID(), text: '40 Monsters', collapsed: true, children: [] },
          { id: crypto.randomUUID(), text: '50 Items / Discs', collapsed: true, children: [] },
          { id: crypto.randomUUID(), text: '60 Quests / Campaign', collapsed: true, children: [] },
          { id: crypto.randomUUID(), text: '90 Dev TODO', collapsed: true, children: [] },
        ]
      }
    ]
  };
}
