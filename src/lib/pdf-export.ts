import type { Browser } from 'puppeteer-core';
import { stripPageMarkers } from './strip-page-markers';

// Génère le PDF entièrement côté serveur, avec des réglages fixes (marges, format,
// pas d'en-tête/pied de page) qu'on contrôle nous-mêmes — contrairement à l'impression
// depuis le navigateur de l'utilisateur, dont les réglages varient et sont imprévisibles.

// Le paquet complet @sparticuz/chromium dépasse la limite de taille de déploiement de
// Vercel. On utilise donc la version "-min", qui télécharge le binaire Chromium à la
// demande depuis les releases GitHub du projet plutôt que de l'inclure dans le build.
const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar';

async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium-min')).default;
    const puppeteer = await import('puppeteer-core');
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      headless: true,
    });
  }

  // En local, on utilise le Chromium complet embarqué par le paquet "puppeteer"
  // (dépendance de développement uniquement), avec les flags nécessaires dans cet
  // environnement d'exécution restreint.
  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });
  return browser as unknown as Browser;
}

export async function htmlToPdfBuffer(bodyHtml: string): Promise<Buffer> {
  const fullHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Carlito', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.15;
    margin: 0;
    padding: 0 16px;
    color: #171717;
  }
  p { margin: 0 0 6pt 0; }
  h2 { margin: 18pt 0 4pt 0; font-size: 1.3em; font-weight: 700; }
  ul, ol { margin: 0 0 6pt 0; padding-left: 1.5em; }
  table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
  table td, table th { border: 1px solid #d1d5db; padding: 6px 10px; vertical-align: top; }
  table th { background: #f3f4f6; font-weight: 600; }
  strong { font-weight: 700; }
</style>
</head>
<body>${stripPageMarkers(bodyHtml)}</body>
</html>`;

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'load' });
    await page.evaluateHandle('document.fonts.ready');

    const pdfUint8 = await page.pdf({
      format: 'A4',
      margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' },
      printBackground: true,
      displayHeaderFooter: false,
    });

    return Buffer.from(pdfUint8);
  } finally {
    await browser.close();
  }
}
