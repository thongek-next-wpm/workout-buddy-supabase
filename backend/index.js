const express = require("express");
const cors = require("cors");
require("dotenv").config();

const workoutRoutes = require("./routers/Workout");
const userRouter = require("./routers/user");
const { isSupabaseConfigured, getSupabaseConfig } = require("./config/supabase");

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(req.method, req.path);
    }
    next();
  });

  app.get("/", (req, res) => {
    res.json({
      name: "Workout Buddy API",
      database: "Supabase (PostgreSQL)",
      configured: isSupabaseConfigured(),
    });
  });

  app.get("/api/health", (req, res) => {
    const { url } = getSupabaseConfig();
    res.status(200).json({
      status: "ok",
      database: "supabase",
      supabaseConfigured: isSupabaseConfigured(),
      supabaseUrlSet: Boolean(url),
    });
  });

  app.use("/api/workouts", workoutRoutes);
  app.use("/api/user", userRouter);

  return app;
};

const app = createApp();

if (require.main === module) {
  const port = process.env.PORT || 3003;

  if (!isSupabaseConfigured()) {
    console.warn(
      "[Warning] SUPABASE_URL or SUPABASE_ANON_KEY is missing in backend/.env. API auth/data endpoints will return 503 until configured."
    );
  } else {
    console.log("Supabase client configured:", getSupabaseConfig().url);
  }

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

module.exports = { app, createApp };
