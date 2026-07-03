// Les repères de page (voir page-marker-extension.ts) ne servent qu'à l'affichage à
// l'écran dans l'éditeur : ils ne doivent jamais apparaître dans le Word ou le PDF final.
export function stripPageMarkers(html: string): string {
  return html.replace(/<div[^>]*data-page-marker="true"[^>]*><\/div>/g, '');
}
