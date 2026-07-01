import { supabase, TEMPLATES_BUCKET } from './supabase';

export type Employee = Record<string, string> & { _id: string };

export type TemplateMeta = {
  id: string;
  name: string;
  fileName: string;
  uploadedAt: string;
};

export async function saveEmployees(employees: Employee[], columns: string[]) {
  const { error } = await supabase
    .from('employee_data')
    .upsert({ id: 1, employees, columns, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Échec de l'enregistrement des collaborateurs : ${error.message}`);
}

export async function loadEmployees(): Promise<{ employees: Employee[]; columns: string[]; updatedAt: string | null }> {
  const { data, error } = await supabase
    .from('employee_data')
    .select('employees, columns, updated_at')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw new Error(`Échec de la lecture des collaborateurs : ${error.message}`);
  if (!data) return { employees: [], columns: [], updatedAt: null };
  return { employees: data.employees ?? [], columns: data.columns ?? [], updatedAt: data.updated_at ?? null };
}

export async function loadTemplatesMeta(): Promise<TemplateMeta[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('id, name, file_name, uploaded_at')
    .order('uploaded_at', { ascending: true });
  if (error) throw new Error(`Échec de la lecture des modèles : ${error.message}`);
  return (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    fileName: row.file_name,
    uploadedAt: row.uploaded_at,
  }));
}

export async function addTemplate(name: string, fileName: string, buffer: Buffer): Promise<TemplateMeta> {
  const id = `${fileName.replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}`;
  const storagePath = `${id}.docx`;

  const { error: uploadError } = await supabase.storage
    .from(TEMPLATES_BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  if (uploadError) throw new Error(`Échec de l'envoi du modèle : ${uploadError.message}`);

  const uploadedAt = new Date().toISOString();
  const { error: insertError } = await supabase
    .from('templates')
    .insert({ id, name, file_name: storagePath, uploaded_at: uploadedAt });
  if (insertError) throw new Error(`Échec de l'enregistrement du modèle : ${insertError.message}`);

  return { id, name, fileName: storagePath, uploadedAt };
}

export async function deleteTemplate(id: string) {
  const templates = await loadTemplatesMeta();
  const target = templates.find(t => t.id === id);
  if (!target) return;

  await supabase.storage.from(TEMPLATES_BUCKET).remove([target.fileName]);
  const { error } = await supabase.from('templates').delete().eq('id', id);
  if (error) throw new Error(`Échec de la suppression du modèle : ${error.message}`);
}

export async function getTemplateBuffer(id: string): Promise<{ buffer: Buffer; meta: TemplateMeta }> {
  const templates = await loadTemplatesMeta();
  const meta = templates.find(t => t.id === id);
  if (!meta) throw new Error('Modèle introuvable.');

  const { data, error } = await supabase.storage.from(TEMPLATES_BUCKET).download(meta.fileName);
  if (error || !data) throw new Error(`Échec du téléchargement du modèle : ${error?.message}`);

  const buffer = Buffer.from(await data.arrayBuffer());
  return { buffer, meta };
}
