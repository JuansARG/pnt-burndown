import { useState, useEffect } from 'react';
import type { Sprint, DayEntry } from '../domain/entities/Sprint';
import { calculateIdealLine, type IdealPoint } from '../domain/usecases/calculateIdealLine';
import { localStorageAdapter } from '../infrastructure/storage/localStorageAdapter';
import { urlStateAdapter } from '../infrastructure/url/urlStateAdapter';

export interface BurndownState {
  sprint: Sprint | null;
  idealLine: IdealPoint[];
  isSharing: boolean;
  shareUrl: string;
}

export interface BurndownActions {
  setupSprint(sprint: Sprint): void;
  logDay(entry: DayEntry): void;       // upserts by date
  updateNote(date: string, note: string): void;
  share(): void;
  reset(): void;
}

function computeIdealLine(sprint: Sprint | null): IdealPoint[] {
  if (!sprint) return [];
  return calculateIdealLine(sprint);
}

export function useBurndown(): BurndownState & BurndownActions {
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [idealLine, setIdealLine] = useState<IdealPoint[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // On mount: URL hash → localStorage → null
  useEffect(() => {
    let loaded = urlStateAdapter.read();
    if (loaded) {
      // Sync URL hash sprint into localStorage
      localStorageAdapter.save(loaded);
    } else {
      loaded = localStorageAdapter.load();
    }
    if (loaded) {
      setSprint(loaded);
      setIdealLine(computeIdealLine(loaded));
    }
  }, []);

  function persistAndUpdate(next: Sprint) {
    setSprint(next);
    setIdealLine(computeIdealLine(next));
    localStorageAdapter.save(next);
    // If share panel is open, keep URL in sync
    if (isSharing) {
      urlStateAdapter.write(next);
      setShareUrl(window.location.href);
    }
  }

  function setupSprint(newSprint: Sprint): void {
    setIsSharing(false);
    setShareUrl('');
    persistAndUpdate(newSprint);
  }

  function logDay(entry: DayEntry): void {
    if (!sprint) return;
    const existing = sprint.entries.findIndex(e => e.date === entry.date);
    const nextEntries =
      existing >= 0
        ? sprint.entries.map((e, i) => (i === existing ? entry : e))
        : [...sprint.entries, entry].sort((a, b) => a.date.localeCompare(b.date));
    persistAndUpdate({ ...sprint, entries: nextEntries });
  }

  function updateNote(date: string, note: string): void {
    if (!sprint) return;
    const nextEntries = sprint.entries.map(e =>
      e.date === date ? { ...e, note } : e
    );
    persistAndUpdate({ ...sprint, entries: nextEntries });
  }

  function share(): void {
    if (!sprint) return;
    urlStateAdapter.write(sprint);
    const url = window.location.href;
    setShareUrl(url);
    setIsSharing(true);
  }

  function reset(): void {
    localStorageAdapter.clear();
    urlStateAdapter.clear();
    setSprint(null);
    setIdealLine([]);
    setIsSharing(false);
    setShareUrl('');
  }

  return {
    sprint,
    idealLine,
    isSharing,
    shareUrl,
    setupSprint,
    logDay,
    updateNote,
    share,
    reset,
  };
}
