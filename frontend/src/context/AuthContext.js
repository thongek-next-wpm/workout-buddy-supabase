import { createContext, useReducer, useEffect } from "react";

export const AuthContext = createContext();

export const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.payload, authIsReady: true };
    case "LOGOUT":
      return { ...state, user: null, authIsReady: true };
    case "AUTH_IS_READY":
      return { ...state, user: action.payload, authIsReady: true };
    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    authIsReady: false,
  });

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      dispatch({ type: "AUTH_IS_READY", payload: storedUser || null });
    } catch {
      localStorage.removeItem("user");
      dispatch({ type: "AUTH_IS_READY", payload: null });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};
