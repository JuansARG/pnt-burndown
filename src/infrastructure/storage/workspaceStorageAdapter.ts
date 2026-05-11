import type { Workspace } from '../../domain/entities/Workspace';

const STORAGE_KEY = 'burnup:workspaces';

export const workspaceStorageAdapter = {
  loadAll(): Workspace[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as Workspace[];
    } catch {
      return [];
    }
  },

  save(ws: Workspace): void {
    try {
      const all = workspaceStorageAdapter.loadAll();
      const idx = all.findIndex(w => w.id === ws.id);
      if (idx >= 0) {
        all[idx] = ws;
      } else {
        all.push(ws);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      // quota exceeded or SecurityError — silently ignore
    }
  },

  remove(id: string): void {
    try {
      const all = workspaceStorageAdapter.loadAll().filter(w => w.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      // silently ignore
    }
  },
};
