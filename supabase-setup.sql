-- À exécuter une fois dans l'éditeur SQL de ton projet Supabase (Database > SQL Editor)

create table if not exists employee_data (
  id integer primary key default 1,
  employees jsonb not null default '[]',
  columns jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create table if not exists templates (
  id text primary key,
  name text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now()
);
