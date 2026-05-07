// Domain entities — no React, no framework imports
// Dates are always YYYY-MM-DD strings. Never Date objects in domain.

export interface DayEntry {
  date: string;      // YYYY-MM-DD
  remaining: number; // story points remaining after this day
  note?: string;     // optional, max 280 chars
}

export interface Sprint {
  name: string;
  totalPoints: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  entries: DayEntry[];
  holidays?: string[];      // ISO date strings e.g. ["2026-05-25"]
  useWorkingDays?: boolean; // when true, ideal line uses working days only
}
