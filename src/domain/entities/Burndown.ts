// Domain entity — no React, no framework imports
import type { Sprint } from './Sprint';

export interface Burndown extends Sprint {
  id: string;          // UUID v4
  workspaceId: string; // FK → Workspace.id
  name: string;        // display name (may differ from Sprint.name)
  createdAt: string;   // ISO 8601
}
