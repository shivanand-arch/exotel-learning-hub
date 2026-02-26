import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Team, ContentModule, FileBlob } from '../types';
import { DB_NAME, DB_VERSION, DEFAULT_TEAMS, DEFAULT_MODULES } from '../config/constants';

interface ExotelHubDB extends DBSchema {
  teams: {
    key: string;
    value: Team;
    indexes: { 'by-name': string };
  };
  modules: {
    key: string;
    value: ContentModule;
    indexes: { 'by-team': string; 'by-type': string };
  };
  fileBlobs: {
    key: string; // moduleId
    value: FileBlob;
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
}

let dbInstance: IDBPDatabase<ExotelHubDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ExotelHubDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ExotelHubDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Teams store
      if (!db.objectStoreNames.contains('teams')) {
        const teamsStore = db.createObjectStore('teams', { keyPath: 'id' });
        teamsStore.createIndex('by-name', 'name');
      }

      // Modules store
      if (!db.objectStoreNames.contains('modules')) {
        const modulesStore = db.createObjectStore('modules', { keyPath: 'id' });
        modulesStore.createIndex('by-team', 'teamId');
        modulesStore.createIndex('by-type', 'type');
      }

      // File blobs store
      if (!db.objectStoreNames.contains('fileBlobs')) {
        db.createObjectStore('fileBlobs', { keyPath: 'moduleId' });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Seed data on first install
      if (oldVersion === 0) {
        const tx = db.transaction(['teams', 'modules', 'settings'], 'readwrite');
        DEFAULT_TEAMS.forEach(t => tx.objectStore('teams').add(t));
        DEFAULT_MODULES.forEach(m => tx.objectStore('modules').add(m));
        tx.objectStore('settings').add({ key: 'initialized', value: true });
      }
    },
  });

  return dbInstance;
}

// ─── Teams ────────────────────────────────────────────────────────────────────
export async function getAllTeams(): Promise<Team[]> {
  const db = await getDB();
  return db.getAll('teams');
}

export async function getTeam(id: string): Promise<Team | undefined> {
  const db = await getDB();
  return db.get('teams', id);
}

export async function saveTeam(team: Team): Promise<void> {
  const db = await getDB();
  await db.put('teams', team);
}

export async function deleteTeam(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['teams', 'modules', 'fileBlobs'], 'readwrite');
  await tx.objectStore('teams').delete(id);
  // Delete all modules for this team
  const modules = await tx.objectStore('modules').index('by-team').getAll(id);
  for (const mod of modules) {
    await tx.objectStore('modules').delete(mod.id);
    await tx.objectStore('fileBlobs').delete(mod.id);
  }
  await tx.done;
}

// ─── Modules ─────────────────────────────────────────────────────────────────
export async function getAllModules(): Promise<ContentModule[]> {
  const db = await getDB();
  return db.getAll('modules');
}

export async function getModulesByTeam(teamId: string): Promise<ContentModule[]> {
  const db = await getDB();
  return db.getAllFromIndex('modules', 'by-team', teamId);
}

export async function getModule(id: string): Promise<ContentModule | undefined> {
  const db = await getDB();
  return db.get('modules', id);
}

export async function saveModule(module: ContentModule, fileData?: ArrayBuffer): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['modules', 'fileBlobs'], 'readwrite');
  await tx.objectStore('modules').put(module);
  if (fileData) {
    await tx.objectStore('fileBlobs').put({ moduleId: module.id, data: fileData });
  }
  await tx.done;
}

export async function deleteModule(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['modules', 'fileBlobs'], 'readwrite');
  await tx.objectStore('modules').delete(id);
  await tx.objectStore('fileBlobs').delete(id);
  await tx.done;
}

// ─── File Blobs ───────────────────────────────────────────────────────────────
export async function getFileBlob(moduleId: string): Promise<FileBlob | undefined> {
  const db = await getDB();
  return db.get('fileBlobs', moduleId);
}

export async function getFileBlobUrl(moduleId: string): Promise<string | null> {
  const blob = await getFileBlob(moduleId);
  if (!blob) return null;
  const b = new Blob([blob.data]);
  return URL.createObjectURL(b);
}

export async function getFileBlobTypedUrl(moduleId: string, mimeType: string): Promise<string | null> {
  const blob = await getFileBlob(moduleId);
  if (!blob) return null;
  const b = new Blob([blob.data], { type: mimeType });
  return URL.createObjectURL(b);
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function getSetting(key: string): Promise<unknown> {
  const db = await getDB();
  const row = await db.get('settings', key);
  return row?.value;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}
