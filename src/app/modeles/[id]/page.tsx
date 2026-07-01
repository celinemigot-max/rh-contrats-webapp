'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Editor } from '@tiptap/react';
import RichEditor, { type VariableDef } from '@/components/RichEditor';
import VariablePanel from '@/components/VariablePanel';
import { getVariableDefs } from '@/lib/variables';

export default function TemplateEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === 'nouveau';

  const [name, setName] = useState('');
  const [initialContent, setInitialContent] = useState('<p></p>');
  const [variables, setVariables] = useState<VariableDef[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/sheet')
      .then(r => r.json())
      .then(d => setVariables(getVariableDefs(d.columns || [])));
  }, []);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/templates/${params.id}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json();
      })
      .then(d => {
        setName(d.template.name);
        setInitialContent(d.template.content || '<p></p>');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isNew, params.id]);

  const handleReady = useCallback((e: Editor) => setEditor(e), []);

  async function handleSave() {
    if (!name.trim()) {
      setError('Donne un nom à ce modèle.');
      return;
    }
    setError('');
    setSaving(true);
    const content = editor?.getHTML() ?? '';
    try {
      const res = await fetch(isNew ? '/api/templates' : `/api/templates/${params.id}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce modèle définitivement ?')) return;
    await fetch(`/api/templates/${params.id}`, { method: 'DELETE' });
    router.push('/');
  }

  if (loading) return <div className="p-10 text-center text-gray-400">Chargement…</div>;

  return (
    <div className="mx-auto max-w-5xl w-full p-6 sm:p-10">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Retour</Link>
        <div className="flex gap-2">
          {!isNew && (
            <button onClick={handleDelete} className="text-sm text-red-600 hover:underline px-3">
              Supprimer
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer le modèle'}
          </button>
        </div>
      </div>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nom du modèle (ex. CDI Cadre)"
        className="w-full text-xl font-semibold mb-6 border-b pb-2 focus:outline-none focus:border-blue-500 bg-transparent"
      />

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="flex gap-6 items-start">
        <div className="flex-1">
          <RichEditor initialContent={initialContent} onReady={handleReady} placeholder="Rédige le contrat, insère des variables depuis le panneau à droite…" />
        </div>
        <VariablePanel variables={variables} editor={editor} />
      </div>
    </div>
  );
}
