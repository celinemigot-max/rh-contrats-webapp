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
  const [downloading, setDownloading] = useState(false);
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

  async function handleDownload() {
    setDownloading(true);
    setSuccess('');
    setError('');
    const html = editor?.getHTML() ?? '';
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, fileName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Contrat téléchargé.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-400">Génération en cours…</div>;

  return (
    <div className="mx-auto max-w-3xl w-full p-6 sm:p-10">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Retour</Link>
        {!error && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-blue-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {downloading ? 'Génération…' : 'Télécharger le contrat (.docx)'}
          </button>
        )}
      </div>

      {templateName && <p className="text-sm text-gray-500 mb-4">Modèle : {templateName}</p>}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      {success && <p className="text-sm text-green-700 mb-4">{success}</p>}

      {!error && (
        <>
          <p className="text-sm text-gray-500 mb-3">
            Les informations du collaborateur ont été pré-remplies. Relis et modifie librement le texte ci-dessous avant de télécharger.
          </p>
          <RichEditor initialContent={initialContent} onReady={handleReady} />
        </>
      )}
    </div>
  );
}
