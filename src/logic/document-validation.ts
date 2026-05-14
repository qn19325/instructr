import type { FileMetaData } from '@/types/documents';

export const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const MAX_FILE_SIZE = 10_485_760; // 10 MB

export function validateDocument(
  document: FileMetaData,
): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_TYPES.some((t) => t === document.mimeType)) {
    return { valid: false, error: 'The file type is not allowed' };
  }

  if (document.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'The file size is too large' };
  }

  return { valid: true };
}
