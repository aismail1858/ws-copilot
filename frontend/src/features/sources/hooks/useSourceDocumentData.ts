import { useState } from 'react';

interface SourceDocumentData {
  document: any;
  chunks: any[];
  isLoading: boolean;
  error: string | null;
  original: any;
  originalUrl: string | null;
  originalContentType: string | null;
  originalFilename: string | null;
  originalError: string | null;
}

export function useSourceDocumentData(documentId: string): SourceDocumentData {
  const [isLoading] = useState(false);
  return {
    document: null,
    chunks: [],
    isLoading,
    error: null,
    original: null,
    originalUrl: null,
    originalContentType: null,
    originalFilename: null,
    originalError: null,
  };
}
