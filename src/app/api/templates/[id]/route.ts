import { NextRequest, NextResponse } from 'next/server';
import { deleteTemplate, getTemplate, updateTemplate } from '@/lib/storage';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json({ template: await getTemplate(id) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Modèle introuvable.';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, content } = await request.json();
  try {
    const template = await updateTemplate(id, name, content ?? '');
    return NextResponse.json({ template });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteTemplate(id);
  return NextResponse.json({ ok: true });
}
