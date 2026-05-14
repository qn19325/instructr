import { useState } from 'react';

import { getUploadUrl, recordUpload } from './actions';

import type { UploadState } from './uploadState';

export function useDocumentUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({ phase: 'idle' });

  async function upload(file: File, checklistItemId: string) {
    let uploadUrl = '';
    let documentKey = '';

    try {
      setUploadState({ phase: 'validating' });
      const res = await getUploadUrl(checklistItemId, file.type, file.size);
      uploadUrl = res.uploadUrl;
      documentKey = res.documentKey;
    } catch {
      setUploadState({ phase: 'error', message: 'Failed to validate' });
      return;
    }

    try {
      setUploadState({ phase: 'uploading' });
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!res.ok) throw new Error('Storage rejected upload');
    } catch {
      setUploadState({ phase: 'error', message: 'Upload to storage failed' });
      return;
    }

    try {
      setUploadState({ phase: 'recording' });
      await recordUpload(checklistItemId, documentKey, file.name, file.type, file.size);
    } catch {
      setUploadState({ phase: 'error', message: 'Failed to record upload' });
      return;
    }

    setUploadState({ phase: 'done' });
  }

  return { upload, state: uploadState };
}
