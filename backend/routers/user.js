const express = require("express");
const {
  loginUser,
  signupUser,
  refreshSession,
  getMe,
  getPublicConfig,
} = require("../controllers/userController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// Public auth & OAuth config routes
router.get("/config", getPublicConfig);
router.post("/login", loginUser);
router.post("/signup", signupUser);
router.post("/refresh", refreshSession);

// Authenticated user profile route
router.get("/me", requireAuth, getMe);

module.exports = router;
