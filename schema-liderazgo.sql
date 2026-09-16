-- =====================================================================
-- Autoevaluación de liderazgo — esquema Supabase
-- Pegar completo en el SQL Editor de Supabase y ejecutar.
-- Todo el acceso pasa por el servidor (Vercel) con la service_role key.
-- Ningún rol público toca estas tablas: ver bloque de RLS al final.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Ciclos: cada ronda de evaluación (ej. "Liderazgo ICP — Otoño 2026")
-- ---------------------------------------------------------------------
create table public.ciclos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  descripcion text,
  abierto     boolean not null default true,
  creado_en   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Invitaciones: un token por persona, de un solo uso
-- Se guarda SOLO el hash. El token en claro nunca toca la base de datos.
-- ---------------------------------------------------------------------
create table public.invitaciones (
  id           uuid primary key default gen_random_uuid(),
  ciclo_id     uuid not null references public.ciclos(id) on delete cascade,
  token_hash   text not null unique,
  nombre       text,
  email        text,
  ministerio   text,
  idioma       text not null default 'es' check (idioma in ('es','en')),
  creado_en    timestamptz not null default now(),
  expira_en    timestamptz not null default (now() + interval '14 days'),
  iniciado_en  timestamptz,          -- se abrió el enlace
  consumido_en timestamptz,          -- se enviaron las respuestas: ya no sirve
  intentos     smallint not null default 0
);

create index invitaciones_ciclo_idx on public.invitaciones (ciclo_id);
create index invitaciones_pendientes_idx
  on public.invitaciones (ciclo_id) where consumido_en is null;

-- ---------------------------------------------------------------------
-- Evaluaciones: un resultado por invitación consumida
-- ---------------------------------------------------------------------
create table public.evaluaciones (
  id             uuid primary key default gen_random_uuid(),
  invitacion_id  uuid not null unique references public.invitaciones(id) on delete cascade,
  ciclo_id       uuid not null references public.ciclos(id) on delete cascade,
  idioma         text not null check (idioma in ('es','en')),
  pct_directivo   smallint not null check (pct_directivo   between 0 and 100),
  pct_visionario  smallint not null check (pct_visionario  between 0 and 100),
  pct_afiliativo  smallint not null check (pct_afiliativo  between 0 and 100),
  pct_democratico smallint not null check (pct_democratico between 0 and 100),
  pct_ejemplar    smallint not null check (pct_ejemplar    between 0 and 100),
  pct_formativo   smallint not null check (pct_formativo   between 0 and 100),
  estilo_dominante text not null,
  estilos_activos  smallint not null,
  completado_en    timestamptz not null default now()
);

create index evaluaciones_ciclo_idx on public.evaluaciones (ciclo_id);

-- ---------------------------------------------------------------------
-- Respuestas: el detalle ítem por ítem (útil para análisis posterior)
-- ---------------------------------------------------------------------
create table public.respuestas (
  evaluacion_id uuid not null references public.evaluaciones(id) on delete cascade,
  item_num      smallint not null check (item_num between 1 and 30),
  estilo        text not null,
  valor         smallint not null check (valor between 1 and 5),
  primary key (evaluacion_id, item_num)
);

-- =====================================================================
-- CONSUMO ATÓMICO DEL TOKEN
-- El UPDATE ... WHERE consumido_en IS NULL es la pieza clave: si llegan
-- dos peticiones a la vez, solo una devuelve fila. La otra ve cero filas
-- y se rechaza. No hay ventana entre "verificar" y "marcar".
-- =====================================================================

-- Paso 1: abrir el enlace. NO consume todavía, solo autoriza la sesión.
create or replace function public.iniciar_invitacion(p_token_hash text)
returns table (
  invitacion_id uuid,
  ciclo_id      uuid,
  nombre        text,
  idioma        text
)
language sql
security definer
set search_path = public
as $$
  update public.invitaciones i
     set iniciado_en = coalesce(i.iniciado_en, now()),
         intentos     = i.intentos + 1
   where i.token_hash   = p_token_hash
     and i.consumido_en is null
     and i.expira_en    > now()
     and exists (select 1 from public.ciclos c
                  where c.id = i.ciclo_id and c.abierto)
  returning i.id, i.ciclo_id, i.nombre, i.idioma;
$$;

-- Paso 2: enviar respuestas. Aquí sí se quema el token, en la misma
-- transacción que crea la evaluación. O pasa todo, o no pasa nada.
create or replace function public.consumir_invitacion(
  p_invitacion_id uuid,
  p_idioma        text,
  p_pcts          jsonb,   -- {"directivo":72,"visionario":88,...}
  p_dominante     text,
  p_activos       smallint,
  p_respuestas    jsonb    -- [{"n":1,"estilo":"directivo","v":4}, ...]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ciclo uuid;
  v_eval  uuid;
begin
  -- quema el token; cero filas = ya usado, vencido o ciclo cerrado
  update public.invitaciones
     set consumido_en = now()
   where id           = p_invitacion_id
     and consumido_en is null
     and expira_en    > now()
  returning ciclo_id into v_ciclo;

  if v_ciclo is null then
    raise exception 'invitacion_no_valida' using errcode = 'P0001';
  end if;

  insert into public.evaluaciones (
    invitacion_id, ciclo_id, idioma,
    pct_directivo, pct_visionario, pct_afiliativo,
    pct_democratico, pct_ejemplar, pct_formativo,
    estilo_dominante, estilos_activos
  ) values (
    p_invitacion_id, v_ciclo, p_idioma,
    (p_pcts->>'directivo')::smallint,
    (p_pcts->>'visionario')::smallint,
    (p_pcts->>'afiliativo')::smallint,
    (p_pcts->>'democratico')::smallint,
    (p_pcts->>'ejemplar')::smallint,
    (p_pcts->>'formativo')::smallint,
    p_dominante, p_activos
  )
  returning id into v_eval;

  insert into public.respuestas (evaluacion_id, item_num, estilo, valor)
  select v_eval,
         (r->>'n')::smallint,
         r->>'estilo',
         (r->>'v')::smallint
    from jsonb_array_elements(p_respuestas) r;

  return v_eval;
end;
$$;

-- =====================================================================
-- VISTA DE CONSOLIDADO POR MINISTERIO
-- Sin nombres: promedios por grupo. Para conversación de equipo.
-- =====================================================================
create or replace view public.consolidado_ministerio as
select
  e.ciclo_id,
  coalesce(i.ministerio, 'Sin asignar')  as ministerio,
  count(*)                               as participantes,
  round(avg(e.pct_directivo))            as directivo,
  round(avg(e.pct_visionario))           as visionario,
  round(avg(e.pct_afiliativo))           as afiliativo,
  round(avg(e.pct_democratico))          as democratico,
  round(avg(e.pct_ejemplar))             as ejemplar,
  round(avg(e.pct_formativo))            as formativo,
  round(avg(e.estilos_activos), 1)       as promedio_estilos_activos
from public.evaluaciones e
join public.invitaciones i on i.id = e.invitacion_id
group by e.ciclo_id, coalesce(i.ministerio, 'Sin asignar')
having count(*) >= 3;   -- umbral de anonimato: grupos de 1 o 2 no se muestran

-- =====================================================================
-- RLS: cerrar todo al público
-- Con RLS activo y CERO políticas, anon y authenticated no leen ni
-- escriben nada. La service_role key (solo en el servidor de Vercel)
-- ignora RLS. Si mañana agregas login para el panel, ahí añades
-- políticas; por ahora, nada.
-- =====================================================================
alter table public.ciclos        enable row level security;
alter table public.invitaciones  enable row level security;
alter table public.evaluaciones  enable row level security;
alter table public.respuestas    enable row level security;

revoke all on public.ciclos       from anon, authenticated;
revoke all on public.invitaciones from anon, authenticated;
revoke all on public.evaluaciones from anon, authenticated;
revoke all on public.respuestas   from anon, authenticated;
revoke all on public.consolidado_ministerio from anon, authenticated;

-- Las funciones son SECURITY DEFINER: tampoco se exponen al cliente.
revoke execute on function public.iniciar_invitacion(text)  from anon, authenticated;
revoke execute on function public.consumir_invitacion(uuid, text, jsonb, text, smallint, jsonb) from anon, authenticated;

-- =====================================================================
-- Enlace abierto por ciclo (opcional)
-- Un solo enlace compartible que el admin activa y desactiva desde el
-- panel. Cada visita crea su propia invitación anónima, así el resto
-- del flujo (sesión de 2 h, envío, quema) es exactamente el mismo.
--
-- El token se guarda EN CLARO, a diferencia de los personales: es un
-- enlace pensado para compartirse y el admin necesita volver a verlo.
-- Si la base se filtra, lo peor que pasa es que alguien conteste una
-- autoevaluación; el admin lo desactiva y listo.
--
-- Si ya corriste el esquema antes, ejecuta SOLO este bloque.
-- =====================================================================
alter table public.ciclos
  add column if not exists enlace_publico text unique,
  add column if not exists enlace_activo  boolean not null default false;

create or replace function public.abrir_enlace_publico(p_token text)
returns table (invitacion_id uuid, idioma text)
language sql
security definer
set search_path = public
as $$
  -- token_hash aleatorio: esta invitación no se puede reabrir por
  -- enlace, solo vive en la cookie de sesión de quien la creó.
  -- gen_random_uuid() es nativo; pgcrypto en Supabase vive en el
  -- esquema extensions y con search_path = public no se encuentra.
  insert into public.invitaciones (ciclo_id, token_hash, idioma, iniciado_en, intentos)
  select c.id, replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'es', now(), 1
    from public.ciclos c
   where c.enlace_publico = p_token
     and c.enlace_activo
     and c.abierto
  returning id, idioma;
$$;

revoke execute on function public.abrir_enlace_publico(text) from anon, authenticated;
