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
import FoodTypes from "./pages/FoodTypes";
import Roles from "./pages/Roles";
import Shifts from "./pages/Shifts";
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
          <Route path="accounts" element={user?.permissions?.includes("accounts") || user?.role?.toLowerCase() === "admin" ? <Accounts /> : <Navigate to="/" />} />
          <Route path="halls" element={user?.permissions?.includes("halls") || user?.role?.toLowerCase() === "admin" ? <Halls /> : <Navigate to="/" />} />
          <Route path="hall-types" element={user?.permissions?.includes("hall-types") || user?.role?.toLowerCase() === "admin" ? <HallTypes /> : <Navigate to="/" />} />
          <Route path="foods" element={user?.permissions?.includes("foods") || user?.role?.toLowerCase() === "admin" ? <Foods /> : <Navigate to="/" />} />
          <Route path="food-types" element={user?.permissions?.includes("food-types") || user?.role?.toLowerCase() === "admin" ? <FoodTypes /> : <Navigate to="/" />} />
          <Route path="services" element={user?.permissions?.includes("services") || user?.role?.toLowerCase() === "admin" ? <Services /> : <Navigate to="/" />} />
          <Route path="shifts" element={user?.permissions?.includes("shifts") || user?.role?.toLowerCase() === "admin" ? <Shifts /> : <Navigate to="/" />} />
          <Route path="roles" element={user?.permissions?.includes("roles") || user?.role?.toLowerCase() === "admin" ? <Roles /> : <Navigate to="/" />} />
          <Route path="rules" element={user?.permissions?.includes("rules") || user?.role?.toLowerCase() === "admin" ? <Rules /> : <Navigate to="/" />} />
          <Route path="weddings" element={user?.permissions?.includes("weddings") || user?.role?.toLowerCase() === "admin" ? <Weddings /> : <Navigate to="/" />} />
          <Route path="invoices" element={user?.permissions?.includes("invoices") || user?.role?.toLowerCase() === "admin" ? <Invoices /> : <Navigate to="/" />} />
          <Route path="reports" element={user?.permissions?.includes("reports") || user?.role?.toLowerCase() === "admin" ? <Reports /> : <Navigate to="/" />} />
        </Route>
      </Routes>
    </Router>
  );
}
