import * as XLSX from 'xlsx';
import type { Employee } from './storage';

const MAX_HEADER_SCAN = 5;

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

function countNonEmpty(row: string[]): number {
  return row.filter(cell => cell.toString().trim() !== '').length;
}

// Cherche, parmi les premières lignes, celle qui ressemble le plus à une ligne
// d'en-têtes (le plus de cellules non vides) — utile si une ligne de titre/bannière
// précède les vrais en-têtes.
function findHeaderRowIndex(rows: string[][]): number {
  let bestIndex = 0;
  let bestScore = -1;
  for (let i = 0; i < Math.min(rows.length, MAX_HEADER_SCAN); i++) {
    const score = countNonEmpty(rows[i]);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

export type SheetPreview = { name: string; headerCount: number; rowCount: number; headerRowIndex: number };

// Liste les onglets du fichier avec un aperçu, pour laisser l'utilisateur choisir le bon.
export function listSheetPreviews(buffer: Buffer): { previews: SheetPreview[]; suggested: string } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const previews: SheetPreview[] = [];
  let suggested = workbook.SheetNames[0] ?? '';
  let bestScore = -1;

  for (const name of workbook.SheetNames) {
    const rows = readSheetRows(workbook.Sheets[name]);
    const headerRowIndex = findHeaderRowIndex(rows);
    const score = rows.length > headerRowIndex + 1 ? countNonEmpty(rows[headerRowIndex]) : -1;
    previews.push({
      name,
      headerCount: Math.max(score, 0),
      rowCount: Math.max(rows.length - headerRowIndex - 1, 0),
      headerRowIndex,
    });
    if (score > bestScore) {
      bestScore = score;
      suggested = name;
    }
  }

  return { previews, suggested };
}

export function parseEmployeeSheet(buffer: Buffer, sheetName?: string): { employees: Employee[]; columns: string[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const { previews, suggested } = listSheetPreviews(buffer);
  const name = sheetName && workbook.Sheets[sheetName] ? sheetName : suggested;
  const preview = previews.find(p => p.name === name);
  const allRows = name ? readSheetRows(workbook.Sheets[name]) : [];
  const rows = preview ? allRows.slice(preview.headerRowIndex) : allRows;

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
