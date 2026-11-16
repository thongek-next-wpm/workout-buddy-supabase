import { useState } from "react";
import { Link } from "react-router-dom";
import { useSignup } from "../hooks/useSignup";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import {
  ActivityIcon,
  DatabaseIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  ShieldIcon,
} from "../components/Icons";

const Signup = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signup, error, infoMessage, isLoading } = useSignup();
  const { signInWithGoogle, isGoogleLoading, googleError } = useGoogleAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signup(email, password, displayName);
  };

  const busy = isLoading || isGoogleLoading;

  return (
    <div className="auth-layout">
      <section className="auth-showcase">
        <span className="pill pill-accent">Supabase + PostgreSQL</span>
        <h1>Build Consistency, One Workout at a Time.</h1>
        <p className="auth-lead">
          Create your free athlete profile powered by Supabase Auth and start
          logging sets, loads, and progressive overload today.
        </p>

        <ul className="feature-list">
          <li>
            <span className="feature-icon">
              <DatabaseIcon width={18} height={18} />
            </span>
            <div>
              <strong>Instant Cloud Sync</strong>
              <span>Structured PostgreSQL schema with automatic timestamps</span>
            </div>
          </li>
          <li>
            <span className="feature-icon">
              <ShieldIcon width={18} height={18} />
            </span>
            <div>
              <strong>JWT + RLS Security</strong>
              <span>Zero-trust isolation between every user&apos;s workouts</span>
            </div>
          </li>
          <li>
            <span className="feature-icon">
              <ActivityIcon width={18} height={18} />
            </span>
            <div>
              <strong>Modern Dark &amp; Light UI</strong>
              <span>Built for fast logging on desktop and mobile devices</span>
            </div>
          </li>
        </ul>
      </section>

      <form className="auth-card card" onSubmit={handleSubmit}>
        <div className="auth-card-header">
          <h2>Create your account</h2>
          <p className="muted-text">Start tracking your workouts in seconds</p>
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
          <span>or sign up with email</span>
        </div>

        <div className="field-group">
          <label htmlFor="signup-name">Display Name (optional)</label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Alex"
            onChange={(e) => setDisplayName(e.target.value)}
            value={displayName}
          />
        </div>

        <div className="field-group">
          <label htmlFor="signup-email">Email address</label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="athlete@example.com"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
        </div>

        <div className="field-group">
          <label htmlFor="signup-password">Password</label>
          <div className="password-field">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min 8 chars, upper, lower & number"
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
          <span className="field-hint">
            Use at least 8 characters with uppercase, lowercase, and a number.
          </span>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={busy}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </button>

        {(error || googleError) && (
          <div className="alert alert-error" role="alert">
            {error || googleError}
          </div>
        )}

        {infoMessage && (
          <div className="alert alert-success" role="status">
            {infoMessage}
          </div>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
