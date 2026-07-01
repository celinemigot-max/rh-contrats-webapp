'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Employee = Record<string, string> & { _id: string };
type TemplateSummary = { id: string; name: string; updatedAt: string };

export default function Home() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [employeeId, setEmployeeId] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch('/api/sheet').then(r => r.json()).then(d => setEmployees(d.employees || []));
    fetch('/api/templates').then(r => r.json()).then(d => setTemplates(d.templates || []));
  }, []);

  function handleCardClick(templateId: string) {
    if (!employeeId) {
      setNotice('Choisis d\'abord un collaborateur ci-dessus.');
      return;
    }
    router.push(`/contrat/${templateId}?employee=${employeeId}`);
  }

  return (
    <div className="mx-auto max-w-4xl w-full p-6 sm:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Générateur de contrats CDI</h1>
        <Link href="/parametres" className="text-sm text-blue-600 hover:underline">
          Gérer les collaborateurs
        </Link>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">1. Collaborateur</label>
        <select
          className="w-full sm:w-96 border rounded-md p-2.5 bg-white"
          value={employeeId}
          onChange={e => { setEmployeeId(e.target.value); setNotice(''); }}
        >
          <option value="">— Sélectionner —</option>
          {employees.map(emp => (
            <option key={emp._id} value={emp._id}>
              {emp.Nom} {emp.Prenom} {emp.Poste ? `— ${emp.Poste}` : ''}
            </option>
          ))}
        </select>
        {employees.length === 0 && (
          <p className="text-sm text-amber-700 mt-2">
            Aucun collaborateur chargé — va dans <Link href="/parametres" className="underline">Gérer les collaborateurs</Link>.
          </p>
        )}
      </div>

      <label className="block text-sm font-medium mb-3">2. Modèle de contrat</label>
      {notice && <p className="text-sm text-amber-700 mb-3">{notice}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {templates.map(tpl => (
          <div
            key={tpl.id}
            className="group relative border rounded-xl bg-white h-36 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:shadow-sm transition p-3 text-center"
            onClick={() => handleCardClick(tpl.id)}
          >
            <span className="font-medium text-sm">{tpl.name}</span>
            <Link
              href={`/modeles/${tpl.id}`}
              onClick={e => e.stopPropagation()}
              className="absolute top-2 right-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition"
            >
              Modifier
            </Link>
          </div>
        ))}

        <Link
          href="/modeles/nouveau"
          className="border-2 border-dashed rounded-xl h-36 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition"
        >
          <span className="text-2xl leading-none">+</span>
          <span className="text-sm font-medium">Nouveau modèle</span>
        </Link>
      </div>
    </div>
  );
}
