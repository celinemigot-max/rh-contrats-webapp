'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Employee = Record<string, string> & { _id: string };
type TemplateMeta = { id: string; name: string; fileName: string; uploadedAt: string };

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/sheet').then(r => r.json()).then(d => setEmployees(d.employees || []));
    fetch('/api/templates').then(r => r.json()).then(d => setTemplates(d.templates || []));
  }, []);

  async function handleGenerate() {
    setError('');
    setSuccess('');
    if (!employeeId || !templateId) {
      setError('Choisis un collaborateur et un modèle de contrat.');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, templateId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la génération.');
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const fileName = match ? decodeURIComponent(match[1]) : 'contrat.docx';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess('Contrat généré et téléchargé. Pense à le relire avant envoi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl w-full p-6 sm:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Générateur de contrats CDI</h1>
        <Link href="/parametres" className="text-sm text-blue-600 hover:underline">
          Gérer les fichiers
        </Link>
      </div>

      {employees.length === 0 && (
        <p className="mb-6 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3">
          Aucun collaborateur chargé. Va dans{' '}
          <Link href="/parametres" className="underline font-medium">Gérer les fichiers</Link> pour déposer ta feuille de données.
        </p>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">1. Collaborateur</label>
          <select
            className="w-full border rounded-md p-2.5 bg-white"
            value={employeeId}
            onChange={e => setEmployeeId(e.target.value)}
          >
            <option value="">— Sélectionner —</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.Nom} {emp.Prenom} {emp.Poste ? `— ${emp.Poste}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">2. Modèle de contrat</label>
          {templates.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aucun modèle disponible. Ajoute un Word dans{' '}
              <Link href="/parametres" className="underline">Gérer les fichiers</Link>.
            </p>
          ) : (
            <div className="grid gap-2">
              {templates.map(tpl => (
                <label
                  key={tpl.id}
                  className={`flex items-center gap-3 border rounded-md p-3 cursor-pointer transition ${
                    templateId === tpl.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={tpl.id}
                    checked={templateId === tpl.id}
                    onChange={() => setTemplateId(tpl.id)}
                  />
                  <span className="text-sm font-medium">{tpl.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-blue-600 text-white rounded-md py-2.5 font-medium disabled:bg-gray-400 hover:bg-blue-700 transition"
        >
          {generating ? 'Génération en cours…' : 'Générer le contrat'}
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}
      </div>
    </div>
  );
}
