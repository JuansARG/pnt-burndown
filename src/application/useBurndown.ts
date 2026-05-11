import { useState, useEffect } from 'react';
import type { Sprint, DayEntry } from '../domain/entities/Sprint';
import type { Burndown } from '../domain/entities/Burndown';
import { calculateIdealLine, type IdealPoint } from '../domain/usecases/calculateIdealLine';
import { burndownStorageAdapter } from '../infrastructure/storage/burndownStorageAdapter';
import { shareUrlAdapter } from '../infrastructure/sharing/shareUrlAdapter';

export interface BurndownState {
  sprint: Sprint | null;
  idealLine: IdealPoint[];
  isSharing: boolean;
  shareUrl: string;
}

export interface BurndownActions {
  setupSprint(sprint: Sprint): void;
  logDay(entry: DayEntry): void;
  deleteEntry(date: string): void;
  updateEntryDate(oldDate: string, newDate: string): boolean; // false = date already taken
  updateNote(date: string, note: string): void;
  share(): void;
  reset(): void;
}

function computeIdealLine(sprint: Sprint | null): IdealPoint[] {
  if (!sprint) return [];
  return calculateIdealLine(sprint);
}

export function useBurndown(burndownId: string): BurndownState & BurndownActions {
  const [burndown, setBurndown] = useState<Burndown | null>(null);
  const [idealLine, setIdealLine] = useState<IdealPoint[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // On mount / burndownId change: load from storage
  useEffect(() => {
    const loaded = burndownStorageAdapter.load(burndownId);
    if (loaded) {
      setBurndown(loaded);
      setIdealLine(computeIdealLine(loaded));
    } else {
      setBurndown(null);
      setIdealLine([]);
    }
    setIsSharing(false);
    setShareUrl('');
  }, [burndownId]);

  function persistAndUpdate(next: Burndown) {
    setBurndown(next);
    setIdealLine(computeIdealLine(next));
    burndownStorageAdapter.save(next);
  }

  function setupSprint(newSprint: Sprint): void {
    if (!burndown) return;
    setIsSharing(false);
    setShareUrl('');
    persistAndUpdate({ ...burndown, ...newSprint });
  }

  function logDay(entry: DayEntry): void {
    if (!burndown) return;
    const existing = burndown.entries.findIndex(e => e.date === entry.date);
    const nextEntries =
      existing >= 0
        ? burndown.entries.map((e, i) => (i === existing ? entry : e))
        : [...burndown.entries, entry].sort((a, b) => a.date.localeCompare(b.date));
    persistAndUpdate({ ...burndown, entries: nextEntries });
  }

  function deleteEntry(date: string): void {
    if (!burndown) return;
    persistAndUpdate({ ...burndown, entries: burndown.entries.filter(e => e.date !== date) });
  }

  function updateEntryDate(oldDate: string, newDate: string): boolean {
    if (!burndown) return false;
    const alreadyExists = burndown.entries.some(e => e.date === newDate);
    if (alreadyExists) return false;
    const nextEntries = burndown.entries
      .map(e => e.date === oldDate ? { ...e, date: newDate } : e)
      .sort((a, b) => a.date.localeCompare(b.date));
    persistAndUpdate({ ...burndown, entries: nextEntries });
    return true;
  }

  function updateNote(date: string, note: string): void {
    if (!burndown) return;
    const nextEntries = burndown.entries.map(e =>
      e.date === date ? { ...e, note } : e
    );
    persistAndUpdate({ ...burndown, entries: nextEntries });
  }

  function share(): void {
    if (!burndown) return;
    const encoded = shareUrlAdapter.encode(burndown);
    // Build share URL: current origin + hash prefix + /share?data=
    const base = window.location.origin + window.location.pathname;
    const url = `${base}#/share?data=${encoded}`;
    setShareUrl(url);
    setIsSharing(true);
  }

  function reset(): void {
    if (!burndown) return;
    // Reset sprint data but keep identity fields
    const reset: Burndown = {
      ...burndown,
      totalPoints: 0,
      startDate: '',
      endDate: '',
      entries: [],
    };
    burndownStorageAdapter.save(reset);
    setBurndown(reset);
    setIdealLine([]);
    setIsSharing(false);
    setShareUrl('');
  }

  return {
    sprint: burndown,
    idealLine,
    isSharing,
    shareUrl,
    setupSprint,
    logDay,
    deleteEntry,
    updateEntryDate,
    updateNote,
    share,
    reset,
  };
}
