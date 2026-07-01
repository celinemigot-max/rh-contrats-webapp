import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import type { Employee } from './storage';

export function mergeDocx(templateBuffer: Buffer, employee: Employee): Buffer {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
    nullGetter: () => '',
  });

  const today = new Date();
  const dateDuJour = [
    String(today.getDate()).padStart(2, '0'),
    String(today.getMonth() + 1).padStart(2, '0'),
    today.getFullYear(),
  ].join('/');

  doc.render({ ...employee, DateDuJour: employee.DateDuJour || dateDuJour });

  return doc.getZip().generate({ type: 'nodebuffer' });
}
