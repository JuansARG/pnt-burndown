import { useState, useCallback } from 'react';
import type { Burndown } from '../domain/entities/Burndown';
import { burndownStorageAdapter } from '../infrastructure/storage/burndownStorageAdapter';

function generateId(): string {
  return crypto.randomUUID();
}

function nowISO(): string {
  return new Date().toISOString();
}

export function useBurndownList(workspaceId: string) {
  const [burndowns, setBurndowns] = useState<Burndown[]>(() =>
    burndownStorageAdapter.listByWorkspace(workspaceId)
  );

  const refresh = useCallback(() => {
    setBurndowns(burndownStorageAdapter.listByWorkspace(workspaceId));
  }, [workspaceId]);

  const create = useCallback((name: string): Burndown => {
    const bd: Burndown = {
      id: generateId(),
      workspaceId,
      name: name.trim(),
      createdAt: nowISO(),
      // Sprint defaults
      totalPoints: 0,
      startDate: '',
      endDate: '',
      entries: [],
    };
    burndownStorageAdapter.save(bd);
    refresh();
    return bd;
  }, [workspaceId, refresh]);

  const remove = useCallback((id: string): void => {
    burndownStorageAdapter.remove(id);
    refresh();
  }, [refresh]);

  return { burndowns, create, remove };
}
