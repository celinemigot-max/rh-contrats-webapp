'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type TemplateMeta = { id: string; name: string; fileName: string; uploadedAt: string };

function Dropzone({
  label,
  hint,
  accept,
  onFiles,
  busy,
}: {
  label: string;
  hint: string;
  accept: string;
  onFiles: (files: FileList) => void;
  busy: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
    },
    [onFiles]
  );

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
        dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => e.target.files && onFiles(e.target.files)}
        multiple
      />
      <p className="font-medium">{busy ? 'Traitement en cours…' : label}</p>
      <p className="text-sm text-gray-500 mt-1">{hint}</p>
    </div>
  );
}

export default function Parametres() {
  const [sheetInfo, setSheetInfo] = useState<{ count: number; columns: string[]; updatedAt: string | null }>({
    count: 0,
    columns: [],
    updatedAt: null,
  });
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [sheetBusy, setSheetBusy] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const refresh = useCallback(() => {
    fetch('/api/sheet').then(r => r.json()).then(d =>
      setSheetInfo({ count: (d.employees || []).length, columns: d.columns || [], updatedAt: d.updatedAt })
    );
    fetch('/api/templates').then(r => r.json()).then(d => setTemplates(d.templates || []));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleSheetUpload(files: FileList) {
    setMessage(null);
    setSheetBusy(true);
    const formData = new FormData();
    formData.append('file', files[0]);
    try {
      const res = await fetch('/api/sheet', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `${data.count} collaborateur(s) chargé(s).` });
      refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur.' });
    } finally {
      setSheetBusy(false);
    }
  }

  async function handleTemplateUpload(files: FileList) {
    setMessage(null);
    setTemplateBusy(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name.replace(/\.docx$/i, ''));
        const res = await fetch('/api/templates', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }
      setMessage({ type: 'success', text: 'Modèle(s) ajouté(s).' });
      refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur.' });
    } finally {
      setTemplateBusy(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    await fetch(`/api/templates/${id}`, { method: 'DELETE' });
    refresh();
  }

  return (
    <div className="mx-auto max-w-2xl w-full p-6 sm:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Gérer les fichiers</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Générer un contrat</Link>
      </div>

      {message && (
        <p className={`mb-6 text-sm rounded-md p-3 border ${
          message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {message.text}
        </p>
      )}

      <section className="mb-10">
        <h2 className="font-medium mb-2">Feuille de données collaborateurs</h2>
        <p className="text-sm text-gray-500 mb-3">
          Exporte ton Google Sheet en <code>.xlsx</code> (Fichier → Télécharger → Microsoft Excel) et dépose-le ici. La première ligne doit contenir les en-têtes de colonnes.
        </p>
        <Dropzone
          label="Glisse ton fichier Excel/CSV ici, ou clique pour choisir"
          hint=".xlsx ou .csv"
          accept=".xlsx,.xls,.csv"
          onFiles={handleSheetUpload}
          busy={sheetBusy}
        />
        {sheetInfo.count > 0 && (
          <div className="mt-3 text-sm text-gray-600">
            <p>{sheetInfo.count} collaborateur(s) chargé(s){sheetInfo.updatedAt ? ` — mis à jour le ${new Date(sheetInfo.updatedAt).toLocaleString('fr-FR')}` : ''}.</p>
            <p className="mt-1">Colonnes détectées : {sheetInfo.columns.join(', ')}</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-medium mb-2">Modèles de contrat (Word)</h2>
        <p className="text-sm text-gray-500 mb-3">
          Fichiers <code>.docx</code> contenant des balises <code>{'{{NomDeColonne}}'}</code> correspondant aux colonnes de ta feuille de données.
        </p>
        <Dropzone
          label="Glisse un ou plusieurs modèles Word ici, ou clique pour choisir"
          hint=".docx"
          accept=".docx"
          onFiles={handleTemplateUpload}
          busy={templateBusy}
        />
        {templates.length > 0 && (
          <ul className="mt-4 divide-y border rounded-md">
            {templates.map(tpl => (
              <li key={tpl.id} className="flex items-center justify-between p-3">
                <span className="text-sm">{tpl.name}</span>
                <button
                  onClick={() => handleDeleteTemplate(tpl.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
