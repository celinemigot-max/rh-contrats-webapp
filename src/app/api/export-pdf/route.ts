import { NextRequest, NextResponse } from 'next/server';
import { htmlToPdfBuffer } from '@/lib/pdf-export';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const { html, fileName } = await request.json();
  if (!html) {
    return NextResponse.json({ error: 'Contenu manquant.' }, { status: 400 });
  }

  try {
    const buffer = await htmlToPdfBuffer(html);
    const safeName = `${fileName || 'contrat'}.pdf`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeName)}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue.';
    return NextResponse.json({ error: `Échec de l'export PDF : ${message}` }, { status: 500 });
  }
}
