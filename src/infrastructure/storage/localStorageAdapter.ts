import type { Sprint } from '../../domain/entities/Sprint';

const STORAGE_KEY = 'burnup:sprint';

export interface StorageAdapter {
  load(): Sprint | null;
  save(sprint: Sprint): void;
  clear(): void;
}

export const localStorageAdapter: StorageAdapter = {
  load(): Sprint | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Sprint;
    } catch {
      // JSON parse error or localStorage unavailable
      return null;
    }
  },

  save(sprint: Sprint): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sprint));
    } catch {
      // SecurityError or quota exceeded — silently ignore
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // silently ignore
    }
  },
};
