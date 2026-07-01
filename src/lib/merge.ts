import type { Employee } from './storage';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const VARIABLE_SPAN = /<span[^>]*data-variable="([^"]+)"[^>]*>(.*?)<\/span>/g;

function todayFormatted(): string {
  const today = new Date();
  return [
    String(today.getDate()).padStart(2, '0'),
    String(today.getMonth() + 1).padStart(2, '0'),
    today.getFullYear(),
  ].join('/');
}

export function mergeTemplateHtml(content: string, employee: Employee): string {
  const withComputed: Employee = { ...employee, DateDuJour: employee.DateDuJour || todayFormatted() };

  return content.replace(VARIABLE_SPAN, (match, tag, label) => {
    const value = withComputed[tag];
    if (value === undefined) {
      return `<span style="color:#b91c1c;background:#fef2f2;border-radius:4px;padding:1px 6px;">⚠ variable inconnue : ${label}</span>`;
    }
    return value === '' ? '' : escapeHtml(value);
  });
}

export function extractVariableTags(content: string): string[] {
  const tags = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(VARIABLE_SPAN);
  while ((m = re.exec(content)) !== null) {
    tags.add(m[1]);
  }
  return Array.from(tags);
}
