import { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  Filter,
} from "lucide-react";
import { toast } from "react-toastify";
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

const SORT_OPTIONS = [
  { key: "name", label: "Tên sảnh" },
  { key: "type", label: "Loại sảnh" },
  { key: "max_tables", label: "Số bàn tối đa" },
  { key: "status", label: "Trạng thái" },
];

const DIRECTION_LABEL = {
  asc: { text: "A → Z", icon: <ArrowUp size={13} /> },
  desc: { text: "Z → A", icon: <ArrowDown size={13} /> },
};
const DIRECTION_LABEL_NUMBER = {
  asc: { text: "Tăng dần", icon: <ArrowUp size={13} /> },
  desc: { text: "Giảm dần", icon: <ArrowDown size={13} /> },
};

// --- Filter options ---
const FILTER_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả", dot: null },
  { value: "available", label: "Đang hoạt động", dot: "bg-emerald-500" },
  { value: "unavailable", label: "Đang bảo trì", dot: "bg-red-500" },
];

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
  const [error, setError] = useState("");

  // --- SORT STATE ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  // --- FILTER STATE ---
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const itemsPerPage = 8;

  useEffect(() => {
    fetchHalls();
    fetchHallTypes();
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target))
        setSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target))
        setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
    setError("");
    try {
      if (editingId) {
        await axios.put(`/api/halls/${editingId}`, formData, authHeader());
        toast.success("Cập nhật sảnh thành công!");
      } else {
        await axios.post("/api/halls", formData, authHeader());
        toast.success("Thêm sảnh mới thành công!");
      }
      setIsModalOpen(false);
      fetchHalls();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra!");
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
        toast.success("Đã xóa sảnh thành công!");
        fetchHalls();
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Có lỗi xảy ra khi xóa sảnh!",
        );
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: "", type_id: "", max_tables: "", status: "available" });
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

  const handleSelectFilter = (value) => {
    setFilterStatus(value);
    setFilterOpen(false);
    setCurrentPage(1);
  };

  // Label trên button sort
  const activeSortOption = SORT_OPTIONS.find((o) => o.key === sortConfig.key);
  const dirLabel =
    sortConfig.key === "max_tables"
      ? DIRECTION_LABEL_NUMBER[sortConfig.direction]
      : DIRECTION_LABEL[sortConfig.direction];

  // Label trên button filter
  const activeFilterOption = FILTER_STATUS_OPTIONS.find(
    (o) => o.value === filterStatus,
  );

  // --- LỌC + SORT + PHÂN TRANG ---
  const filteredHalls = halls
    .filter((h) => h.name.toLowerCase().includes(search.toLowerCase()))
    .filter((h) => {
      if (filterStatus === "all") return true;
      return normalizeStatus(h.status) === filterStatus;
    });

  const sortedHalls = [...filteredHalls].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let valA, valB;
    switch (sortConfig.key) {
      case "name":
        valA = a.name?.toLowerCase() ?? "";
        valB = b.name?.toLowerCase() ?? "";
        break;
      case "type":
        valA = (a.type_id?.name ?? "").toLowerCase();
        valB = (b.type_id?.name ?? "").toLowerCase();
        break;
      case "max_tables":
        valA = Number(a.max_tables) || 0;
        valB = Number(b.max_tables) || 0;
        break;
      case "status":
        valA = statusLabel[a.status] ?? a.status ?? "";
        valB = statusLabel[b.status] ?? b.status ?? "";
        break;
      default:
        return 0;
    }
    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedHalls.length / itemsPerPage);
  const currentHalls = sortedHalls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 uppercase">
          QUẢN LÝ SẢNH
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          {/* Search */}
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

          {/* --- FILTER DROPDOWN --- */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap
                ${
                  filterStatus !== "all"
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
            >
              <Filter size={15} />
              {filterStatus !== "all" ? (
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${activeFilterOption?.dot}`}
                  />
                  {activeFilterOption?.label}
                </span>
              ) : (
                "Lọc trạng thái"
              )}
              <ChevronDown
                size={14}
                className={`transition-transform ${filterOpen ? "rotate-180" : ""}`}
              />
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Lọc theo trạng thái
                  </p>
                </div>
                {FILTER_STATUS_OPTIONS.map((opt) => {
                  const isActive = filterStatus === opt.value;
                  // đếm số lượng cho mỗi option
                  const count =
                    opt.value === "all"
                      ? halls.filter((h) =>
                          h.name.toLowerCase().includes(search.toLowerCase()),
                        ).length
                      : halls
                          .filter((h) =>
                            h.name.toLowerCase().includes(search.toLowerCase()),
                          )
                          .filter(
                            (h) => normalizeStatus(h.status) === opt.value,
                          ).length;

                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelectFilter(opt.value)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                        ${
                          isActive
                            ? "bg-amber-50 text-amber-700 font-medium"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        {opt.dot && (
                          <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                        )}
                        {opt.label}
                      </span>
                      <span className="flex items-center gap-2">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                          ${isActive ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {count}
                        </span>
                        {isActive && (
                          <Check size={13} className="text-amber-500" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* --- SORT DROPDOWN --- */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap
                ${
                  sortConfig.key
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
            >
              <ArrowUpDown size={15} />
              {sortConfig.key ? (
                <span className="flex items-center gap-1">
                  {activeSortOption?.label}
                  <span className="text-indigo-400">·</span>
                  {dirLabel.icon}
                </span>
              ) : (
                "Sắp xếp"
              )}
              <ChevronDown
                size={14}
                className={`transition-transform ${sortOpen ? "rotate-180" : ""}`}
              />
            </button>

            {sortOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Sắp xếp theo
                  </p>
                </div>
                {SORT_OPTIONS.map((opt) => {
                  const isNumeric = opt.key === "max_tables";
                  const dLabel = isNumeric
                    ? DIRECTION_LABEL_NUMBER
                    : DIRECTION_LABEL;
                  return (
                    <div key={opt.key}>
                      <p className="px-3 pt-2 pb-1 text-xs font-medium text-slate-500">
                        {opt.label}
                      </p>
                      {["asc", "desc"].map((dir) => {
                        const isActive =
                          sortConfig.key === opt.key &&
                          sortConfig.direction === dir;
                        return (
                          <button
                            key={dir}
                            onClick={() => handleSelectSort(opt.key, dir)}
                            className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors
                              ${
                                isActive
                                  ? "bg-indigo-50 text-indigo-700 font-medium"
                                  : "text-slate-600 hover:bg-slate-50"
                              }`}
                          >
                            <span className="flex items-center gap-2">
                              {dLabel[dir].icon}
                              {dLabel[dir].text}
                            </span>
                            {isActive && (
                              <Check size={13} className="text-indigo-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
                {sortConfig.key && (
                  <>
                    <div className="border-t border-slate-100 mt-1" />
                    <button
                      onClick={handleClearSort}
                      className="w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                    >
                      Xoá sắp xếp
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Thêm sảnh */}
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
          Tổng số sảnh: {sortedHalls.length}
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
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="py-4 px-4 font-medium text-slate-800 whitespace-nowrap">
                  {hall.name}
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {hall.type_id?.name || "-"}
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {hall.max_tables}
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${statusStyle[hall.status] || ""}`}
                  >
                    {statusLabel[hall.status] || hall.status}
                  </span>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
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
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}
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
