-- ============================================================
-- ORION INTELLIGENCE — New Supabase Project Setup
-- Project: megqdnqtghhnymyoyelr
-- Run this ENTIRE file in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── TENANTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenants (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(200) NOT NULL DEFAULT 'My Workspace',
  slug       VARCHAR(63)  NOT NULL DEFAULT 'default',
  status     VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── PROFILES (extends auth.users) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  avatar_url TEXT,
  email      TEXT,
  role       TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('admin','analyst','viewer')),
  tenant_id  UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Auto-create profile + default tenant on signup ──────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _tenant_id UUID;
  _full_name TEXT;
BEGIN
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Create a personal tenant for this user
  INSERT INTO public.tenants (name, slug, status)
  VALUES (
    _full_name || '''s Workspace',
    lower(regexp_replace(split_part(NEW.email,'@',1), '[^a-z0-9]', '-', 'g')) || '-' || substr(NEW.id::text, 1, 6),
    'ACTIVE'
  )
  RETURNING id INTO _tenant_id;

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, role, tenant_id)
  VALUES (NEW.id, NEW.email, _full_name, 'admin', _tenant_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── OBJECT TYPES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.object_types (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  api_name    VARCHAR(100) NOT NULL DEFAULT 'item',
  description TEXT,
  icon        VARCHAR(100) DEFAULT 'box',
  color       VARCHAR(7)   DEFAULT '#6366f1',
  is_system   BOOLEAN      NOT NULL DEFAULT false,
  version     INTEGER      NOT NULL DEFAULT 1,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, api_name)
);

-- ── PROPERTY DEFINITIONS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.property_definitions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  object_type_id  UUID NOT NULL REFERENCES public.object_types(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  api_name        VARCHAR(100) NOT NULL DEFAULT 'field',
  data_type       VARCHAR(50)  NOT NULL DEFAULT 'string',
  is_required     BOOLEAN      NOT NULL DEFAULT false,
  is_unique       BOOLEAN      NOT NULL DEFAULT false,
  is_searchable   BOOLEAN      NOT NULL DEFAULT true,
  is_filterable   BOOLEAN      NOT NULL DEFAULT true,
  description     TEXT,
  config          JSONB        NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── LINK TYPES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.link_types (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name                  VARCHAR(200) NOT NULL,
  api_name              VARCHAR(100) NOT NULL DEFAULT 'link',
  description           TEXT,
  source_object_type_id UUID NOT NULL REFERENCES public.object_types(id) ON DELETE CASCADE,
  target_object_type_id UUID NOT NULL REFERENCES public.object_types(id) ON DELETE CASCADE,
  cardinality           VARCHAR(30)  NOT NULL DEFAULT 'many_to_many',
  is_directed           BOOLEAN      NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── KNOWLEDGE OBJECTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_objects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID         NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  object_type_id  UUID         NOT NULL REFERENCES public.object_types(id) ON DELETE CASCADE,
  primary_label   TEXT         NOT NULL,
  properties      JSONB        NOT NULL DEFAULT '{}',
  confidence      NUMERIC(5,2) NOT NULL DEFAULT 100.0 CHECK (confidence BETWEEN 0 AND 100),
  status          TEXT         NOT NULL DEFAULT 'Active' CHECK (lower(status) IN ('active','draft','review','archived')),
  created_by      UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ko_tenant_type ON public.knowledge_objects(tenant_id, object_type_id);
CREATE INDEX IF NOT EXISTS idx_ko_label_trgm ON public.knowledge_objects USING GIN(primary_label gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ko_props_gin  ON public.knowledge_objects USING GIN(properties);

-- ── KNOWLEDGE LINKS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_links (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID         NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  link_type_id     UUID         NOT NULL REFERENCES public.link_types(id) ON DELETE CASCADE,
  source_object_id UUID         NOT NULL REFERENCES public.knowledge_objects(id) ON DELETE CASCADE,
  target_object_id UUID         NOT NULL REFERENCES public.knowledge_objects(id) ON DELETE CASCADE,
  properties       JSONB        NOT NULL DEFAULT '{}',
  confidence       NUMERIC(5,2) NOT NULL DEFAULT 100.0 CHECK (confidence BETWEEN 0 AND 100),
  created_by       UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kl_source ON public.knowledge_links(source_object_id);
CREATE INDEX IF NOT EXISTS idx_kl_target ON public.knowledge_links(target_object_id);

-- ── BOARDS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.boards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'Active' CHECK (lower(status) IN ('active','archived','review','draft')),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── APPLICATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  slug        VARCHAR(100),
  icon        VARCHAR(100) DEFAULT 'box',
  status      VARCHAR(32)  NOT NULL DEFAULT 'draft',
  config      JSONB        NOT NULL DEFAULT '{}',
  owner_id    UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ── INGESTION PIPELINES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ingestion_pipelines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT 'Untitled',
  source_type     TEXT NOT NULL DEFAULT 'csv',
  source_config   JSONB NOT NULL DEFAULT '{}',
  mapping_config  JSONB NOT NULL DEFAULT '{}',
  schedule        TEXT,
  status          TEXT NOT NULL DEFAULT 'Paused',
  total_records   BIGINT DEFAULT 0,
  last_run_at     TIMESTAMPTZ,
  last_run_records BIGINT DEFAULT 0,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── AI THREADS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_threads (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT 'New Investigation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── AI MESSAGES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  thread_id  UUID NOT NULL REFERENCES public.ai_threads(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','assistant','system')),
  content    TEXT NOT NULL DEFAULT '',
  sources    JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── ENTITY RESOLUTION RESULTS (ML model output) ──────────────
CREATE TABLE IF NOT EXISTS public.er_matches (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  record_a_id      TEXT NOT NULL,
  record_b_id      TEXT NOT NULL,
  match_score      NUMERIC(5,4) NOT NULL DEFAULT 0.0,
  is_match         BOOLEAN NOT NULL DEFAULT false,
  model_version    TEXT DEFAULT 'orion-er-v1',
  features         JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_er_matches_tenant ON public.er_matches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_er_matches_score ON public.er_matches(match_score DESC);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.object_types        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_types          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_objects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_links     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_threads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.er_matches          ENABLE ROW LEVEL SECURITY;

-- profiles: anyone can read their own; can update their own
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Helper: get the current user's tenant_id
CREATE OR REPLACE FUNCTION public.my_tenant_id() RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- tenants table: users can only see their own tenant (matched by id)
DROP POLICY IF EXISTS "tenants_select_own" ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert_own" ON public.tenants;
DROP POLICY IF EXISTS "tenants_update_own" ON public.tenants;
CREATE POLICY "tenants_select_own" ON public.tenants
  FOR SELECT USING (id = public.my_tenant_id());
CREATE POLICY "tenants_insert_own" ON public.tenants
  FOR INSERT WITH CHECK (id = public.my_tenant_id());
CREATE POLICY "tenants_update_own" ON public.tenants
  FOR UPDATE USING (id = public.my_tenant_id());

-- All other tables: scoped by their tenant_id column
-- (explicit statements with DROP POLICY IF EXISTS so it can be re-run safely)
DROP POLICY IF EXISTS "object_types_tenant_isolation" ON public.object_types;
DROP POLICY IF EXISTS "object_types_tenant_insert"    ON public.object_types;
CREATE POLICY "object_types_tenant_isolation" ON public.object_types USING (tenant_id = public.my_tenant_id());
CREATE POLICY "object_types_tenant_insert"    ON public.object_types FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "property_definitions_tenant_isolation" ON public.property_definitions;
DROP POLICY IF EXISTS "property_definitions_tenant_insert"    ON public.property_definitions;
CREATE POLICY "property_definitions_tenant_isolation" ON public.property_definitions USING (tenant_id = public.my_tenant_id());
CREATE POLICY "property_definitions_tenant_insert"    ON public.property_definitions FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "link_types_tenant_isolation" ON public.link_types;
DROP POLICY IF EXISTS "link_types_tenant_insert"    ON public.link_types;
CREATE POLICY "link_types_tenant_isolation" ON public.link_types USING (tenant_id = public.my_tenant_id());
CREATE POLICY "link_types_tenant_insert"    ON public.link_types FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "knowledge_objects_tenant_isolation" ON public.knowledge_objects;
DROP POLICY IF EXISTS "knowledge_objects_tenant_insert"    ON public.knowledge_objects;
CREATE POLICY "knowledge_objects_tenant_isolation" ON public.knowledge_objects USING (tenant_id = public.my_tenant_id());
CREATE POLICY "knowledge_objects_tenant_insert"    ON public.knowledge_objects FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "knowledge_links_tenant_isolation" ON public.knowledge_links;
DROP POLICY IF EXISTS "knowledge_links_tenant_insert"    ON public.knowledge_links;
CREATE POLICY "knowledge_links_tenant_isolation" ON public.knowledge_links USING (tenant_id = public.my_tenant_id());
CREATE POLICY "knowledge_links_tenant_insert"    ON public.knowledge_links FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "boards_tenant_isolation" ON public.boards;
DROP POLICY IF EXISTS "boards_tenant_insert"    ON public.boards;
CREATE POLICY "boards_tenant_isolation" ON public.boards USING (tenant_id = public.my_tenant_id());
CREATE POLICY "boards_tenant_insert"    ON public.boards FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "applications_tenant_isolation" ON public.applications;
DROP POLICY IF EXISTS "applications_tenant_insert"    ON public.applications;
CREATE POLICY "applications_tenant_isolation" ON public.applications USING (tenant_id = public.my_tenant_id());
CREATE POLICY "applications_tenant_insert"    ON public.applications FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "ingestion_pipelines_tenant_isolation" ON public.ingestion_pipelines;
DROP POLICY IF EXISTS "ingestion_pipelines_tenant_insert"    ON public.ingestion_pipelines;
CREATE POLICY "ingestion_pipelines_tenant_isolation" ON public.ingestion_pipelines USING (tenant_id = public.my_tenant_id());
CREATE POLICY "ingestion_pipelines_tenant_insert"    ON public.ingestion_pipelines FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "ai_threads_tenant_isolation" ON public.ai_threads;
DROP POLICY IF EXISTS "ai_threads_tenant_insert"    ON public.ai_threads;
CREATE POLICY "ai_threads_tenant_isolation" ON public.ai_threads USING (tenant_id = public.my_tenant_id());
CREATE POLICY "ai_threads_tenant_insert"    ON public.ai_threads FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "ai_messages_tenant_isolation" ON public.ai_messages;
DROP POLICY IF EXISTS "ai_messages_tenant_insert"    ON public.ai_messages;
CREATE POLICY "ai_messages_tenant_isolation" ON public.ai_messages USING (tenant_id = public.my_tenant_id());
CREATE POLICY "ai_messages_tenant_insert"    ON public.ai_messages FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

DROP POLICY IF EXISTS "er_matches_tenant_isolation" ON public.er_matches;
DROP POLICY IF EXISTS "er_matches_tenant_insert"    ON public.er_matches;
CREATE POLICY "er_matches_tenant_isolation" ON public.er_matches USING (tenant_id = public.my_tenant_id());
CREATE POLICY "er_matches_tenant_insert"    ON public.er_matches FOR INSERT WITH CHECK (tenant_id = public.my_tenant_id());

SELECT 'Orion Intelligence schema ready on megqdnqtghhnymyoyelr ✓' AS result;
