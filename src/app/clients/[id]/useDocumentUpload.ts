import { useState } from 'react';
import { getUploadUrl, recordUpload } from './actions';
import { UploadErrorType, UploadState } from './uploadState';

export function useDocumentUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({ state: 'idle' });

  async function upload(file: File, checklistItemId: string) {
    let uploadUrl = '';
    let documentKey = '';

    try {
      setUploadState({ state: 'validating' });
      const res = await getUploadUrl(checklistItemId, file.type, file.size);
      uploadUrl = res.uploadUrl;
      documentKey = res.documentKey;
    } catch {
      setUploadState({
        state: 'error',
        type: UploadErrorType.validation,
        message: 'Failed to validate',
      });
      return;
    }

    try {
      setUploadState({ state: 'uploading' });
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!res.ok) {
        setUploadState({
          state: 'error',
          type: UploadErrorType.storage,
          message: 'Upload to storage failed',
        });
        return;
      }
    } catch {
      setUploadState({ state: 'error', type: 'storage', message: 'Upload to storage failed' });
      return;
    }

    try {
      setUploadState({ state: 'recording' });
      await recordUpload(checklistItemId, documentKey, file.name, file.type, file.size);
    } catch {
      setUploadState({
        state: 'error',
        type: UploadErrorType.record,
        message: 'Failed to record upload',
      });
      return;
    }

    setUploadState({ state: 'done' });
  }

  return { upload, state: uploadState };
}
