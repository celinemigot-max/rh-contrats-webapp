import HTMLtoDOCX from 'html-to-docx';

export async function htmlToDocxBuffer(bodyHtml: string): Promise<Buffer> {
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${bodyHtml}</body></html>`;
  const buffer = await HTMLtoDOCX(fullHtml, null, {
    orientation: 'portrait',
    font: 'Calibri',
  });
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);
}
