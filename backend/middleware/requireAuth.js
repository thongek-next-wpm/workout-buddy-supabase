const {
  getSupabaseClient,
  createSupabaseUserClient,
  isSupabaseConfigured,
} = require("../config/supabase");

/**
 * Verifies the incoming Supabase Bearer JWT and attaches `req.user` and an
 * RLS-scoped `req.supabase` client to the Express request.
 */
const createRequireAuth = (deps = {}) => {
  const checkConfigured = deps.isSupabaseConfigured || isSupabaseConfigured;
  const getClient = deps.getSupabaseClient || getSupabaseClient;
  const createUserClient =
    deps.createSupabaseUserClient || createSupabaseUserClient;

  return async (req, res, next) => {
    if (!checkConfigured()) {
      return res.status(503).json({
        error:
          "Supabase is not configured on the server. Set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env.",
      });
    }

    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const token = authorization.slice(7).trim();
    if (!token) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    try {
      const supabase = getClient();
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data?.user) {
        return res.status(401).json({ error: "Request is not authorized" });
      }

      req.user = data.user;
      req.accessToken = token;
      req.supabase = createUserClient(token);
      next();
    } catch (error) {
      console.error("Auth verification error:", error.message);
      res.status(401).json({ error: "Request is not authorized" });
    }
  };
};

module.exports = createRequireAuth();
module.exports.createRequireAuth = createRequireAuth;
