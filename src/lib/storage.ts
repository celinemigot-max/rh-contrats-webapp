import { randomUUID } from 'crypto';
import { supabase } from './supabase';

export type Employee = Record<string, string> & { _id: string };

export type TemplateSummary = {
  id: string;
  name: string;
  updatedAt: string;
};

export type Template = TemplateSummary & {
  content: string;
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

export async function listTemplates(): Promise<TemplateSummary[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('id, name, uploaded_at')
    .order('uploaded_at', { ascending: true });
  if (error) throw new Error(`Échec de la lecture des modèles : ${error.message}`);
  return (data ?? []).map(row => ({ id: row.id, name: row.name, updatedAt: row.uploaded_at }));
}

export async function getTemplate(id: string): Promise<Template> {
  const { data, error } = await supabase
    .from('templates')
    .select('id, name, content, uploaded_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Échec de la lecture du modèle : ${error.message}`);
  if (!data) throw new Error('Modèle introuvable.');
  return { id: data.id, name: data.name, content: data.content ?? '', updatedAt: data.uploaded_at };
}

export async function createTemplate(name: string, content: string): Promise<Template> {
  const id = randomUUID();
  const updatedAt = new Date().toISOString();
  const { error } = await supabase
    .from('templates')
    .insert({ id, name, content, uploaded_at: updatedAt });
  if (error) throw new Error(`Échec de la création du modèle : ${error.message}`);
  return { id, name, content, updatedAt };
}

export async function updateTemplate(id: string, name: string, content: string): Promise<Template> {
  const updatedAt = new Date().toISOString();
  const { error } = await supabase
    .from('templates')
    .update({ name, content, uploaded_at: updatedAt })
    .eq('id', id);
  if (error) throw new Error(`Échec de la mise à jour du modèle : ${error.message}`);
  return { id, name, content, updatedAt };
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase.from('templates').delete().eq('id', id);
  if (error) throw new Error(`Échec de la suppression du modèle : ${error.message}`);
}
