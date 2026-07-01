import { normalizeKey } from './sheet';
import type { VariableDef } from '@/components/RichEditor';

export function getVariableDefs(columns: string[]): VariableDef[] {
  const fromColumns = columns.map(header => ({ tag: normalizeKey(header), label: header }));
  return [
    ...fromColumns,
    { tag: 'Civilite', label: 'Civilité (Madame/Monsieur)' },
    { tag: 'DateDuJour', label: "Date du jour" },
  ];
}
