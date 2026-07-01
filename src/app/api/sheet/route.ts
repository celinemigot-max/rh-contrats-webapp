import { NextRequest, NextResponse } from 'next/server';
import { parseEmployeeSheet } from '@/lib/sheet';
import { saveEmployees, loadEmployees } from '@/lib/storage';

export async function GET() {
  const { employees, columns, updatedAt } = await loadEmployees();
  return NextResponse.json({ employees, columns, updatedAt });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { employees, columns } = parseEmployeeSheet(buffer);
    if (employees.length === 0) {
      return NextResponse.json({ error: 'Aucune ligne de salarié trouvée dans ce fichier.' }, { status: 400 });
    }
    await saveEmployees(employees, columns);
    return NextResponse.json({ count: employees.length, columns });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossible de lire ce fichier. Vérifie qu\'il s\'agit bien d\'un .xlsx ou .csv.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
