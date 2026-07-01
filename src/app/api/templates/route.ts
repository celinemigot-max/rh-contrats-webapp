import { NextRequest, NextResponse } from 'next/server';
import { addTemplate, loadTemplatesMeta } from '@/lib/storage';

export async function GET() {
  return NextResponse.json({ templates: loadTemplatesMeta() });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');
  const name = (formData.get('name') as string) || (file instanceof File ? file.name.replace(/\.docx$/i, '') : 'Modèle');

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
  }

  const fileName = file instanceof File ? file.name : 'modele.docx';
  if (!fileName.toLowerCase().endsWith('.docx')) {
    return NextResponse.json({ error: 'Le modèle doit être un fichier .docx (Word).' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const meta = addTemplate(name, fileName, buffer);
  return NextResponse.json({ template: meta });
}
