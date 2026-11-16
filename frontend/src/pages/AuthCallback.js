import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import {
  exchangeAuthCodeOnce,
  formatSupabaseSessionUser,
  getBrowserSupabase,
} from "../lib/supabaseClient";
import { DumbbellIcon } from "../components/Icons";

const AuthCallback = () => {
  const { user, dispatch } = useAuthContext();
  const [status, setStatus] = useState("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const completeOAuth = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, "")
        );

        const oauthError =
          searchParams.get("error_description") ||
          hashParams.get("error_description") ||
          searchParams.get("error") ||
          hashParams.get("error");

        if (oauthError) {
          throw new Error(oauthError);
        }

        const code = searchParams.get("code");
        const hashAccessToken = hashParams.get("access_token");
        const hashRefreshToken = hashParams.get("refresh_token");

        let session = null;

        if (code) {
          const { data, error } = await exchangeAuthCodeOnce(code);
          if (error) throw error;
          session = data?.session || null;
        } else if (hashAccessToken && hashRefreshToken) {
          const { supabase } = await getBrowserSupabase();
          const { data, error } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken,
          });
          if (error) throw error;
          session = data?.session || null;
        } else {
          const { supabase } = await getBrowserSupabase();
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          session = data?.session || null;
        }

        const formattedUser = formatSupabaseSessionUser(session);
        if (!formattedUser) {
          throw new Error(
            "Unable to complete Google sign-in session. Please try logging in again."
          );
        }

        localStorage.setItem("user", JSON.stringify(formattedUser));
        if (active) {
          dispatch({ type: "LOGIN", payload: formattedUser });
          setStatus("done");
        }
      } catch (err) {
        if (active) {
          setErrorMessage(
            err?.message || "Google authentication failed. Please try again."
          );
          setStatus("error");
        }
      }
    };

    completeOAuth();

    return () => {
      active = false;
    };
  }, [dispatch]);

  if (status === "done" || user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-callback-wrap">
      <div className="auth-callback-card card">
        <div className="brand-mark">
          <DumbbellIcon width={22} height={22} />
        </div>

        {status === "processing" ? (
          <>
            <h2>Completing Google Sign-In...</h2>
            <p className="muted-text">
              Verifying your Supabase session and preparing your training
              dashboard.
            </p>
            <div className="spinner" aria-hidden="true" />
          </>
        ) : (
          <>
            <h2>Sign-In Could Not Complete</h2>
            <div className="alert alert-error" role="alert">
              {errorMessage}
            </div>
            <Link to="/login" className="btn btn-primary btn-block">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
