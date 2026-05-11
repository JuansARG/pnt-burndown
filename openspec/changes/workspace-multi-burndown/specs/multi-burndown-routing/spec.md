# Multi-Burndown Routing Specification

## Purpose

Hash-mode routing using TanStack Router that enables deep-linking to any
Workspace or Burndown without conflicting with the existing share-URL mechanism.

## Requirements

### Requirement: Hash-Mode Router

The system MUST use TanStack Router configured with `createHashHistory` so all
routes are prefixed with `#`. This MUST be compatible with GitHub Pages
static hosting (no server-side routing required).

#### Scenario: Root route renders workspace list

- GIVEN the user opens the app at any origin
- WHEN the URL path is `/#/` (or bare `/`)
- THEN `WorkspaceListPage` is rendered

#### Scenario: Workspace route renders workspace page

- GIVEN a Workspace with id "abc123" exists
- WHEN the user navigates to `/#/workspace/abc123`
- THEN `WorkspacePage` renders the burndown list for that workspace

#### Scenario: Burndown route renders burndown page

- GIVEN a Workspace "abc123" and Burndown "xyz789" exist
- WHEN the user navigates to `/#/workspace/abc123/burndown/xyz789`
- THEN `BurndownPage` renders the burndown for id "xyz789"

---

### Requirement: Route Parameters

The system MUST expose `:wid` and `:bid` as typed route params. `BurndownPage`
MUST read `burndownId` from route params rather than props or global state.

#### Scenario: BurndownPage loads correct burndown

- GIVEN two burndowns "xyz789" and "qrs456" in the same workspace
- WHEN the user navigates to `/#/workspace/abc123/burndown/xyz789`
- THEN only the data for "xyz789" is loaded and displayed

---

### Requirement: Not Found Handling

The system MUST render a not-found fallback for any unrecognised hash route.
The fallback MUST offer a link back to `/#/`.

#### Scenario: Unknown route

- GIVEN the user navigates to `/#/this/does/not/exist`
- WHEN no route matches
- THEN a not-found page is shown with a "Go home" link

---

### Requirement: Share Route

The system MUST expose a `/#/share` route that reads a `data` query parameter
and restores burndown state from the encoded payload (see `url-serialization`
spec). This route MUST NOT conflict with workspace or burndown routes.

#### Scenario: Share route decodes payload

- GIVEN the URL is `/#/share?data=<base64url>`
- WHEN the route is activated
- THEN the burndown state is decoded from the `data` param and displayed

#### Scenario: Missing data param

- GIVEN the URL is `/#/share` with no `data` param
- WHEN the route is activated
- THEN an error message "Invalid share link" is displayed
