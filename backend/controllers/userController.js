const validator = require("validator");
const {
  getSupabaseConfig,
  getSupabaseClient,
  getSupabaseAdminClient,
  isSupabaseConfigured,
} = require("../config/supabase");

const PASSWORD_POLICY = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 0,
};

const getDisplayName = (user) =>
  user?.user_metadata?.display_name ||
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  user?.email?.split("@")[0] ||
  "Athlete";

const getAvatarUrl = (user) =>
  user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";

const formatUserPayload = (user, session) => ({
  id: user.id,
  email: user.email,
  displayName: getDisplayName(user),
  avatarUrl: getAvatarUrl(user),
  provider: user.app_metadata?.provider || "email",
  token: session?.access_token || null,
  refreshToken: session?.refresh_token || null,
  expiresAt: session?.expires_at || null,
});

const ensureSupabaseReady = (checkConfigured, res) => {
  if (!checkConfigured()) {
    res.status(503).json({
      error:
        "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env.",
    });
    return false;
  }
  return true;
};

const createUserController = (deps = {}) => {
  const checkConfigured = deps.isSupabaseConfigured || isSupabaseConfigured;
  const getClient = deps.getSupabaseClient || getSupabaseClient;
  const getAdminClient = deps.getSupabaseAdminClient || getSupabaseAdminClient;

  // Sign up a new user via Supabase Auth
  const signupUser = async (req, res) => {
    if (!ensureSupabaseReady(checkConfigured, res)) return;

    const { email, password, displayName } = req.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const trimmedName = typeof displayName === "string" ? displayName.trim() : "";

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: "All fields must be filled" });
    }

    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ error: "Email is not valid" });
    }

    if (!validator.isStrongPassword(password, PASSWORD_POLICY)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters and include uppercase, lowercase, and a number",
      });
    }

    try {
      const supabase = getClient();
      const supabaseAdmin = getAdminClient();
      const metadata = {
        display_name: trimmedName || normalizedEmail.split("@")[0],
      };

      // If service role key is configured, auto-confirm email so users can start right away
      if (supabaseAdmin) {
        const { error: adminError } = await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: metadata,
        });

        if (adminError) {
          const message = adminError.message?.toLowerCase().includes("already")
            ? "Email already in use"
            : adminError.message;
          return res.status(400).json({ error: message });
        }

        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });

        if (loginError || !loginData?.user || !loginData?.session) {
          return res.status(400).json({
            error: loginError?.message || "Account created, please log in",
          });
        }

        return res
          .status(200)
          .json(formatUserPayload(loginData.user, loginData.session));
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        const message = error.message?.toLowerCase().includes("already")
          ? "Email already in use"
          : error.message;
        return res.status(400).json({ error: message });
      }

      if (!data?.user) {
        return res.status(400).json({ error: "Unable to create user account" });
      }

      // Handle Supabase projects that require email confirmation before issuing a session
      if (!data.session) {
        return res.status(200).json({
          id: data.user.id,
          email: data.user.email,
          displayName: metadata.display_name,
          requiresEmailConfirmation: true,
          message:
            "Account created! Please confirm your email address before logging in.",
        });
      }

      return res.status(200).json(formatUserPayload(data.user, data.session));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };

  // Log in an existing user via Supabase Auth
  const loginUser = async (req, res) => {
    if (!ensureSupabaseReady(checkConfigured, res)) return;

    const { email, password } = req.body || {};
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: "All fields must be filled" });
    }

    try {
      const supabase = getClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error || !data?.user || !data?.session) {
        return res.status(400).json({
          error: error?.message || "Invalid login credentials",
        });
      }

      return res.status(200).json(formatUserPayload(data.user, data.session));
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };

  // Refresh an expired Supabase access token
  const refreshSession = async (req, res) => {
    if (!ensureSupabaseReady(checkConfigured, res)) return;

    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    try {
      const supabase = getClient();
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data?.user || !data?.session) {
        return res.status(401).json({ error: "Session expired, please log in again" });
      }

      return res.status(200).json(formatUserPayload(data.user, data.session));
    } catch (error) {
      return res.status(401).json({ error: "Session expired, please log in again" });
    }
  };

  // Return authenticated user profile
  const getMe = async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Request is not authorized" });
    }

    return res.status(200).json({
      id: req.user.id,
      email: req.user.email,
      displayName: getDisplayName(req.user),
      avatarUrl: getAvatarUrl(req.user),
      provider: req.user.app_metadata?.provider || "email",
    });
  };

  // Return public Supabase config (URL + publishable/anon key only, never service_role)
  const getPublicConfig = async (req, res) => {
    if (!ensureSupabaseReady(checkConfigured, res)) return;

    const getConfig = deps.getSupabaseConfig || getSupabaseConfig;
    const { url, anonKey } = getConfig();

    return res.status(200).json({
      supabaseUrl: url,
      supabaseAnonKey: anonKey,
    });
  };

  return {
    signupUser,
    loginUser,
    refreshSession,
    getMe,
    getPublicConfig,
  };
};

module.exports = {
  ...createUserController(),
  createUserController,
  PASSWORD_POLICY,
};
