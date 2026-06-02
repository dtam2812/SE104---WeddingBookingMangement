import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../common";

export default function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập tài khoản và mật khẩu!");
      return;
    }
    try {
      const res = await axios.post("/api/auth/login", { username, password });
      const { user, token } = res.data;
      const expiresAt = Date.now() + 60 * 60 * 1000;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      localStorage.setItem("expiresAt", expiresAt.toString());

      setUser(user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi kết nối đến máy chủ!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-purple-100">
        <h2 className="text-2xl font-bold text-center text-purple-900 mb-8">
          WEBSITE QUẢN LÝ TIỆC CƯỚI
        </h2>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-2 uppercase tracking-wider">
              Tài khoản
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-purple-50/50 border border-purple-200 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              placeholder="Nhập tài khoản"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-2 uppercase tracking-wider">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-purple-50/50 border border-purple-200 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              placeholder="Nhập mật khẩu"
              required
            />
          </div>
          <Link to="/resetPassword">
            <p className="text-sm underline text-end cursor-pointer">
              Quên mật khẩu
            </p>
          </Link>
          <button
            type="submit"
            className="w-full py-3.5 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors mt-4 shadow-md shadow-purple-200"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}
