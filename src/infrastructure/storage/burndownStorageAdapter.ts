import type { Burndown } from '../../domain/entities/Burndown';

function storageKey(id: string): string {
  return `burnup:burndown:${id}`;
}

export const burndownStorageAdapter = {
  load(id: string): Burndown | null {
    try {
      const raw = localStorage.getItem(storageKey(id));
      if (!raw) return null;
      return JSON.parse(raw) as Burndown;
    } catch {
      return null;
    }
  },

  listByWorkspace(workspaceId: string): Burndown[] {
    const results: Burndown[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith('burnup:burndown:')) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const bd = JSON.parse(raw) as Burndown;
        if (bd.workspaceId === workspaceId) {
          results.push(bd);
        }
      }
    } catch {
      // silently ignore
    }
    return results.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  save(burndown: Burndown): void {
    try {
      localStorage.setItem(storageKey(burndown.id), JSON.stringify(burndown));
    } catch {
      // quota exceeded or SecurityError — silently ignore
    }
  },

  remove(id: string): void {
    try {
      localStorage.removeItem(storageKey(id));
    } catch {
      // silently ignore
    }
  },
};
