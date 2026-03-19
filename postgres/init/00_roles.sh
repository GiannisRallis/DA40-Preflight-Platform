#!/bin/bash
# =============================================================
# 00_roles.sh — Runs FIRST during postgres initialization
# Creates all roles needed by GoTrue and PostgREST
# Uses $POSTGRES_PASSWORD so passwords always match .env
# =============================================================
set -euo pipefail

echo ">>> [DA40] Creating database roles..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL

-- ── No-login roles (JWT audiences) ──────────────────────────
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
    RAISE NOTICE 'Created role: anon';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
    RAISE NOTICE 'Created role: authenticated';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
    RAISE NOTICE 'Created role: service_role';
  END IF;
END \$\$;

-- ── Login roles (used by GoTrue and PostgREST) ───────────────
-- Password = POSTGRES_PASSWORD from .env (substituted by shell)
DO \$\$ BEGIN
  -- authenticator: used by PostgREST to connect
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD '$POSTGRES_PASSWORD';
    RAISE NOTICE 'Created role: authenticator';
  ELSE
    ALTER  ROLE authenticator WITH LOGIN PASSWORD '$POSTGRES_PASSWORD';
    RAISE NOTICE 'Updated role: authenticator';
  END IF;

  -- supabase_auth_admin: used by GoTrue to manage auth schema
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    CREATE ROLE supabase_auth_admin NOINHERIT LOGIN PASSWORD '$POSTGRES_PASSWORD' CREATEROLE;
    RAISE NOTICE 'Created role: supabase_auth_admin';
  ELSE
    ALTER  ROLE supabase_auth_admin WITH LOGIN PASSWORD '$POSTGRES_PASSWORD';
    RAISE NOTICE 'Updated role: supabase_auth_admin';
  END IF;
END \$\$;

-- ── Grant JWT roles to authenticator ────────────────────────
GRANT anon, authenticated, service_role TO authenticator;

-- ── Auth schema for GoTrue ───────────────────────────────────
CREATE SCHEMA IF NOT EXISTS auth;
ALTER SCHEMA auth OWNER TO supabase_auth_admin;
GRANT ALL  ON SCHEMA auth   TO supabase_auth_admin;
GRANT USAGE ON SCHEMA auth  TO postgres;

-- Grant permissions on public schema
GRANT CREATE, USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ── Set search_path for roles ──────────────────────────────────
ALTER ROLE supabase_auth_admin SET search_path = auth, public, pg_catalog;
ALTER ROLE authenticator SET search_path = public, auth, pg_catalog;

SQL

echo ">>> [DA40] Roles created successfully."
echo ""
echo ">>> [DA40] Initializing application schema..."
echo ""
