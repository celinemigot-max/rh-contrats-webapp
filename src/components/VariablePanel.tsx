'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { VariableDef } from './RichEditor';

export default function VariablePanel({ variables, editor }: { variables: VariableDef[]; editor: Editor | null }) {
  const [query, setQuery] = useState('');
  const [insertBold, setInsertBold] = useState(false);
  const filtered = variables.filter(v => v.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="w-64 shrink-0 border rounded-lg bg-white p-3 h-fit sticky top-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">Variables</p>
        <span className="text-xs text-gray-400">{variables.length}</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Place ton curseur dans le texte, puis clique sur une variable pour l&apos;insérer. Fais défiler pour voir toutes les variables.
      </p>
      <label className="flex items-center gap-2 text-sm mb-3 px-2.5 py-1.5 rounded-md bg-gray-50 border cursor-pointer">
        <input type="checkbox" checked={insertBold} onChange={e => setInsertBold(e.target.checked)} />
        Insérer en gras
      </label>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Rechercher une variable"
        className="w-full text-sm border rounded-md px-2 py-1.5 mb-2"
      />
      <div className="relative">
        <div className="flex flex-col gap-1.5 max-h-[70vh] overflow-y-auto pr-1">
          {filtered.map(v => (
            <button
              key={v.tag}
              type="button"
              disabled={!editor}
              onClick={() => editor?.chain().focus().insertVariable({ tag: v.tag, label: v.label, bold: insertBold }).run()}
              className={`text-left text-sm px-2.5 py-1.5 rounded-md border transition disabled:opacity-50 ${
                insertBold ? 'font-bold' : ''
              } border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100`}
            >
              {v.label}
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-gray-400">Aucune variable trouvée.</p>}
        </div>
        {filtered.length > 8 && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-1 h-6 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
    </div>
  );
}
