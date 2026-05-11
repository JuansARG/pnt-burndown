# Delta for URL Serialization

## MODIFIED Requirements

### Requirement: Share via URL

The system MUST encode the current burndown state as a Base64url string and
expose it as a share link. The share link MUST use the format
`/#/share?data=<base64url>` instead of `window.location.hash`.
(Previously: share link was `window.location.hash = <base64url>`, which
conflicts with hash-mode routing.)

#### Scenario: Generate share link

- GIVEN the user is on a BurndownPage
- WHEN the user triggers "Copy Share Link"
- THEN the system encodes the burndown state as Base64url
- AND copies `{origin}/#/share?data=<base64url>` to the clipboard

#### Scenario: Load from share link

- GIVEN the user opens `{origin}/#/share?data=<base64url>`
- WHEN the share route is activated
- THEN the burndown state is decoded from the `data` query param
- AND the burndown chart and data are rendered in read-only preview mode

#### Scenario: Tampered or truncated payload

- GIVEN the URL is `/#/share?data=INVALID_BASE64`
- WHEN the route is activated
- THEN decoding fails gracefully
- AND an error message "Invalid share link" is shown (no crash)

#### Scenario: Missing data parameter

- GIVEN the URL is `/#/share` with no `data` param
- WHEN the route is activated
- THEN an error message "Invalid share link" is shown

## REMOVED Requirements

### Requirement: Hash-Based Share Encoding

(Reason: `window.location.hash` is now reserved for TanStack Router routes.
Share data moves to the `data` query param on the `/#/share` route.)
