import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Home,
  User,
  DollarSign,
  Heart,
  CalendarHeart,
  Utensils,
  ConciergeBell,
  BookOpenCheck,
  FileBarChart,
  LogOut,
  Settings,
} from "lucide-react";
import clsx from "clsx";

export default function Layout({ user, setUser }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("expiresAt");
    setUser(null);
    navigate("/login");
  };

  const navItems = [
    { path: "/", icon: Home, label: "Trang Chủ" },
    ...(user?.role === "admin"
      ? [{ path: "/accounts", icon: User, label: "Tài Khoản" }]
      : []),
    { path: "/invoices", icon: DollarSign, label: "Hóa Đơn" },
    { path: "/weddings", icon: Heart, label: "Tiệc Cưới" },
    ...(user?.role === "admin"
      ? [
          { path: "/halls", icon: CalendarHeart, label: "Sảnh" },
          { path: "/foods", icon: Utensils, label: "Thực Đơn" },
          { path: "/services", icon: ConciergeBell, label: "Dịch Vụ" },
          { path: "/rules", icon: BookOpenCheck, label: "Quy Định" },
          { path: "/reports", icon: FileBarChart, label: "Xem Báo Cáo" },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-purple-50 font-sans text-purple-900">
      {/* Sidebar */}
      <div
        className={clsx(
          "fixed top-0 left-0 h-screen bg-white border-r border-purple-100 text-purple-900 transition-all duration-300 z-50 flex flex-col",
          collapsed ? "w-[70px]" : "w-[250px]",
        )}
      >
        <div className="flex flex-col px-4 pt-6 pb-4 border-b border-purple-50">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 -ml-1.5 w-fit rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
          >
            <Menu size={20} />
          </button>
          {!collapsed && (
            <h2 className="font-bold text-xl mt-6 mb-2 whitespace-nowrap tracking-wide text-purple-800">
              Quản lý Tiệc Cưới
            </h2>
          )}
        </div>
        <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-1.5 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex items-center gap-4 px-3 py-3 rounded-xl transition-colors relative",
                  isActive
                    ? "text-purple-700 font-semibold bg-purple-100"
                    : "text-purple-600 hover:bg-purple-50 hover:text-purple-800 font-medium",
                  collapsed && "justify-center px-0",
                )}
                title={collapsed ? item.label : undefined}
              >
                <div className="relative flex items-center justify-center w-6 h-6">
                  <Icon
                    size={20}
                    className={clsx(
                      isActive ? "text-purple-700" : "text-purple-500",
                    )}
                  />
                </div>
                {!collapsed && (
                  <span className="whitespace-nowrap relative z-10">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div
        className={clsx(
          "flex-1 transition-all duration-300 min-h-screen flex flex-col",
          collapsed ? "ml-[70px]" : "ml-[250px]",
        )}
      >
        {/* Header */}
        <header className="h-16 bg-white shadow-sm border-b border-purple-100 flex items-center justify-end px-6 sticky top-0 z-40">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors border border-purple-100"
            >
              <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || "?"}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-semibold text-purple-900">
                  {user?.full_name || user?.username}
                </div>
                <div className="text-xs text-purple-600">
                  {user?.role === "admin" ? "Administrator" : "User"}
                </div>
              </div>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-purple-100 z-50 py-2">
                  <button className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 flex items-center gap-2">
                    <User size={16} /> Xem tài khoản
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 flex items-center gap-2">
                    <Settings size={16} /> Cài đặt
                  </button>
                  <div className="h-px bg-purple-50 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
