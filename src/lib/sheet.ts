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

export function parseEmployeeSheet(buffer: Buffer): { employees: Employee[]; columns: string[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });

  if (rows.length === 0) return { employees: [], columns: [] };

  const headers = rows[0].map(h => h.toString().trim()).filter(h => h !== '');
  const dataRows = rows.slice(1).filter(row => row.some(cell => cell !== ''));

  const employees: Employee[] = dataRows.map((row, i) => {
    const employee: Employee = { _id: String(i + 1) };
    headers.forEach((header, colIndex) => {
      employee[normalizeKey(header)] = (row[colIndex] ?? '').toString();
    });
    employee.Civilite = computeCivilite(employee.Sexe);
    return employee;
  });

  return { employees, columns: headers };
}

export function employeeLabel(employee: Employee): string {
  const nom = employee.Nom || '';
  const prenom = employee.Prenom || '';
  const poste = employee.Poste || '';
  return [`${nom} ${prenom}`.trim(), poste].filter(Boolean).join(' — ') || `Salarié ${employee._id}`;
}
