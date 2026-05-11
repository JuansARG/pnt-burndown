// Domain entity — no React, no framework imports

export interface Workspace {
  id: string;       // UUID v4
  name: string;     // 1-80 chars
  createdAt: string; // ISO 8601
}
