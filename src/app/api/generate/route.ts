import { NextRequest, NextResponse } from 'next/server';
import { getTemplate, loadEmployees } from '@/lib/storage';
import { mergeTemplateHtml } from '@/lib/merge';

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

  try {
    const template = await getTemplate(templateId);
    const html = mergeTemplateHtml(template.content, employee);
    const fileName = `CDI - ${employee.Nom || ''} ${employee.Prenom || ''} - ${template.name}`.replace(/\s+/g, ' ').trim();
    return NextResponse.json({ html, fileName, templateName: template.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
