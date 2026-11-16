const { createClient } = require("@supabase/supabase-js");

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

const getSupabaseConfig = () => {
  const url = (process.env.SUPABASE_URL || "").trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || "").trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  return { url, anonKey, serviceRoleKey };
};

const isSupabaseConfigured = () => {
  const { url, anonKey } = getSupabaseConfig();
  return (
    Boolean(url) &&
    Boolean(anonKey) &&
    !url.includes("your-project-ref") &&
    !anonKey.includes("your-supabase-anon-key")
  );
};

let cachedAnonClient = null;
let cachedAnonKeySignature = "";
let cachedAdminClient = null;
let cachedAdminKeySignature = "";

/**
 * Returns the shared Supabase anonymous client for Auth operations.
 */
const getSupabaseClient = () => {
  const { url, anonKey } = getSupabaseConfig();

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env"
    );
  }

  const signature = `${url}|${anonKey}`;
  if (!cachedAnonClient || cachedAnonKeySignature !== signature) {
    cachedAnonClient = createClient(url, anonKey, clientOptions);
    cachedAnonKeySignature = signature;
  }

  return cachedAnonClient;
};

/**
 * Returns an optional Supabase admin client when SUPABASE_SERVICE_ROLE_KEY is provided.
 */
const getSupabaseAdminClient = () => {
  const { url, serviceRoleKey } = getSupabaseConfig();

  if (!url || !serviceRoleKey) {
    return null;
  }

  const signature = `${url}|${serviceRoleKey}`;
  if (!cachedAdminClient || cachedAdminKeySignature !== signature) {
    cachedAdminClient = createClient(url, serviceRoleKey, clientOptions);
    cachedAdminKeySignature = signature;
  }

  return cachedAdminClient;
};

/**
 * Creates a request-scoped Supabase client carrying the authenticated user's JWT
 * so PostgreSQL Row Level Security (RLS) policies execute as `auth.uid()`.
 */
const createSupabaseUserClient = (accessToken) => {
  const { url, anonKey } = getSupabaseConfig();

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env"
    );
  }

  return createClient(url, anonKey, {
    ...clientOptions,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

module.exports = {
  getSupabaseConfig,
  isSupabaseConfigured,
  getSupabaseClient,
  getSupabaseAdminClient,
  createSupabaseUserClient,
};
