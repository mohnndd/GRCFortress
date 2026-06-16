import { useEffect, useRef, useState } from 'react';
import mammoth from 'mammoth';
import { fetchFileBlob, type PolicyVersionFile } from '../../api/policyApi';

interface Props {
  file: PolicyVersionFile | null; // null = preview a local (pre-upload) File
  localFile?: File;              // used when file is null
  onClose: () => void;
}

type PreviewState =
  | { kind: 'loading' }
  | { kind: 'pdf' | 'image'; objectUrl: string }
  | { kind: 'docx'; html: string }
  | { kind: 'unsupported' }
  | { kind: 'error'; message: string };

const IMAGE_TYPES = new Set(['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP']);

export function FilePreviewModal({ file, localFile, onClose }: Props) {
  const [state, setState] = useState<PreviewState>({ kind: 'loading' });
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ kind: 'loading' });
      try {
        let blob: Blob;
        let fileType: string;

        if (localFile) {
          blob = localFile;
          fileType = detectTypeFromName(localFile.name);
        } else if (file) {
          const url = await fetchFileBlob(file.id);
          objectUrlRef.current = url;
          if (cancelled) { URL.revokeObjectURL(url); return; }
          fileType = file.fileType;
          // Re-fetch as blob for mammoth
          if (fileType === 'DOCX' || fileType === 'DOC') {
            const resp = await fetch(url);
            blob = await resp.blob();
          } else {
            if (cancelled) return;
            setState(
              fileType === 'PDF' ? { kind: 'pdf', objectUrl: url }
              : IMAGE_TYPES.has(fileType) ? { kind: 'image', objectUrl: url }
              : { kind: 'unsupported' }
            );
            return;
          }
        } else {
          setState({ kind: 'unsupported' });
          return;
        }

        if (cancelled) return;

        if (fileType === 'PDF') {
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          setState({ kind: 'pdf', objectUrl: url });
        } else if (IMAGE_TYPES.has(fileType)) {
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          setState({ kind: 'image', objectUrl: url });
        } else if (fileType === 'DOCX' || fileType === 'DOC') {
          const arrayBuffer = await blob.arrayBuffer();
          if (cancelled) return;
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (cancelled) return;
          setState({ kind: 'docx', html: result.value });
        } else {
          setState({ kind: 'unsupported' });
        }
      } catch (e) {
        if (!cancelled) setState({ kind: 'error', message: String(e) });
      }
    }

    load();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [file, localFile]);

  const title = localFile?.name ?? file?.fileName ?? 'Preview';

  return (
    <div className="preview-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="preview-modal">
        <div className="preview-modal-header">
          <span className="preview-modal-title" title={title}>{title}</span>
          <button className="preview-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="preview-modal-body">
          {state.kind === 'loading' && (
            <div className="preview-loading">
              <div className="preview-spinner" />
              <p>Loading preview…</p>
            </div>
          )}
          {state.kind === 'pdf' && (
            <iframe
              src={state.objectUrl}
              title="PDF Preview"
              className="preview-iframe"
            />
          )}
          {state.kind === 'image' && (
            <div className="preview-image-wrap">
              <img src={state.objectUrl} alt={title} className="preview-image" />
            </div>
          )}
          {state.kind === 'docx' && (
            <div
              className="preview-docx"
              dangerouslySetInnerHTML={{ __html: state.html }}
            />
          )}
          {state.kind === 'unsupported' && (
            <div className="preview-unsupported">
              <span className="preview-unsupported-icon">📄</span>
              <p>Preview not available for this file type.</p>
              <p className="preview-unsupported-hint">Download the file to open it locally.</p>
            </div>
          )}
          {state.kind === 'error' && (
            <div className="preview-unsupported">
              <span className="preview-unsupported-icon">⚠️</span>
              <p>Failed to load preview.</p>
              <p className="preview-unsupported-hint">{state.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function detectTypeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf'))  return 'PDF';
  if (lower.endsWith('.docx')) return 'DOCX';
  if (lower.endsWith('.doc'))  return 'DOC';
  if (lower.endsWith('.png'))  return 'PNG';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'JPG';
  if (lower.endsWith('.gif'))  return 'GIF';
  if (lower.endsWith('.webp')) return 'WEBP';
  return 'OTHER';
}
