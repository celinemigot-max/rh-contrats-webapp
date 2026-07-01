import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const TEMPLATES_DIR = path.join(DATA_DIR, 'templates');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');
const TEMPLATES_META_FILE = path.join(DATA_DIR, 'templates.json');

export type Employee = Record<string, string> & { _id: string };

export type TemplateMeta = {
  id: string;
  name: string;
  fileName: string;
  uploadedAt: string;
};

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

export function saveEmployees(employees: Employee[], columns: string[]) {
  ensureDirs();
  fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify({ employees, columns, updatedAt: new Date().toISOString() }, null, 2));
}

export function loadEmployees(): { employees: Employee[]; columns: string[]; updatedAt: string | null } {
  ensureDirs();
  if (!fs.existsSync(EMPLOYEES_FILE)) return { employees: [], columns: [], updatedAt: null };
  const raw = JSON.parse(fs.readFileSync(EMPLOYEES_FILE, 'utf-8'));
  return raw;
}

export function loadTemplatesMeta(): TemplateMeta[] {
  ensureDirs();
  if (!fs.existsSync(TEMPLATES_META_FILE)) return [];
  return JSON.parse(fs.readFileSync(TEMPLATES_META_FILE, 'utf-8'));
}

function saveTemplatesMeta(templates: TemplateMeta[]) {
  ensureDirs();
  fs.writeFileSync(TEMPLATES_META_FILE, JSON.stringify(templates, null, 2));
}

export function addTemplate(name: string, fileName: string, buffer: Buffer): TemplateMeta {
  ensureDirs();
  const id = fileName.replace(/[^a-zA-Z0-9_-]/g, '_') + '-' + Date.now();
  const storedFileName = `${id}.docx`;
  fs.writeFileSync(path.join(TEMPLATES_DIR, storedFileName), buffer);
  const meta: TemplateMeta = { id, name, fileName: storedFileName, uploadedAt: new Date().toISOString() };
  const templates = loadTemplatesMeta();
  templates.push(meta);
  saveTemplatesMeta(templates);
  return meta;
}

export function deleteTemplate(id: string) {
  const templates = loadTemplatesMeta();
  const target = templates.find(t => t.id === id);
  if (!target) return;
  const filePath = path.join(TEMPLATES_DIR, target.fileName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  saveTemplatesMeta(templates.filter(t => t.id !== id));
}

export function getTemplateBuffer(id: string): { buffer: Buffer; meta: TemplateMeta } {
  const templates = loadTemplatesMeta();
  const meta = templates.find(t => t.id === id);
  if (!meta) throw new Error('Modèle introuvable.');
  const buffer = fs.readFileSync(path.join(TEMPLATES_DIR, meta.fileName));
  return { buffer, meta };
}
