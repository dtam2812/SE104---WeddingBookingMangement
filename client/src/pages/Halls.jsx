import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import axios from "../common";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const statusOptions = [
  { value: "available", label: "Đang hoạt động" },
  { value: "unavailable", label: "Đang bảo trì" },
];

const statusLabel = {
  available: "Đang hoạt động",
  unavailable: "Đang bảo trì",
  Active: "Đang hoạt động",
  Inactive: "Đang bảo trì",
  maintaining: "Đang bảo trì",
};

const statusStyle = {
  available: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  unavailable: "bg-red-50 text-red-500 border border-red-200",
  Active: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  Inactive: "bg-red-50 text-red-500 border border-red-200",
  maintaining: "bg-red-50 text-red-500 border border-red-200",
};

const normalizeStatus = (s) => {
  const map = {
    Active: "available",
    active: "available",
    Inactive: "unavailable",
    inactive: "unavailable",
    maintaining: "unavailable",
  };
  return map[s] ?? s ?? "available";
};

export default function Halls() {
  const [halls, setHalls] = useState([]);
  const [hallTypes, setHallTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type_id: "",
    max_tables: "",
    status: "available",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchHalls();
    fetchHallTypes();
  }, []);

  const fetchHalls = async () => {
    const res = await axios.get("/api/halls");
    setHalls(res.data.data || []);
  };

  const fetchHallTypes = async () => {
    const res = await axios.get("/api/hall-types");
    setHallTypes(res.data.data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/halls/${editingId}`, formData, authHeader());
      } else {
        await axios.post("/api/halls", formData, authHeader());
      }
      setIsModalOpen(false);
      fetchHalls();
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleEdit = (hall) => {
    setEditingId(hall.id);
    setFormData({
      name: hall.name,
      type_id: hall.type_id?._id || hall.type_id?.id || hall.type_id || "",
      max_tables: hall.max_tables.toString(),
      status: normalizeStatus(hall.status),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa sảnh này?")) {
      try {
        await axios.delete(`/api/halls/${id}`, authHeader());
        fetchHalls();
      } catch (err) {
        alert(err.response?.data?.message || "Có lỗi xảy ra!");
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: "", type_id: "", max_tables: "", status: "available" });
    setIsModalOpen(true);
  };

  const filteredHalls = halls.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredHalls.length / itemsPerPage);
  const currentHalls = filteredHalls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 uppercase">
          QUẢN LÝ SẢNH
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Tìm kiếm sảnh..."
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
            <Plus size={16} /> Thêm Sảnh
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-slate-800">
          Danh sách sảnh
        </h2>
        <span className="text-sm font-medium text-slate-600">
          Tổng số sảnh: {filteredHalls.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <th className="py-4 px-4 font-semibold">STT</th>
              <th className="py-4 px-4 font-semibold">TÊN SẢNH</th>
              <th className="py-4 px-4 font-semibold">LOẠI SẢNH</th>
              <th className="py-4 px-4 font-semibold">SỐ LƯỢNG BÀN TỐI ĐA</th>
              <th className="py-4 px-4 font-semibold">TRẠNG THÁI</th>
              <th className="py-4 px-4 font-semibold text-center">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentHalls.map((hall, index) => (
              <tr
                key={hall.id}
                className="hover:bg-slate-50 transition-colors text-sm"
              >
                <td className="py-4 px-4 text-slate-600">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="py-4 px-4 font-medium text-slate-800">
                  {hall.name}
                </td>
                <td className="py-4 px-4 text-slate-600">
                  {hall.type_id?.name || "-"}
                </td>
                <td className="py-4 px-4 text-slate-600">{hall.max_tables}</td>
                <td className="py-4 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${statusStyle[hall.status] || ""}`}
                  >
                    {statusLabel[hall.status] || hall.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(hall)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(hall.id)}
                      className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {currentHalls.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  Không tìm thấy sảnh nào.
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
                {editingId ? "Chỉnh Sửa Sảnh" : "Thêm Sảnh Mới"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên sảnh:
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Loại sảnh:
                </label>
                <select
                  required
                  value={formData.type_id}
                  onChange={(e) =>
                    setFormData({ ...formData, type_id: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                >
                  <option value="">-- Chọn loại sảnh --</option>
                  {hallTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số lượng bàn tối đa:
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.max_tables}
                  onChange={(e) =>
                    setFormData({ ...formData, max_tables: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Trạng thái:
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                >
                  {/*  enum Model */}
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
