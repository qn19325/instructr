import { getUploadUrl, recordUpload } from '@/app/clients/actions';
import { useState } from 'react';

export function useDocumentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File, checklistItemId: string) {
    setIsUploading(true);
    setError(null);
    try {
      const { uploadUrl, r2Key } = await getUploadUrl(checklistItemId, file.type, file.size);
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!res.ok) throw new Error('Could not fetch document');
      await recordUpload(checklistItemId, r2Key, file.name, file.type, file.size);
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : 'Upload Failed';
      setError(errMessage);
    } finally {
      setIsUploading(false);
    }
  }

  return { upload, isUploading, error };
}
