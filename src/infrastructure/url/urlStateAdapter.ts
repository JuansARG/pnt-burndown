import type { Sprint } from '../../domain/entities/Sprint';
import { serialize, deserialize } from '../../domain/usecases/serializeState';

export interface UrlAdapter {
  read(): Sprint | null;
  write(sprint: Sprint): void;
  clear(): void;
}

export const urlStateAdapter: UrlAdapter = {
  read(): Sprint | null {
    try {
      const hash = window.location.hash;
      if (!hash || hash.length <= 1) return null;
      const raw = hash.slice(1); // strip leading #
      return deserialize(raw);
    } catch {
      // Malformed hash — graceful fallback
      return null;
    }
  },

  write(sprint: Sprint): void {
    const encoded = serialize(sprint);
    window.location.hash = encoded;
  },

  clear(): void {
    // Remove hash without triggering navigation
    history.replaceState(null, '', window.location.pathname + window.location.search);
  },
};
