import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Halls from "./pages/Halls";
import Foods from "./pages/Foods";
import Services from "./pages/Services";
import Rules from "./pages/Rules";
import HallTypes from "./pages/HallTypes";
import Weddings from "./pages/Weddings";
import Invoices from "./pages/Invoices";
import Reports from "./pages/Reports";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState, useEffect } from "react";
import ResetPassword from "./pages/ResetPassword";

// Đọc user từ localStorage ngay khi khởi tạo (trước render đầu tiên)
function getInitialUser() {
  const storedUser = localStorage.getItem("user");
  const expiresAt = localStorage.getItem("expiresAt");
  if (storedUser && expiresAt && Date.now() < parseInt(expiresAt)) {
    return JSON.parse(storedUser);
  }
  // Hết hạn hoặc không có → xóa sạch
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  localStorage.removeItem("expiresAt");
  return null;
}

export default function App() {
  const [user, setUser] = useState(getInitialUser); // ✅ lazy init

  // Kiểm tra hết hạn mỗi phút
  useEffect(() => {
    const interval = setInterval(() => {
      const expiresAt = localStorage.getItem("expiresAt");
      if (expiresAt && Date.now() > parseInt(expiresAt)) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("expiresAt");
        setUser(null);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/resetPassword" element={<ResetPassword />} />

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
          <Route
            path="halls"
            element={user?.role === "admin" ? <Halls /> : <Navigate to="/" />}
          />
          <Route
            path="hall-types"
            element={user?.role === "admin" ? <HallTypes /> : <Navigate to="/" />}
          />
          <Route
            path="foods"
            element={user?.role === "admin" ? <Foods /> : <Navigate to="/" />}
          />
          <Route
            path="services"
            element={
              user?.role === "admin" ? <Services /> : <Navigate to="/" />
            }
          />
          <Route
            path="rules"
            element={user?.role === "admin" ? <Rules /> : <Navigate to="/" />}
          />
          <Route path="weddings" element={<Weddings />} />
          <Route path="invoices" element={<Invoices />} />
          <Route
            path="reports"
            element={user?.role === "admin" ? <Reports /> : <Navigate to="/" />}
          />
        </Route>
      </Routes>
    </Router>
  );
}
