-- À exécuter dans le SQL Editor de Supabase (une seule fois)

alter table templates add column if not exists content text not null default '';
alter table templates alter column file_name drop not null;
