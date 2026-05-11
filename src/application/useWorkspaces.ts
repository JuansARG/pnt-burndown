import { useState, useCallback } from 'react';
import type { Workspace } from '../domain/entities/Workspace';
import { workspaceStorageAdapter } from '../infrastructure/storage/workspaceStorageAdapter';
import { burndownStorageAdapter } from '../infrastructure/storage/burndownStorageAdapter';

function generateId(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() =>
    workspaceStorageAdapter.loadAll()
  );

  const refresh = useCallback(() => {
    setWorkspaces(workspaceStorageAdapter.loadAll());
  }, []);

  const create = useCallback((name: string): Workspace => {
    const ws: Workspace = {
      id: generateId(),
      name: name.trim(),
      createdAt: nowISO(),
    };
    workspaceStorageAdapter.save(ws);
    refresh();
    return ws;
  }, [refresh]);

  const rename = useCallback((id: string, name: string): void => {
    const all = workspaceStorageAdapter.loadAll();
    const ws = all.find(w => w.id === id);
    if (!ws) return;
    workspaceStorageAdapter.save({ ...ws, name: name.trim() });
    refresh();
  }, [refresh]);

  const remove = useCallback((id: string): void => {
    const burndowns = burndownStorageAdapter.listByWorkspace(id);
    for (const bd of burndowns) {
      burndownStorageAdapter.remove(bd.id);
    }
    workspaceStorageAdapter.remove(id);
    refresh();
  }, [refresh]);

  return { workspaces, create, rename, remove };
}
