import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../common";

export default function ResetPassword() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username || !newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp!");
      return;
    }

    try {
      await axios.post("/api/auth/resetPassword", { username, newPassword });
      setSuccess("Đổi mật khẩu thành công! Đang chuyển về trang đăng nhập...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi kết nối đến máy chủ!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-purple-100">
        <h2 className="text-2xl font-bold text-center text-purple-900 mb-2">
          WEBSITE QUẢN LÝ TIỆC CƯỚI
        </h2>
        <p className="text-center text-purple-500 text-sm mb-8">
          Đặt lại mật khẩu
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-6 text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-5">
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
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-2 uppercase tracking-wider">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-purple-50/50 border border-purple-200 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              placeholder="Nhập mật khẩu mới"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-purple-800 mb-2 uppercase tracking-wider">
              Nhập lại mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-purple-50/50 border border-purple-200 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-colors mt-4 shadow-md shadow-purple-200"
          >
            Xác nhận
          </button>

          <Link to="/login">
            <p className="text-sm underline text-center text-purple-500 cursor-pointer mt-2">
              Quay lại đăng nhập
            </p>
          </Link>
        </form>
      </div>
    </div>
  );
}
