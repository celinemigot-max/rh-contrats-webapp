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

const SCIENTIFIC_NOTATION = /^-?\d(\.\d+)?e[+-]\d+$/i;

// Reconnaît un montant affiché à l'anglo-saxonne (ex. "€39,000.00" ou "-€1,234.5")
// et le reformate à la française : "39 000,00 €".
const ANGLO_CURRENCY = /^(-?)€\s?([\d,]+(?:\.\d+)?)$/;

function frenchifyCurrency(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(ANGLO_CURRENCY);
  if (!match) return text;

  const [, sign, amount] = match;
  const [intPart, decPart] = amount.replace(/,/g, '').split('.');
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const decimals = decPart ? `,${decPart}` : '';
  return `${sign}${withSpaces}${decimals} €`;
}

// Corrige les cellules numériques affichées en notation scientifique (ex. "2.99128E+14"
// pour un numéro de sécurité sociale stocké comme nombre plutôt que texte dans le tableur) :
// on reconstitue le nombre entier complet à partir de la valeur brute plutôt que
// d'utiliser le texte formaté tronqué.
function cellToText(cell: XLSX.CellObject | undefined): string {
  if (!cell) return '';
  const formatted = cell.w !== undefined ? String(cell.w) : '';
  if (cell.t === 'n' && typeof cell.v === 'number' && SCIENTIFIC_NOTATION.test(formatted.trim())) {
    if (Number.isSafeInteger(cell.v)) return String(cell.v);
  }
  return frenchifyCurrency(formatted);
}

function readSheetRows(sheet: XLSX.WorkSheet): string[][] {
  const ref = sheet['!ref'];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  const rows: string[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      row.push(cellToText(sheet[cellRef]));
    }
    rows.push(row);
  }
  return rows;
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
