import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthContext } from "./hooks/useAuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import Navbar from "./components/Navbar";

function App() {
  const { user, authIsReady } = useAuthContext();

  return (
    <div className="app-shell">
      <BrowserRouter>
        <Navbar />
        <main className="pages container">
          {!authIsReady ? (
            <div className="page-loader" role="status">
              Loading workspace...
            </div>
          ) : (
            <Routes>
              <Route
                path="/"
                element={user ? <Home /> : <Navigate to="/login" replace />}
              />
              <Route
                path="/login"
                element={!user ? <Login /> : <Navigate to="/" replace />}
              />
              <Route
                path="/signup"
                element={!user ? <Signup /> : <Navigate to="/" replace />}
              />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="*"
                element={<Navigate to={user ? "/" : "/login"} replace />}
              />
            </Routes>
          )}
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;
