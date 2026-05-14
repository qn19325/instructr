export type UploadState =
  | { phase: 'idle' }
  | { phase: 'validating' }
  | { phase: 'uploading' }
  | { phase: 'recording' }
  | { phase: 'error'; message: string }
  | { phase: 'done' };
