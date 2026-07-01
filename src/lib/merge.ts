import type { Employee } from './storage';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const VARIABLE_SPAN = /<span[^>]*data-variable="([^"]+)"[^>]*>.*?<\/span>/g;

export function mergeTemplateHtml(content: string, employee: Employee): string {
  return content.replace(VARIABLE_SPAN, (match, tag) => {
    const value = employee[tag];
    return value !== undefined && value !== '' ? escapeHtml(value) : '';
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
