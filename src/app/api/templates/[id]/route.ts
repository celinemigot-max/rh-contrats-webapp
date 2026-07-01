import { NextRequest, NextResponse } from 'next/server';
import { deleteTemplate } from '@/lib/storage';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteTemplate(id);
  return NextResponse.json({ ok: true });
}
