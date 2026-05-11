import type { Sprint } from '../../domain/entities/Sprint';
import { serialize, deserialize } from '../../domain/usecases/serializeState';

export const shareUrlAdapter = {
  /**
   * Encode a Sprint into a base64url string for the ?data= query param.
   */
  encode(sprint: Sprint): string {
    return serialize(sprint);
  },

  /**
   * Decode a base64url string back to a Sprint.
   * Returns null if the input is invalid or corrupt.
   */
  decode(raw: string): Sprint | null {
    try {
      return deserialize(raw);
    } catch {
      return null;
    }
  },
};
