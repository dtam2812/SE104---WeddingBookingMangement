import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import axios from "../common";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [formData, setFormData] = useState({
    code: "",
    value: "",
    description: "",
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const res = await axios.get("/api/rules", authHeader());
    setRules(res.data.data || []);
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      if (editingId) {
        await axios.put(`/api/rules/${editingId}`, formData, authHeader());
      } else {
        await axios.post("/api/rules", formData, authHeader());
      }
      setIsModalOpen(false);
      fetchRules();
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleEdit = (rule) => {
    setEditingId(rule.id);
    setFormData({
      code: rule.code,
      value: rule.value,
      description: rule.description || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa quy định này?")) {
      await axios.delete(`/api/rules/${id}`, authHeader());
      fetchRules();
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ code: "", value: "", description: "" });
    setIsModalOpen(true);
  };

  const filteredRules = rules.filter((r) =>
    r.code.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.ceil(filteredRules.length / itemsPerPage);
  const currentRules = filteredRules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 uppercase">
          QUẢN LÝ QUY ĐỊNH
        </h1>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Tìm kiếm quy định..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-48 pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
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
            <Plus size={16} /> Thêm Quy Định
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-slate-800">
          Danh sách quy định
        </h2>
        <span className="text-sm font-medium text-slate-600">
          Tổng số quy định: {filteredRules.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <th className="py-4 px-4 font-semibold">STT</th>
              <th className="py-4 px-4 font-semibold">MÃ QUY ĐỊNH</th>
              <th className="py-4 px-4 font-semibold">GIÁ TRỊ</th>
              <th className="py-4 px-4 font-semibold">MÔ TẢ</th>
              <th className="py-4 px-4 font-semibold text-center">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentRules.map((rule, index) => (
              <tr
                key={rule.id}
                className="hover:bg-slate-50 transition-colors text-sm"
              >
                <td className="py-4 px-4 text-slate-600">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="py-4 px-4 font-medium text-slate-800">
                  {rule.code}
                </td>
                <td className="py-4 px-4 text-slate-600">{rule.value}</td>
                <td className="py-4 px-4 text-slate-600">
                  {rule.description || "-"}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {currentRules.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Không tìm thấy quy định nào.
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
            <div className="p-6 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Chỉnh Sửa Quy Định" : "Thêm Quy Định Mới"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mã quy định:
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Giá trị:
                </label>
                <input
                  type="text"
                  required
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mô tả:
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all resize-none text-sm"
                />
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
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm"
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
