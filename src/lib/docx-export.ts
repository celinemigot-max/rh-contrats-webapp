import HTMLtoDOCX from 'html-to-docx';
import { stripPageMarkers } from './strip-page-markers';

export async function htmlToDocxBuffer(bodyHtml: string): Promise<Buffer> {
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${stripPageMarkers(bodyHtml)}</body></html>`;
  const buffer = await HTMLtoDOCX(fullHtml, null, {
    orientation: 'portrait',
    font: 'Calibri',
    // Marges du modèle Word de référence (2,5 cm de chaque côté = 1418 twip).
    margins: { top: 1418, right: 1418, bottom: 1418, left: 1418 },
  });
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as ArrayBuffer);
}
