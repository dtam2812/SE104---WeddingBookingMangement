import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Accounts from "./pages/Accounts";
import { useState, useEffect } from "react";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("user");
      const expiresAt = localStorage.getItem("expiresAt");

      if (storedUser) {
        if (!expiresAt || Date.now() > parseInt(expiresAt)) {
          // Token expired or missing
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          localStorage.removeItem("expiresAt");
          setUser(null);
        } else {
          setUser(JSON.parse(storedUser));
        }
      }
    };

    checkAuth();

    // Check expiration every minute
    const interval = setInterval(checkAuth, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Layout user={user} setUser={setUser} />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route
            path="accounts"
            element={
              user?.role === "admin" ? <Accounts /> : <Navigate to="/" />
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}
