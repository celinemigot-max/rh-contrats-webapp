import { NextRequest, NextResponse } from 'next/server';
import { createTemplate, listTemplates } from '@/lib/storage';

export async function GET() {
  try {
    return NextResponse.json({ templates: await listTemplates() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { name, content } = await request.json();
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'Nom du modèle requis.' }, { status: 400 });
  }
  try {
    const template = await createTemplate(name, content || '');
    return NextResponse.json({ template });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
