import { useState } from "react";
import { useAuthContext } from "./useAuthContext";

export const useSignup = () => {
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useAuthContext();

  const signup = async (email, password, displayName = "") => {
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const response = await fetch("/api/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error || "Unable to create account");
        setIsLoading(false);
        return false;
      }

      if (json.requiresEmailConfirmation || !json.token) {
        setInfoMessage(
          json.message ||
            "Account created! Please check your email to confirm before logging in."
        );
        setIsLoading(false);
        return true;
      }

      localStorage.setItem("user", JSON.stringify(json));
      dispatch({ type: "LOGIN", payload: json });
      setIsLoading(false);
      return true;
    } catch {
      setError("Network error — make sure the backend server is running.");
      setIsLoading(false);
      return false;
    }
  };

  return { signup, isLoading, error, infoMessage };
};
