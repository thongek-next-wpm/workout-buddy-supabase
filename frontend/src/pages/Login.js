import { useState } from "react";
import { Link } from "react-router-dom";
import { useLogin } from "../hooks/useLogin";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import {
  ActivityIcon,
  DatabaseIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  ShieldIcon,
} from "../components/Icons";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, isLoading } = useLogin();
  const { signInWithGoogle, isGoogleLoading, googleError } = useGoogleAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  const busy = isLoading || isGoogleLoading;

  return (
    <div className="auth-layout">
      <section className="auth-showcase">
        <span className="pill pill-accent">Supabase + PostgreSQL</span>
        <h1>Elevate Every Rep &amp; Session.</h1>
        <p className="auth-lead">
          A streamlined training log built on Supabase Auth and PostgreSQL Row
          Level Security—track load, sets, reps, and total volume effortlessly.
        </p>

        <ul className="feature-list">
          <li>
            <span className="feature-icon">
              <DatabaseIcon width={18} height={18} />
            </span>
            <div>
              <strong>Cloud PostgreSQL Storage</strong>
              <span>Reliable relational workout history via Supabase</span>
            </div>
          </li>
          <li>
            <span className="feature-icon">
              <ShieldIcon width={18} height={18} />
            </span>
            <div>
              <strong>Protected by Row Level Security</strong>
              <span>Your training logs stay strictly private to your user ID</span>
            </div>
          </li>
          <li>
            <span className="feature-icon">
              <ActivityIcon width={18} height={18} />
            </span>
            <div>
              <strong>Volume &amp; Overload Analytics</strong>
              <span>
                Live stats, quick presets, category filters &amp; inline editing
              </span>
            </div>
          </li>
        </ul>
      </section>

      <form className="auth-card card" onSubmit={handleSubmit}>
        <div className="auth-card-header">
          <h2>Welcome back</h2>
          <p className="muted-text">Sign in to access your workout log</p>
        </div>

        <button
          type="button"
          className="btn btn-google btn-block"
          onClick={signInWithGoogle}
          disabled={busy}
        >
          <GoogleIcon />
          <span>
            {isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}
          </span>
        </button>

        <div className="auth-divider" role="separator">
          <span>or sign in with email</span>
        </div>

        <div className="field-group">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="athlete@example.com"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
        </div>

        <div className="field-group">
          <label htmlFor="login-password">Password</label>
          <div className="password-field">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOffIcon width={17} height={17} />
              ) : (
                <EyeIcon width={17} height={17} />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={busy}
        >
          {isLoading ? "Signing in..." : "Log in"}
        </button>

        {(error || googleError) && (
          <div className="alert alert-error" role="alert">
            {error || googleError}
          </div>
        )}

        <p className="auth-switch">
          New to Workout Buddy? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
