export interface BackendResponse {
  data?: unknown;
  error?: { message: string; name: string; stack?: string; code?: string };
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

export interface UpdateState {
  status: UpdateStatus;
  currentVersion: string;
  availableVersion?: string;
  progress?: number;
  error?: string;
}
