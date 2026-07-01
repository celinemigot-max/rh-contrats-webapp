import * as XLSX from 'xlsx';
import type { Employee } from './storage';

export function normalizeKey(header: string): string {
  return header
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
}

function computeCivilite(sexe: string | undefined): string {
  const first = (sexe || '').toString().trim().charAt(0).toUpperCase();
  return first === 'F' ? 'Madame' : 'Monsieur';
}

function readSheetRows(sheet: XLSX.WorkSheet): string[][] {
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
}

// Choisit l'onglet le plus probable : celui dont la première ligne ressemble
// le plus à une ligne d'en-têtes (le plus de cellules non vides).
function pickBestSheet(workbook: XLSX.WorkBook): string[][] {
  let best: string[][] = [];
  let bestScore = -1;
  for (const name of workbook.SheetNames) {
    const rows = readSheetRows(workbook.Sheets[name]);
    if (rows.length < 2) continue;
    const headerCount = rows[0].filter(cell => cell.toString().trim() !== '').length;
    if (headerCount > bestScore) {
      bestScore = headerCount;
      best = rows;
    }
  }
  return best;
}

export function parseEmployeeSheet(buffer: Buffer): { employees: Employee[]; columns: string[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const rows = pickBestSheet(workbook);

  if (rows.length === 0) return { employees: [], columns: [] };

  const headers = rows[0].map(h => h.toString().trim());
  const headerIndexes = headers.map((h, i) => (h !== '' ? i : -1)).filter(i => i !== -1);
  const nonEmptyHeaders = headerIndexes.map(i => headers[i]);

  const dataRows = rows.slice(1).filter(row => headerIndexes.some(i => (row[i] ?? '').toString().trim() !== ''));

  const employees: Employee[] = dataRows.map((row, i) => {
    const employee: Employee = { _id: String(i + 1) };
    headerIndexes.forEach(colIndex => {
      employee[normalizeKey(headers[colIndex])] = (row[colIndex] ?? '').toString();
    });
    employee.Civilite = computeCivilite(employee.Sexe);
    return employee;
  });

  return { employees, columns: nonEmptyHeaders };
}

export function employeeLabel(employee: Employee): string {
  const nom = employee.Nom || '';
  const prenom = employee.Prenom || '';
  const poste = employee.Poste || '';
  return [`${nom} ${prenom}`.trim(), poste].filter(Boolean).join(' — ') || `Salarié ${employee._id}`;
}
