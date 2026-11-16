import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLogout } from "../hooks/useLogout";
import { useAuthContext } from "../hooks/useAuthContext";
import { useTheme } from "../context/ThemeContext";
import { DumbbellIcon, LogOutIcon, MoonIcon, SunIcon } from "./Icons";

const Navbar = () => {
  const { logout } = useLogout();
  const { user } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [avatarFailed, setAvatarFailed] = useState(false);

  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Athlete";
  const initial = displayName.charAt(0).toUpperCase();
  const showAvatarImg = Boolean(user?.avatarUrl) && !avatarFailed;

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <DumbbellIcon width={20} height={20} />
          </span>
          <span className="brand-text">
            <span className="brand-title">Workout Buddy</span>
            <span className="brand-badge">Supabase Edition</span>
          </span>
        </Link>

        <nav className="nav-actions" aria-label="Primary navigation">
          <button
            type="button"
            className="icon-btn theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          {user ? (
            <div className="user-menu">
              <div className="user-pill" title={user.email}>
                {showAvatarImg ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="user-avatar-img"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <span className="user-avatar">{initial}</span>
                )}
                <span className="user-email">{user.email}</span>
              </div>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                <LogOutIcon width={16} height={16} />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <div className="auth-nav">
              <Link
                to="/login"
                className={`nav-link ${
                  location.pathname === "/login" ? "active" : ""
                }`}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className={`btn btn-primary btn-sm ${
                  location.pathname === "/signup" ? "active" : ""
                }`}
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
