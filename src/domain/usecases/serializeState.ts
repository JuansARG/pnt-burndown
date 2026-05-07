import type { Sprint } from '../entities/Sprint';

/**
 * Serialize sprint to a Base64url string safe for URL hash.
 * Base64url: replace + → -, / → _, strip trailing =
 */
export function serialize(sprint: Sprint): string {
  const json = JSON.stringify(sprint);
  const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p) =>
    String.fromCharCode(parseInt(p, 16))
  ));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Deserialize a Base64url string back to a Sprint.
 * Throws on invalid input — caller must catch.
 */
export function deserialize(raw: string): Sprint {
  // Restore Base64url to standard Base64
  const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding back
  const padded = b64 + '==='.slice(0, (4 - (b64.length % 4)) % 4);
  const json = decodeURIComponent(
    atob(padded)
      .split('')
      .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );
  const sprint = JSON.parse(json) as Sprint;

  // Minimal structural validation
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
