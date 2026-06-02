import { useState, useEffect, useRef } from "react";
import { Search, Plus, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Check } from "lucide-react";
import { toast } from "react-toastify";
import axios from "../common";

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const SORT_OPTIONS = [{ key: "name", label: "Tên vai trò" }];

const PERMISSION_OPTIONS = [
  { key: "dashboard", label: "Trang Chủ" },
  { key: "accounts", label: "Tài Khoản" },
  { key: "invoices", label: "Hóa Đơn" },
  { key: "weddings", label: "Tiệc Cưới" },
  { key: "halls", label: "Sảnh" },
  { key: "hall-types", label: "Loại Sảnh" },
  { key: "foods", label: "Thực Đơn" },
  { key: "food-types", label: "Loại Món Ăn" },
  { key: "services", label: "Dịch Vụ" },
  { key: "shifts", label: "Ca" },
  { key: "rules", label: "Quy Định" },
  { key: "roles", label: "Vai Trò" },
  { key: "reports", label: "Xem Báo Cáo" },
];

const DIRECTION_LABEL = {
  asc: { text: "A → Z", icon: <ArrowUp size={13} /> },
  desc: { text: "Z → A", icon: <ArrowDown size={13} /> },
};

export default function Roles() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [formData, setFormData] = useState({ name: "", description: "", permissions: [] });

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchItems = async () => {
    const res = await axios.get("/api/roles");
    setItems(res.data.data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const payload = { ...formData };
    try {
      if (editingId) {
        await axios.put(`/api/roles/${editingId}`, payload, authHeader());
        toast.success("Cập nhật vai trò thành công!");
      } else {
        await axios.post("/api/roles", payload, authHeader());
        toast.success("Thêm vai trò mới thành công!");
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      description: item.description || "",
      permissions: item.permissions || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa vai trò này?")) {
      try {
        await axios.delete(`/api/roles/${id}`, authHeader());
        toast.success("Đã xóa vai trò thành công!");
        fetchItems();
      } catch (err) {
        toast.error(err.response?.data?.message || "Có lỗi xảy ra khi xóa!");
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", permissions: [] });
    setError("");
    setIsModalOpen(true);
  };

  const handleSelectSort = (key, direction) => {
    setSortConfig({ key, direction });
    setSortOpen(false);
    setCurrentPage(1);
  };

  const handleClearSort = () => {
    setSortConfig({ key: null, direction: "asc" });
    setSortOpen(false);
    setCurrentPage(1);
  };

  const activeSortOption = SORT_OPTIONS.find((o) => o.key === sortConfig.key);
  const dirLabel = DIRECTION_LABEL[sortConfig.direction];

  const filtered = items.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()),
  );

  const sortedItems = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = a.name?.toLowerCase() ?? "";
    const valB = b.name?.toLowerCase() ?? "";
    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const currentItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 uppercase">QUẢN LÝ VAI TRÒ</h1>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-48 pl-4 pr-10 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
                sortConfig.key ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ArrowUpDown size={15} />
              {sortConfig.key ? (
                <span className="flex items-center gap-1">
                  {activeSortOption?.label} <span className="text-indigo-400">·</span> {dirLabel.icon}
                </span>
              ) : "Sắp xếp"}
              <ChevronDown size={14} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sắp xếp theo</p>
                </div>
                {SORT_OPTIONS.map((opt) => (
                  <div key={opt.key}>
                    <p className="px-3 pt-2 pb-1 text-xs font-medium text-slate-500">{opt.label}</p>
                    {["asc", "desc"].map((dir) => {
                      const isActive = sortConfig.key === opt.key && sortConfig.direction === dir;
                      return (
                        <button
                          key={dir}
                          onClick={() => handleSelectSort(opt.key, dir)}
                          className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                            isActive ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">{DIRECTION_LABEL[dir].icon} {DIRECTION_LABEL[dir].text}</span>
                          {isActive && <Check size={13} className="text-indigo-500" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
                {sortConfig.key && (
                  <>
                    <div className="border-t border-slate-100 mt-1" />
                    <button onClick={handleClearSort} className="w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left">Xoá sắp xếp</button>
                  </>
                )}
              </div>
            )}
          </div>
          <button onClick={openNewModal} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm">
            <Plus size={16} /> Thêm Vai Trò
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-slate-800">Danh sách vai trò</h2>
        <span className="text-sm font-medium text-slate-600">Tổng số: {sortedItems.length}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <th className="py-4 px-4 font-semibold">STT</th>
              <th className="py-4 px-4 font-semibold">TÊN VAI TRÒ</th>
              <th className="py-4 px-4 font-semibold">MÔ TẢ</th>
              <th className="py-4 px-4 font-semibold">QUYỀN</th>
              <th className="py-4 px-4 font-semibold text-center">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors text-sm">
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                <td className="py-4 px-4 font-medium text-slate-800 whitespace-nowrap">{item.name}</td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">{item.description || "-"}</td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  <span className="text-xs">
                    {(() => {
                      const perms = item.permissions || [];
                      if (perms.length === 0) return "-";
                      if (perms.length === PERMISSION_OPTIONS.length) return "Tất cả quyền hạn";
                      return perms
                        .map((k) => {
                          const opt = PERMISSION_OPTIONS.find((o) => o.key === k);
                          return opt ? opt.label : k;
                        })
                        .join(", ");
                    })()}
                  </span>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(item)} className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition-colors">Sửa</button>
                    <button onClick={() => handleDelete(item.id)} className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium transition-colors">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500 whitespace-nowrap">Không tìm thấy vai trò nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:opacity-50">«</button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${currentPage === i + 1 ? "bg-slate-800 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{i + 1}</button>
          ))}
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:opacity-50">»</button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? "Chỉnh Sửa Vai Trò" : "Thêm Vai Trò Mới"}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên vai trò:</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả:</label>
                <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all resize-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quyền:</label>
                <div className="border border-slate-200 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2 py-1 cursor-pointer border-b border-slate-100 pb-2">
                    <input
                      type="checkbox"
                      checked={formData.permissions.length === PERMISSION_OPTIONS.length}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: e.target.checked ? PERMISSION_OPTIONS.map((o) => o.key) : [],
                        })
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-100"
                    />
                    <span className="text-sm font-medium text-slate-700">Tất cả</span>
                  </label>
                  {PERMISSION_OPTIONS.map((opt) => (
                    <label key={opt.key} className="flex items-center gap-2 py-1 pl-2 cursor-pointer hover:bg-slate-50 rounded">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(opt.key)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            permissions: e.target.checked
                              ? [...formData.permissions, opt.key]
                              : formData.permissions.filter((p) => p !== opt.key),
                          })
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-100"
                      />
                      <span className="text-sm text-slate-600">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-center gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-600 font-medium bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors text-sm">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
