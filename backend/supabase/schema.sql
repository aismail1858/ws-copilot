-- =====================================================================
-- Konsolidiertes Gesamtschema (Fresh-DB + idempotent)
-- ---------------------------------------------------------------------
-- Vereint: Basis-Schema + RBAC (ADR-001) + app_models (Admin Settings).
-- Ersetzt die bisherigen Einzel-Migrationsdateien unter migrations/*.
--
-- Aufruf:
--   - auf frischer DB: einmalig ausführen
--   - nach Drop einzelner Tabellen: einfach erneut ausführen
--   - Re-Runs sind sicher (IF NOT EXISTS / CREATE OR REPLACE / ON CONFLICT)
--
-- Quellen (vorherige Migrationen, hier zusammengeführt):
--   - schema.sql                          (Basis)
--   - 20260703000001_add_role.sql         (users.role)
--   - 20260704000001_rbac_quellen.sql     (ADR-001)
--   - 20260704120001_app_models.sql       (Admin Settings)
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "public";
CREATE EXTENSION IF NOT EXISTS "vector"    WITH SCHEMA "public";

-- ---------------------------------------------------------------------
-- 1. roles (muss vor users stehen — FK users.role -> roles.key)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
    key        text primary key,
    label      text not null,
    tier       text not null check (tier in ('admin','team_lead','member')),
    is_system  boolean not null default false,
    created_at timestamptz not null default now()
);

INSERT INTO public.roles (key, label, tier, is_system) VALUES
    ('admin',     'Administrator', 'admin',     true),
    ('team_lead', 'Teamleiter',    'team_lead', true),
    ('member',    'Mitglied',      'member',    true)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2. users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id           uuid primary key default uuid_generate_v4(),
    email        text not null unique,
    password_hash text not null,
    display_name text not null default '',
    role         text not null default 'member'
                 check (role in ('admin','team_lead','member')),
    default_chat_model_id text,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

-- default_chat_model_id (Nutzer-Default-Chatmodell aus app_models) — idempotent.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS default_chat_model_id text;

-- FK users.role -> roles.key (idempotent anlegen)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_fk;
ALTER TABLE public.users
    ADD CONSTRAINT users_role_fk FOREIGN KEY (role)
    REFERENCES public.roles(key);

-- Legacy-Werte ('user'/'admin' aus alter Schema-Version) bereinigen
UPDATE public.users SET role = 'member' WHERE role = 'user';
UPDATE public.users SET role = 'member'
 WHERE role IS NULL OR role NOT IN (SELECT key FROM public.roles);

-- ---------------------------------------------------------------------
-- 3. projects
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id          uuid primary key default uuid_generate_v4(),
    user_id     uuid not null references public.users(id) on delete cascade,
    team_id     uuid,
    name        text not null,
    description text default '',
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- projects.team_id (Team-Zugehörigkeit; FK wird nach teams-Anlage gesetzt, OQ-ARCH-007 B)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS team_id uuid;

-- ---------------------------------------------------------------------
-- 4. project_settings
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_settings (
    id                  uuid primary key default uuid_generate_v4(),
    project_id          uuid not null references public.projects(id) on delete cascade,
    embedding_model     text not null default 'text-embedding-3-small',
    rag_strategy        text not null default 'simple',
    agent_type          text not null default 'simple',
    chunks_per_search   integer not null default 5,
    final_context_size  integer not null default 10,
    similarity_threshold real not null default 0.5,
    number_of_queries   integer not null default 1,
    reranking_enabled   boolean not null default false,
    reranking_model     text default '',
    vector_weight       real not null default 0.5,
    keyword_weight      real not null default 0.5,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. teams
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
    id         uuid primary key default uuid_generate_v4(),
    name       text not null,
    slug       text not null unique,
    lead_id    uuid not null references public.users(id) on delete restrict,
    created_at timestamptz not null default now()
);

-- projects.team_id -> teams(id) (nach teams-Anlage, da projects frueher definiert ist)
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_team_fk;
ALTER TABLE public.projects ADD CONSTRAINT projects_team_fk
    FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------
-- 6. team_members
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_members (
    team_id    uuid not null references public.teams(id) on delete cascade,
    user_id    uuid not null references public.users(id) on delete cascade,
    added_by   uuid references public.users(id) on delete set null,
    created_at timestamptz not null default now(),
    primary key (team_id, user_id)
);

-- ---------------------------------------------------------------------
-- 7. project_documents
--    project_id nullable (ADR-001 / OQ-RB-001: globale/team-Quellen)
--    owner_id, visibility, team_id (ADR-001)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_documents (
    id                uuid primary key default uuid_generate_v4(),
    project_id        uuid references public.projects(id) on delete cascade,
    user_id           uuid not null references public.users(id) on delete cascade,
    owner_id          uuid references public.users(id) on delete set null,
    visibility        text not null default 'private'
                      check (visibility in ('global','team','members','private')),
    team_id           uuid references public.teams(id) on delete set null,
    filename          text not null,
    s3_key            text not null,
    file_size         bigint not null default 0,
    file_type         text not null,
    processing_status text not null default 'pending'
                      check (processing_status in ('uploading','pending','queued','processing','partitioning','chunking','summarising','vectorization','completed','failed')),
    processing_details jsonb default '{}'::jsonb,
    task_id           text default '',
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now()
);

-- OQ-ARCH-004: Constraint auf die vom Code geschriebenen Werte bringen.
-- Idempotent auch bei Re-Run auf einer alt angelegten Tabelle (deren CHECK noch die
-- Legacy-Werte 'ready','error','uploaded','chunked','embedded' kannte).
-- Auto-Name eines Inline-CHECKs ist <table>_<column>_check.
ALTER TABLE public.project_documents DROP CONSTRAINT IF EXISTS project_documents_processing_status_check;
ALTER TABLE public.project_documents ADD CONSTRAINT project_documents_processing_status_check
    CHECK (processing_status IN ('uploading','pending','queued','processing','partitioning','chunking','summarising','vectorization','completed','failed'));

-- Bei Re-Run auf alter Tabelle: NOT NULL abstellen + neue Spalten ergänzen
ALTER TABLE public.project_documents ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE public.project_documents ADD COLUMN IF NOT EXISTS owner_id uuid references public.users(id) on delete set null;
ALTER TABLE public.project_documents ADD COLUMN IF NOT EXISTS visibility text not null default 'private'
    check (visibility in ('global','team','members','private'));
ALTER TABLE public.project_documents ADD COLUMN IF NOT EXISTS team_id uuid references public.teams(id) on delete set null;
UPDATE public.project_documents SET owner_id = user_id WHERE owner_id IS NULL;

-- ---------------------------------------------------------------------
-- 8. source_members (visibility = 'members')
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.source_members (
    document_id uuid not null references public.project_documents(id) on delete cascade,
    user_id     uuid not null references public.users(id) on delete cascade,
    granted_by  uuid references public.users(id) on delete set null,
    created_at  timestamptz not null default now(),
    primary key (document_id, user_id)
);

-- ---------------------------------------------------------------------
-- 9. document_chunks (pgvector)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id                uuid primary key default uuid_generate_v4(),
    document_id       uuid not null references public.project_documents(id) on delete cascade,
    chunk_index       integer not null,
    content           text not null,
    original_content  jsonb default '{}'::jsonb,
    type              text default '',
    page_number       integer default 0,
    char_count        integer default 0,
    embedding         vector(1536),
    created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 10. chats
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chats (
    id         uuid primary key default uuid_generate_v4(),
    user_id    uuid not null references public.users(id) on delete cascade,
    project_id uuid references public.projects(id) on delete set null,
    title      text not null default 'Neuer Chat',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 11. messages
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id         uuid primary key default uuid_generate_v4(),
    chat_id    uuid not null references public.chats(id) on delete cascade,
    user_id    uuid not null references public.users(id) on delete cascade,
    role       text not null check (role in ('user', 'assistant', 'system')),
    content    text not null,
    citations  jsonb default '[]'::jsonb,
    created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 12. app_models (Admin Settings — Requesty-Modellkatalog)
-- ---------------------------------------------------------------------
-- Unique über (model_id, purpose): ein Modell kann mehrere Zwecke haben
-- (z. B. gpt-4o als chat UND embeddings_llm, siehe services/llm.py).
CREATE TABLE IF NOT EXISTS public.app_models (
    id          uuid primary key default uuid_generate_v4(),
    label       text not null,
    model_id    text not null,
    purpose     text not null default 'chat'
                check (purpose in ('chat','mini','embeddings','embeddings_llm')),
    enabled     boolean not null default true,
    sort_order  integer not null default 0,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (model_id, purpose)
);

INSERT INTO public.app_models (label, model_id, purpose, enabled, sort_order)
VALUES
    ('GPT-4o',                  'gpt-4o',                  'chat',           true, 10),
    ('GPT-4o mini',             'gpt-4o-mini',             'mini',           true, 20),
    ('text-embedding-3-large',  'text-embedding-3-large',  'embeddings',     true, 30),
    ('GPT-4o (Embedding-LLM)',  'gpt-4o',                  'embeddings_llm', true, 40)
ON CONFLICT (model_id, purpose) DO NOTHING;

-- ---------------------------------------------------------------------
-- 13. Zentrale Zugriffsfunktion (ADR-001) — ersetzt Streu-Filter
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accessible_document_ids(p_user uuid)
RETURNS setof uuid
LANGUAGE sql STABLE AS $$
    SELECT d.id FROM public.project_documents d
    WHERE d.visibility = 'global'
       OR d.owner_id   = p_user
       OR d.user_id    = p_user
       OR (d.visibility = 'team'
           AND d.team_id IN (SELECT team_id FROM public.team_members WHERE user_id = p_user))
       OR (d.visibility = 'members'
           AND d.id IN (SELECT document_id FROM public.source_members WHERE user_id = p_user));
$$;

-- ---------------------------------------------------------------------
-- 14. Vektor- und Keyword-Suche (RAG-Retrieval)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.vector_search_document_chunks(
    query_embedding vector(1536),
    filter_document_ids uuid[],
    match_threshold double precision,
    chunks_per_search integer
) RETURNS TABLE (
    id uuid,
    document_id uuid,
    chunk_index integer,
    content text,
    type text,
    page_number integer,
    similarity double precision
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.chunk_index,
        dc.content,
        dc.type,
        dc.page_number,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM public.document_chunks dc
    WHERE dc.document_id = ANY(filter_document_ids)
      AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT chunks_per_search;
END;
$$;

CREATE OR REPLACE FUNCTION public.keyword_search_document_chunks(
    query_text text,
    filter_document_ids uuid[],
    chunks_per_search integer
) RETURNS TABLE (
    id uuid,
    document_id uuid,
    chunk_index integer,
    content text,
    type text,
    page_number integer,
    similarity double precision
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.chunk_index,
        dc.content,
        dc.type,
        dc.page_number,
        ts_rank(to_tsvector('german', dc.content), plainto_tsquery('german', query_text)) AS similarity
    FROM public.document_chunks dc
    WHERE dc.document_id = ANY(filter_document_ids)
      AND to_tsvector('german', dc.content) @@ plainto_tsquery('german', query_text)
    ORDER BY similarity DESC
    LIMIT chunks_per_search;
END;
$$;

-- ---------------------------------------------------------------------
-- 15. updated_at-Trigger für app_models
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_app_models_touch ON public.app_models;
CREATE TRIGGER trg_app_models_touch
    BEFORE UPDATE ON public.app_models
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 16. Indexe
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email             ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role              ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_projects_user           ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_project        ON public.project_settings(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_user          ON public.project_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project       ON public.project_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner         ON public.project_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_visibility    ON public.project_documents(visibility);
CREATE INDEX IF NOT EXISTS idx_documents_team          ON public.project_documents(team_id);
CREATE INDEX IF NOT EXISTS idx_source_members_user     ON public.source_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user       ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document         ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chats_user              ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_project           ON public.chats(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat           ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_user           ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_app_models_purpose      ON public.app_models(purpose);
CREATE INDEX IF NOT EXISTS idx_app_models_enabled      ON public.app_models(enabled);

COMMIT;
