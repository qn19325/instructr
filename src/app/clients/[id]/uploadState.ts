export const UploadErrorType = {
  validation: 'validation',
  storage: 'storage',
  record: 'record',
} as const;
export type UploadErrorType = (typeof UploadErrorType)[keyof typeof UploadErrorType];

export type UploadState =
  | { state: 'idle' }
  | { state: 'validating' }
  | { state: 'uploading' }
  | { state: 'recording' }
  | { state: 'error'; type: UploadErrorType; message: string }
  | { state: 'done' };
