import { useAuthContext } from "./useAuthContext";
import { useWorkoutContext } from "./useWorkoutContext";
import { signOutBrowserSupabase } from "../lib/supabaseClient";

export const useLogout = () => {
  const { dispatch } = useAuthContext();
  const { dispatch: workoutDispatch } = useWorkoutContext();

  const logout = () => {
    localStorage.removeItem("user");
    dispatch({ type: "LOGOUT" });
    workoutDispatch({ type: "SET_WORKOUTS", payload: null });
    void signOutBrowserSupabase();
  };

  return { logout };
};
