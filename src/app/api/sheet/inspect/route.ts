import { NextRequest, NextResponse } from 'next/server';
import { listSheetPreviews } from '@/lib/sheet';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { previews, suggested } = listSheetPreviews(buffer);
    return NextResponse.json({ sheets: previews, suggested });
  } catch {
    return NextResponse.json({ error: 'Impossible de lire ce fichier. Vérifie qu\'il s\'agit bien d\'un .xlsx ou .csv.' }, { status: 400 });
  }
}
