import { useState } from "react";
import { getBrowserSupabase } from "../lib/supabaseClient";

export const useGoogleAuth = () => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);

  const signInWithGoogle = async () => {
    setIsGoogleLoading(true);
    setGoogleError(null);

    try {
      const { supabase, config } = await getBrowserSupabase();

      // Verify Google provider is enabled on Supabase before redirecting away
      const settingsRes = await fetch(`${config.supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: config.supabaseAnonKey },
      });

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings?.external && settings.external.google === false) {
          setGoogleError(
            "Google OAuth is not enabled in Supabase yet. Enable Google under Authentication → Providers → Google in your Supabase Dashboard."
          );
          setIsGoogleLoading(false);
          return false;
        }
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setGoogleError(error.message || "Unable to start Google Sign-In");
        setIsGoogleLoading(false);
        return false;
      }

      return true;
    } catch (err) {
      setGoogleError(
        err?.message || "Network error — make sure the backend server is running."
      );
      setIsGoogleLoading(false);
      return false;
    }
  };

  return { signInWithGoogle, isGoogleLoading, googleError };
};
