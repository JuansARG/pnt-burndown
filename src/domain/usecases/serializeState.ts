import type { Sprint } from '../entities/Sprint';
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

/* ------------------------------------------------------------------ */
/*  v1 – Base64url JSON (legacy, kept for backward compatibility)    */
/* ------------------------------------------------------------------ */

function deserializeV1(raw: string): Sprint {
  const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '==='.slice(0, (4 - (b64.length % 4)) % 4);
  const json = decodeURIComponent(
    atob(padded)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );
  const sprint = JSON.parse(json) as Sprint;

  if (
    typeof sprint.name !== 'string' ||
    typeof sprint.totalPoints !== 'number' ||
    typeof sprint.startDate !== 'string' ||
    typeof sprint.endDate !== 'string' ||
    !Array.isArray(sprint.entries)
  ) {
    throw new Error('Invalid sprint data');
  }

  return sprint;
}

/* ------------------------------------------------------------------ */
/*  v2 – Compact positional array + lz-string compression            */
/* ------------------------------------------------------------------ */

function serializeV2(sprint: Sprint): string {
  const entries = sprint.entries.map((e) => {
    const row: [string, number, string?] = [e.date, e.remaining];
    if (e.note !== undefined) row.push(e.note);
    return row;
  });

  const payload: unknown[] = [
    sprint.name,
    sprint.totalPoints,
    sprint.startDate,
    sprint.endDate,
    entries,
  ];

  if (sprint.scopeChanges && sprint.scopeChanges.length > 0) {
    payload.push(
      sprint.scopeChanges.map((sc) => {
        const row: [string, number, string?] = [sc.date, sc.delta];
        if (sc.note !== undefined) row.push(sc.note);
        return row;
      })
    );
  }

  if (sprint.holidays && sprint.holidays.length > 0) {
    payload.push(sprint.holidays);
  }

  if (sprint.useWorkingDays) {
    payload.push(1);
  }

  const json = JSON.stringify(payload);
  const compressed = compressToEncodedURIComponent(json);
  return '~' + compressed;
}

function deserializeV2(raw: string): Sprint {
  const withoutPrefix = raw.startsWith('~') ? raw.slice(1) : raw;
  const json = decompressFromEncodedURIComponent(withoutPrefix);
  const arr = JSON.parse(json) as unknown[];

  if (!Array.isArray(arr) || arr.length < 5) {
    throw new Error('Invalid v2 sprint data');
  }

  const [name, totalPoints, startDate, endDate, entriesRaw] = arr;

  if (
    typeof name !== 'string' ||
    typeof totalPoints !== 'number' ||
    typeof startDate !== 'string' ||
    typeof endDate !== 'string' ||
    !Array.isArray(entriesRaw)
  ) {
    throw new Error('Invalid v2 sprint data');
  }

  const entries = (entriesRaw as unknown[]).map((e) => {
    if (!Array.isArray(e) || e.length < 2) {
      throw new Error('Invalid v2 entry');
    }
    const [date, remaining, note] = e;
    if (typeof date !== 'string' || typeof remaining !== 'number') {
      throw new Error('Invalid v2 entry');
    }
    return {
      date,
      remaining,
      note: note !== undefined ? String(note) : undefined,
    };
  });

  let scopeChanges: Sprint['scopeChanges'] = undefined;
  let holidays: Sprint['holidays'] = undefined;
  let useWorkingDays: Sprint['useWorkingDays'] = undefined;

  let pos = 5;

  // scopeChanges → array of arrays
  if (
    pos < arr.length &&
    Array.isArray(arr[pos]) &&
    (arr[pos] as unknown[]).length > 0 &&
    Array.isArray((arr[pos] as unknown[])[0])
  ) {
    scopeChanges = (arr[pos] as unknown[]).map((sc) => {
      if (!Array.isArray(sc) || sc.length < 2) {
        throw new Error('Invalid v2 scopeChange');
      }
      const [date, delta, note] = sc;
      if (typeof date !== 'string' || typeof delta !== 'number') {
        throw new Error('Invalid v2 scopeChange');
      }
      return {
        date,
        delta,
        note: note !== undefined ? String(note) : undefined,
      };
    });
    pos++;
  }

  // holidays → array of strings
  if (
    pos < arr.length &&
    Array.isArray(arr[pos]) &&
    (arr[pos] as unknown[]).length > 0 &&
    typeof (arr[pos] as unknown[])[0] === 'string'
  ) {
    holidays = (arr[pos] as unknown[]).map((h) => String(h));
    pos++;
  }

  // useWorkingDays → 1 or true
  if (pos < arr.length && (arr[pos] === 1 || arr[pos] === true)) {
    useWorkingDays = true;
    pos++;
  }

  return {
    name,
    totalPoints,
    startDate,
    endDate,
    entries,
    scopeChanges,
    holidays,
    useWorkingDays,
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Serialize sprint to a compact v2 string (prefixed with `~`).
 * Falls back to v1 internally only for reads; writes always emit v2.
 */
export function serialize(sprint: Sprint): string {
  return serializeV2(sprint);
}

/**
 * Deserialize a raw hash string back to a Sprint.
 * Detects `~` prefix → v2 path; otherwise v1 Base64url path.
 * Throws on invalid input — caller must catch.
 */
export function deserialize(raw: string): Sprint {
  if (raw.startsWith('~')) {
    try {
      return deserializeV2(raw);
    } catch {
      // malformed v2 — give v1 a chance
    }
  }
  return deserializeV1(raw);
}
