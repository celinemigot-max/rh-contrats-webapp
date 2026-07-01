import { NextRequest, NextResponse } from 'next/server';
import { loadEmployees, getTemplateBuffer } from '@/lib/storage';
import { mergeDocx } from '@/lib/docx';

export async function POST(request: NextRequest) {
  const { employeeId, templateId } = await request.json();

  if (!employeeId || !templateId) {
    return NextResponse.json({ error: 'Salarié et modèle requis.' }, { status: 400 });
  }

  const { employees } = await loadEmployees();
  const employee = employees.find(e => e._id === String(employeeId));
  if (!employee) {
    return NextResponse.json({ error: 'Salarié introuvable.' }, { status: 404 });
  }

  let templateBuffer, meta;
  try {
    ({ buffer: templateBuffer, meta } = await getTemplateBuffer(templateId));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Modèle introuvable.';
    return NextResponse.json({ error: message }, { status: 404 });
  }

  try {
    const outputBuffer = mergeDocx(templateBuffer, employee);
    const fileName = `CDI - ${employee.Nom || ''} ${employee.Prenom || ''} - ${meta.name}.docx`.replace(/\s+/g, ' ').trim();

    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: `Échec de la génération : ${message}` }, { status: 500 });
  }
}
