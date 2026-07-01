'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type SheetPreview = { name: string; headerCount: number; rowCount: number };

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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sheetOptions, setSheetOptions] = useState<SheetPreview[]>([]);
  const [chosenSheet, setChosenSheet] = useState('');

  const refresh = useCallback(() => {
    fetch('/api/sheet').then(r => r.json()).then(d =>
      setSheetInfo({ count: (d.employees || []).length, columns: d.columns || [], updatedAt: d.updatedAt })
    );
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleFileSelected(files: FileList) {
    setMessage(null);
    setBusy(true);
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/sheet/inspect', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPendingFile(file);
      setSheetOptions(data.sheets || []);
      setChosenSheet(data.suggested || '');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!pendingFile) return;
    setMessage(null);
    setBusy(true);
    const formData = new FormData();
    formData.append('file', pendingFile);
    formData.append('sheetName', chosenSheet);
    try {
      const res = await fetch('/api/sheet', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: 'success', text: `${data.count} collaborateur(s) chargé(s) depuis l'onglet "${chosenSheet}".` });
      setPendingFile(null);
      setSheetOptions([]);
      refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl w-full p-6 sm:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Gérer les collaborateurs</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Générer un contrat</Link>
      </div>

      {message && (
        <p className={`mb-6 text-sm rounded-md p-3 border ${
          message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {message.text}
        </p>
      )}

      <p className="text-sm text-gray-500 mb-3">
        Exporte ton Google Sheet en <code>.xlsx</code> (Fichier → Télécharger → Microsoft Excel) et dépose-le ici. La première ligne de l&apos;onglet doit contenir les en-têtes de colonnes.
      </p>

      {!pendingFile && (
        <Dropzone
          label="Glisse ton fichier Excel/CSV ici, ou clique pour choisir"
          hint=".xlsx ou .csv"
          accept=".xlsx,.xls,.csv"
          onFiles={handleFileSelected}
          busy={busy}
        />
      )}

      {pendingFile && (
        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm font-medium mb-2">Quel onglet contient les données des collaborateurs ?</p>
          <p className="text-xs text-gray-500 mb-3">
            {sheetOptions.length > 1
              ? `${sheetOptions.length} onglets trouvés dans "${pendingFile.name}" — vérifie que le bon est sélectionné.`
              : `Onglet détecté dans "${pendingFile.name}".`}
          </p>
          <select
            value={chosenSheet}
            onChange={e => setChosenSheet(e.target.value)}
            className="w-full border rounded-md p-2 mb-3 bg-white text-sm"
          >
            {sheetOptions.map(s => (
              <option key={s.name} value={s.name}>
                {s.name} ({s.rowCount} lignes, {s.headerCount} colonnes)
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={busy}
              className="bg-blue-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {busy ? 'Import en cours…' : 'Importer cet onglet'}
            </button>
            <button
              onClick={() => { setPendingFile(null); setSheetOptions([]); }}
              className="text-sm text-gray-600 hover:underline px-3"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {sheetInfo.count > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          <p>{sheetInfo.count} collaborateur(s) chargé(s){sheetInfo.updatedAt ? ` — mis à jour le ${new Date(sheetInfo.updatedAt).toLocaleString('fr-FR')}` : ''}.</p>
          <p className="mt-1">Colonnes détectées : {sheetInfo.columns.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
