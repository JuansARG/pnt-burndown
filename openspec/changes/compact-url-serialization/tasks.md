# Tasks: Compact URL Serialization

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Compact URL serialization + backward compat | PR 1 | Single deliverable; verification checklist included |

## Phase 1: Foundation

- [x] 1.1 Run `npm install` and `npm run build` to confirm `lz-string` resolves and the project compiles cleanly.

## Phase 2: Core Implementation

- [x] 2.1 Add `serializeV2` to `src/domain/usecases/serializeState.ts`: convert Sprint to compact positional array, `JSON.stringify`, `lz-string.compressToEncodedURIComponent`, prefix with `~`.
- [x] 2.2 Add `deserializeV2` to `src/domain/usecases/serializeState.ts`: strip `~`, decompress, parse, reconstruct Sprint from positional array with optional fields.
- [x] 2.3 Refactor `serialize` to call `serializeV2` and return the `~`-prefixed result.
- [x] 2.4 Refactor `deserialize` to detect `~` prefix: route to `deserializeV2`, catch failure and fallback to the existing v1 Base64url path.

## Phase 3: Verification & Documentation

- [x] 3.1 Confirm `src/infrastructure/url/urlStateAdapter.ts` still catches deserialization errors gracefully (no logic change required).
- [x] 3.2 Add manual verification checklist to `openspec/changes/compact-url-serialization/verification.md` covering v2 round-trip, optional fields omission, v1 backward compat, malformed hash, localStorage plain JSON, and URL size ≤300 chars.
- [x] 3.3 Run manual verification: create a sprint, copy share URL, confirm `~` prefix and length ≤300 chars, open in a new tab to verify restoration, then open a pre-existing v1 URL to confirm backward compat.

## Phase 4: Cleanup

- [x] 4.1 Remove any temporary debug code or console logs added during implementation.
