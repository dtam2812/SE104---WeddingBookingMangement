import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { toast } from "react-toastify";
import axios from "../common";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const roleOptions = [
  { value: "staff", label: "Nhân viên" },
  { value: "admin", label: "Admin" },
];

const statusOptions = [
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Bị khoá" },
];

const roleLabel = { admin: "Admin", staff: "Nhân viên" };
const statusLabel = { active: "Hoạt động", inactive: "Bị khoá" };
const statusStyle = {
  active: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  inactive: "bg-red-50 text-red-500 border border-red-200",
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const fmtDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return "-";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    phone: "",
    email: "",
    role: "staff",
    status: "active",
  });
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const fetchAccounts = async () => {
    const res = await axios.get("/api/users", authHeader());
    setAccounts(res.data.data || []);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.email && !isValidEmail(formData.email)) {
      setEmailError("Email không hợp lệ");
      return;
    }

    if (formData.phone && formData.phone.length !== 10) {
      toast.error("Số điện thoại phải có đúng 10 chữ số!");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/api/users/${editingId}`, formData, authHeader());
        toast.success("Cập nhật tài khoản thành công!");
      } else {
        await axios.post("/api/users", formData, authHeader());
        toast.success("Thêm tài khoản mới thành công!");
      }
      setIsModalOpen(false);
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleEdit = (acc) => {
    setEditingId(acc.id);
    setEmailError("");
    setError("");
    setFormData({
      username: acc.username,
      password: "",
      full_name: acc.full_name,
      phone: acc.phone || "",
      email: acc.email || "",
      role: acc.role,
      status: acc.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
      try {
        await axios.delete(`/api/users/${id}`, authHeader());
        toast.success("Đã xóa tài khoản thành công!");
        fetchAccounts();
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Có lỗi xảy ra khi xóa tài khoản!",
        );
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setEmailError("");
    setError("");
    setFormData({
      username: "",
      password: "",
      full_name: "",
      phone: "",
      email: "",
      role: "staff",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.username?.toLowerCase().includes(search.toLowerCase()) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
      (a.phone && a.phone.includes(search)),
  );

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const currentAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 uppercase">
          QUẢN LÝ TÀI KHOẢN
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-64 pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
            />
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm"
          >
            <Plus size={16} /> Thêm Tài Khoản
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-slate-800">
          Danh sách Tài khoản
        </h2>
        <span className="text-sm font-medium text-slate-600">
          Tổng số tài khoản: {filteredAccounts.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <th className="py-4 px-4 font-semibold whitespace-nowrap">STT</th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">
                HỌ TÊN
              </th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">
                TÊN TK
              </th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">SĐT</th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">
                EMAIL
              </th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">
                VAI TRÒ
              </th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">
                NGÀY THAM GIA
              </th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">
                TRẠNG THÁI
              </th>
              <th className="py-4 px-4 font-semibold text-center whitespace-nowrap">
                HÀNH ĐỘNG
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentAccounts.map((acc, index) => (
              <tr
                key={acc.id}
                className="hover:bg-slate-50 transition-colors text-sm"
              >
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="py-4 px-4 font-medium text-slate-800 whitespace-nowrap">
                  {acc.full_name}
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {acc.username}
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {acc.phone || "-"}
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {acc.email || "-"}
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {roleLabel[acc.role] || acc.role}
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {fmtDate(acc.createdAt)}
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${statusStyle[acc.status] || ""}`}
                  >
                    {statusLabel[acc.status] || acc.status}
                  </span>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(acc)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {currentAccounts.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="py-8 text-center text-slate-500 whitespace-nowrap"
                >
                  Không tìm thấy tài khoản nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            «
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                currentPage === i + 1
                  ? "bg-slate-800 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            »
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Chỉnh Sửa Tài Khoản" : "Thêm Tài Khoản Mới"}
              </h2>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 pt-0 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              {/* Họ tên */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Họ tên:
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                />
              </div>

              {/* SĐT */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  SĐT:
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-sm text-slate-600 font-medium whitespace-nowrap">
                    🇻🇳 +84
                  </span>
                  <input
                    type="text"
                    placeholder="xxxxxxxxx"
                    maxLength={9}
                    value={formData.phone ? formData.phone.slice(1) : ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 9);
                      setFormData({ ...formData, phone: "0" + val });
                    }}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                  />
                </div>
                {formData.phone &&
                  formData.phone.length > 1 &&
                  formData.phone.length < 10 && (
                    <p className="text-xs text-red-500 mt-1">
                      Vui lòng nhập đủ 9 số ({formData.phone.slice(1).length}/9)
                    </p>
                  )}
              </div>

              {/* Tên tài khoản */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên tài khoản:
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mật khẩu:{" "}
                  {editingId && (
                    <span className="text-slate-400 font-normal">
                      (để trống nếu không đổi)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email:
                </label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, email: val });
                    if (val && !isValidEmail(val)) {
                      setEmailError("Email không hợp lệ");
                    } else {
                      setEmailError("");
                    }
                  }}
                  className={`w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm ${
                    emailError
                      ? "border-red-400 focus:border-red-400"
                      : "border-slate-300 focus:border-indigo-400"
                  }`}
                />
                {emailError && (
                  <p className="text-xs text-red-500 mt-1">{emailError}</p>
                )}
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vai trò:
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                >
                  {roleOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trạng thái */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Trạng thái:
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-slate-600 font-medium bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!!emailError}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
