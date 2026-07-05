interface SourceDocumentOriginalPreviewProps {
  document: any;
  chunks: any[];
  originalUrl: string | null;
  originalContentType: string | null;
  originalFilename: string | null;
  originalError: string | null;
  focusExcerpt: string;
  focusChunkIndex: number | null;
  resolvedFocusPageNo: number | null;
  mode: string;
}

export function SourceDocumentOriginalPreview(props: SourceDocumentOriginalPreviewProps) {
  return <div className="p-4 text-sm text-[#756b62]">Source Document Preview</div>;
}
