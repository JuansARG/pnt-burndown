import type { Workspace } from '../../domain/entities/Workspace';
import type { Burndown } from '../../domain/entities/Burndown';
import { workspaceStorageAdapter } from './workspaceStorageAdapter';
import { burndownStorageAdapter } from './burndownStorageAdapter';

const LEGACY_KEY = 'burnup:sprint';
const MIGRATED_FLAG = 'burnup:migrated:v2';

function generateId(): string {
  // crypto.randomUUID is available in modern browsers and Vite env
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * One-time boot migration: burnup:sprint → default workspace + burndown.
 * Idempotent — checks burnup:migrated:v2 flag before running.
 */
export function migrateLegacySprint(): void {
  try {
    // Already migrated
    if (localStorage.getItem(MIGRATED_FLAG)) return;

    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) {
      try {
        const legacySprint = JSON.parse(raw);

        const wsId = generateId();
        const workspace: Workspace = {
          id: wsId,
          name: 'Default Workspace',
          createdAt: nowISO(),
        };

        const burndown: Burndown = {
          ...legacySprint,
          id: generateId(),
          workspaceId: wsId,
          name: legacySprint.name ?? 'Migrated Sprint',
          createdAt: nowISO(),
        };

        workspaceStorageAdapter.save(workspace);
        burndownStorageAdapter.save(burndown);
      } catch {
        // Corrupt legacy data — skip data, write flag, warn
        console.warn('[burnup] Legacy sprint data is corrupt — skipping migration of data.');
      }
    }

    // Write flag BEFORE deleting legacy key (crash-safe)
    localStorage.setItem(MIGRATED_FLAG, '1');
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // localStorage unavailable — silently skip
  }
}
