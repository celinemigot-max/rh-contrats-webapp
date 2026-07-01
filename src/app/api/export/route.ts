import { NextRequest, NextResponse } from 'next/server';
import { htmlToDocxBuffer } from '@/lib/docx-export';

export async function POST(request: NextRequest) {
  const { html, fileName } = await request.json();
  if (!html) {
    return NextResponse.json({ error: 'Contenu manquant.' }, { status: 400 });
  }

  try {
    const buffer = await htmlToDocxBuffer(html);
    const safeName = `${fileName || 'contrat'}.docx`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(safeName)}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue.';
    return NextResponse.json({ error: `Échec de l'export : ${message}` }, { status: 500 });
  }
}
