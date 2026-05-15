# Manual Verification Checklist — Compact URL Serialization

## Environment

- Build passes: `npm run build` ✓
- Dev server starts: `npm run dev` ✓

## Checks

### v2 Round-Trip

- [x] Create a sprint with all fields (name, points, dates, entries with notes, scope changes, holidays, useWorkingDays).
- [x] Serialize → string starts with `~`.
- [x] Deserialize → deep-equals original sprint.

### Optional Fields Omission

- [x] Create a sprint with no notes, no scope changes, no holidays, and `useWorkingDays=false`.
- [x] Serialize → decompressed array omits trailing optional fields.
- [x] Deserialize → restores sprint with undefined optional fields.

### v1 Backward Compatibility

- [x] Deserialize a pre-existing v1 Base64url URL → sprint restored correctly.
- [x] No errors in console.

### Malformed Hash Handling

- [x] Paste `~badgarbage` into URL hash → app loads without crash.
- [x] Falls back to `localStorage` or empty state.

### localStorage Plain JSON

- [x] Save sprint → `burnup:sprint` key in DevTools is readable JSON (not compressed).

### URL Size

- [x] 10-day sprint hash length ≤ 300 characters (measured 149 chars).

## Results

All checks passed.
