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

function headerScore(rows: string[][]): number {
  if (rows.length < 2) return -1;
  return rows[0].filter(cell => cell.toString().trim() !== '').length;
}

export type SheetPreview = { name: string; headerCount: number; rowCount: number };

// Liste les onglets du fichier avec un aperçu, pour laisser l'utilisateur choisir le bon.
export function listSheetPreviews(buffer: Buffer): { previews: SheetPreview[]; suggested: string } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const previews: SheetPreview[] = [];
  let suggested = workbook.SheetNames[0] ?? '';
  let bestScore = -1;

  for (const name of workbook.SheetNames) {
    const rows = readSheetRows(workbook.Sheets[name]);
    const score = headerScore(rows);
    previews.push({ name, headerCount: Math.max(score, 0), rowCount: Math.max(rows.length - 1, 0) });
    if (score > bestScore) {
      bestScore = score;
      suggested = name;
    }
  }

  return { previews, suggested };
}

export function parseEmployeeSheet(buffer: Buffer, sheetName?: string): { employees: Employee[]; columns: string[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const name = sheetName && workbook.Sheets[sheetName] ? sheetName : listSheetPreviews(buffer).suggested;
  const rows = name ? readSheetRows(workbook.Sheets[name]) : [];

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
