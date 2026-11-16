import { createClient } from "@supabase/supabase-js";

let cachedClient = null;
let cachedConfig = null;
const inFlightCodeExchanges = new Map();

export const resolvePublicSupabaseConfig = async () => {
  if (cachedConfig) return cachedConfig;

  const envUrl = (process.env.REACT_APP_SUPABASE_URL || "").trim();
  const envKey = (process.env.REACT_APP_SUPABASE_ANON_KEY || "").trim();

  if (
    envUrl &&
    envKey &&
    !envUrl.includes("your-project-ref") &&
    !envKey.includes("your-supabase")
  ) {
    cachedConfig = { supabaseUrl: envUrl, supabaseAnonKey: envKey };
    return cachedConfig;
  }

  const response = await fetch("/api/user/config");
  const json = await response.json();

  if (!response.ok || !json.supabaseUrl || !json.supabaseAnonKey) {
    throw new Error(
      json.error ||
        "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env."
    );
  }

  cachedConfig = {
    supabaseUrl: json.supabaseUrl,
    supabaseAnonKey: json.supabaseAnonKey,
  };
  return cachedConfig;
};

export const getBrowserSupabase = async () => {
  const config = await resolvePublicSupabaseConfig();

  if (!cachedClient) {
    cachedClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: false,
      },
    });
  }

  return { supabase: cachedClient, config };
};

/**
 * Ensures each single-use PKCE authorization code is exchanged at most once,
 * preventing duplicate-request failures under React StrictMode.
 */
export const exchangeAuthCodeOnce = async (code) => {
  if (inFlightCodeExchanges.has(code)) {
    return inFlightCodeExchanges.get(code);
  }

  const promise = (async () => {
    const { supabase } = await getBrowserSupabase();
    return supabase.auth.exchangeCodeForSession(code);
  })();

  inFlightCodeExchanges.set(code, promise);
  try {
    const result = await promise;
    if (result?.error) {
      inFlightCodeExchanges.delete(code);
    }
    return result;
  } catch (err) {
    inFlightCodeExchanges.delete(code);
    throw err;
  }
};

export const formatSupabaseSessionUser = (session) => {
  const user = session?.user;
  if (!user || !session?.access_token) return null;

  return {
    id: user.id,
    email: user.email,
    displayName:
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Athlete",
    avatarUrl:
      user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
    provider: user.app_metadata?.provider || "google",
    token: session.access_token,
    refreshToken: session.refresh_token || null,
    expiresAt: session.expires_at || null,
  };
};

export const signOutBrowserSupabase = async () => {
  try {
    if (cachedClient) {
      await cachedClient.auth.signOut();
    } else {
      const { supabase } = await getBrowserSupabase();
      await supabase.auth.signOut();
    }
  } catch {
    // Ignore cleanup errors if Supabase config is unavailable during logout
  }
};
