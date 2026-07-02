'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Editor } from '@tiptap/react';
import RichEditor from '@/components/RichEditor';

export default function ContractPage() {
  const params = useParams<{ templateId: string }>();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get('employee') ?? '';

  const [initialContent, setInitialContent] = useState('<p></p>');
  const [fileName, setFileName] = useState('contrat');
  const [templateName, setTemplateName] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingWord, setDownloadingWord] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewingPdf, setPreviewingPdf] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!employeeId) {
      setError('Aucun collaborateur sélectionné.');
      setLoading(false);
      return;
    }
    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, templateId: params.templateId }),
    })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        return data;
      })
      .then(d => {
        setInitialContent(d.html || '<p></p>');
        setFileName(d.fileName || 'contrat');
        setTemplateName(d.templateName || '');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [employeeId, params.templateId]);

  const handleReady = useCallback((e: Editor) => setEditor(e), []);

  async function downloadFile(endpoint: string, extension: string, setBusy: (b: boolean) => void) {
    setBusy(true);
    setSuccess('');
    setError('');
    const html = editor?.getHTML() ?? '';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, fileName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Contrat téléchargé.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setBusy(false);
    }
  }

  async function openPdfPreview() {
    setPreviewingPdf(true);
    setError('');
    const html = editor?.getHTML() ?? '';
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, fileName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const blob = await res.blob();
      setPdfPreviewUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setPreviewingPdf(false);
    }
  }

  function closePdfPreview() {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  }

  if (loading) return <div className="p-10 text-center text-gray-400">Génération en cours…</div>;

  return (
    <div className="mx-auto max-w-3xl w-full p-6 sm:p-10">
      <div className="print:hidden flex items-center justify-between mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Retour</Link>
        {!error && (
          <div className="flex gap-2">
            <button
              onClick={openPdfPreview}
              disabled={previewingPdf}
              className="bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
            >
              {previewingPdf ? 'Génération…' : 'Aperçu PDF (pagination exacte)'}
            </button>
            <button
              onClick={() => downloadFile('/api/export-pdf', 'pdf', setDownloadingPdf)}
              disabled={downloadingPdf}
              className="bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
            >
              {downloadingPdf ? 'Génération…' : 'Télécharger en PDF'}
            </button>
            <button
              onClick={() => downloadFile('/api/export', 'docx', setDownloadingWord)}
              disabled={downloadingWord}
              className="bg-blue-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {downloadingWord ? 'Génération…' : 'Télécharger le contrat (.docx)'}
            </button>
          </div>
        )}
      </div>

      {templateName && <p className="print:hidden text-sm text-gray-500 mb-4">Modèle : {templateName}</p>}
      {error && <p className="print:hidden text-sm text-red-600 mb-4">{error}</p>}
      {success && <p className="print:hidden text-sm text-green-700 mb-4">{success}</p>}

      {!error && (
        <>
          <p className="print:hidden text-sm text-gray-500 mb-3">
            Les informations du collaborateur ont été pré-remplies. Relis et modifie librement le texte ci-dessous avant de télécharger.
            Utilise « Aperçu PDF » pour voir la pagination réelle et exacte du document.
          </p>
          <RichEditor initialContent={initialContent} onReady={handleReady} />
        </>
      )}

      {pdfPreviewUrl && (
        <div className="print:hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <p className="text-sm font-medium">Aperçu PDF — pagination exacte</p>
              <button onClick={closePdfPreview} className="text-sm text-gray-600 hover:underline px-2">
                Fermer
              </button>
            </div>
            <iframe src={pdfPreviewUrl} className="flex-1 w-full rounded-b-lg" title="Aperçu PDF" />
          </div>
        </div>
      )}
    </div>
  );
}
