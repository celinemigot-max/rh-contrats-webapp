import type { Browser } from 'puppeteer-core';
import { readFileSync } from 'fs';
import { join } from 'path';
import { stripPageMarkers } from './strip-page-markers';

// Polices intégrées directement en base64 (mêmes fichiers que ceux utilisés par l'éditeur
// via next/font/google) : on a constaté que le lien Google Fonts chargé par le navigateur
// au moment de générer le PDF échouait silencieusement (mécanisme de chargement de police
// non fiable dans ce contexte), et que le texte basculait alors sur une police de repli
// plus large pour les caractères accentués, décalant tous les retours à la ligne par
// rapport à l'éditeur. Charger la police depuis le disque élimine toute dépendance réseau.
function loadFontBase64(fileName: string): string {
  return readFileSync(join(process.cwd(), 'src/fonts', fileName)).toString('base64');
}

const CARLITO_REGULAR = loadFontBase64('Carlito-Regular.woff2');
const CARLITO_BOLD = loadFontBase64('Carlito-Bold.woff2');
const CARLITO_ITALIC = loadFontBase64('Carlito-Italic.woff2');
const CARLITO_BOLD_ITALIC = loadFontBase64('Carlito-BoldItalic.woff2');

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
<style>
  @font-face {
    font-family: 'Carlito';
    font-style: normal;
    font-weight: 400;
    src: url(data:font/woff2;base64,${CARLITO_REGULAR}) format('woff2');
  }
  @font-face {
    font-family: 'Carlito';
    font-style: normal;
    font-weight: 700;
    src: url(data:font/woff2;base64,${CARLITO_BOLD}) format('woff2');
  }
  @font-face {
    font-family: 'Carlito';
    font-style: italic;
    font-weight: 400;
    src: url(data:font/woff2;base64,${CARLITO_ITALIC}) format('woff2');
  }
  @font-face {
    font-family: 'Carlito';
    font-style: italic;
    font-weight: 700;
    src: url(data:font/woff2;base64,${CARLITO_BOLD_ITALIC}) format('woff2');
  }
  * { box-sizing: border-box; }
  @page {
    size: A4;
    margin: 2.5cm;
  }
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
    // document.fonts.ready ne suffit pas seul : il n'attend que les polices déjà en
    // cours de chargement. Si rien n'a encore déclenché le chargement de Carlito à ce
    // stade, l'attente se termine immédiatement sans l'avoir téléchargée, et le texte
    // est imprimé avec la police de repli (Arial) — plus large, ce qui décale tous les
    // retours à la ligne par rapport à l'éditeur. On force explicitement le chargement
    // de chaque variante utilisée avant d'imprimer.
    await page.evaluate(async () => {
      await Promise.all([
        document.fonts.load('11pt Carlito'),
        document.fonts.load('bold 11pt Carlito'),
        document.fonts.load('italic 11pt Carlito'),
        document.fonts.load('italic bold 11pt Carlito'),
      ]);
      await document.fonts.ready;
    });

    const pdfUint8 = await page.pdf({
      // La taille et les marges viennent de la règle CSS @page ci-dessus : sans
      // preferCSSPageSize, Puppeteer met en page le contenu à la largeur de la fenêtre
      // (800px par défaut) puis le redécoupe en pages A4, ce qui ne correspond PAS à la
      // largeur réellement disponible pour le texte et fausse tous les retours à la ligne.
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
    });

    return Buffer.from(pdfUint8);
  } finally {
    await browser.close();
  }
}
