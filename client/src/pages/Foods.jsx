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

// --- Sort config ---
const SORT_OPTIONS = [
  { key: "name", label: "Tên món ăn" },
  { key: "price", label: "Đơn giá" },
];
const DIRECTION_LABEL = {
  asc: { text: "A → Z", icon: <ArrowUp size={13} /> },
  desc: { text: "Z → A", icon: <ArrowDown size={13} /> },
};
const DIRECTION_LABEL_NUMBER = {
  asc: { text: "Tăng dần", icon: <ArrowUp size={13} /> },
  desc: { text: "Giảm dần", icon: <ArrowDown size={13} /> },
};

// --- Filter config ---
const FOOD_TYPES = ["Khai vị", "Món chính", "Tráng miệng", "Đồ uống"];
const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả loại" },
  ...FOOD_TYPES.map((t) => ({ value: t, label: t })),
];

// --- Pagination với dấu "..." ---
const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push("...");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
};

export default function Foods() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    foodType: "Món chính",
  });
  const [error, setError] = useState("");

  // --- Sort state ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  // --- Filter state ---
  const [filterType, setFilterType] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    fetchFoods();
  }, []);

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

  const fetchFoods = async () => {
    const res = await axios.get("/api/foods");
    setFoods(res.data.data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await axios.put(`/api/foods/${editingId}`, formData, authHeader());
        toast.success("Cập nhật món ăn thành công!");
      } else {
        await axios.post("/api/foods", formData, authHeader());
        toast.success("Thêm món ăn mới thành công!");
      }
      setIsModalOpen(false);
      fetchFoods();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleEdit = (food) => {
    setEditingId(food.id);
    setFormData({
      name: food.name,
      price: food.price.toString(),
      foodType: food.foodType || "Món chính",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa món ăn này?")) {
      try {
        await axios.delete(`/api/foods/${id}`, authHeader());
        toast.success("Đã xóa món ăn thành công!");
        fetchFoods();
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Có lỗi xảy ra khi xóa món ăn!",
        );
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: "", price: "", foodType: "Món chính" });
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
    setFilterType(value);
    setFilterOpen(false);
    setCurrentPage(1);
  };

  // Labels
  const activeSortOption = SORT_OPTIONS.find((o) => o.key === sortConfig.key);
  const dirLabel =
    sortConfig.key === "price"
      ? DIRECTION_LABEL_NUMBER[sortConfig.direction]
      : DIRECTION_LABEL[sortConfig.direction];
  const activeFilterOption = FILTER_OPTIONS.find((o) => o.value === filterType);

  // --- Lọc + Sort + Phân trang ---
  const filteredFoods = foods
    .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    .filter((f) => filterType === "all" || f.foodType === filterType);

  const sortedFoods = [...filteredFoods].sort((a, b) => {
    if (!sortConfig.key) return 0;
    let valA, valB;
    if (sortConfig.key === "name") {
      valA = a.name?.toLowerCase() ?? "";
      valB = b.name?.toLowerCase() ?? "";
    } else {
      valA = Number(a.price) || 0;
      valB = Number(b.price) || 0;
    }
    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedFoods.length / itemsPerPage);
  const currentFoods = sortedFoods.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  // Đếm theo loại (dựa trên kết quả search hiện tại, chưa filter type)
  const baseForCount = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 uppercase">
          QUẢN LÝ THỰC ĐƠN
        </h1>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Tìm kiếm món ăn..."
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

          {/* --- FILTER DROPDOWN --- */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap
                ${
                  filterType !== "all"
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
            >
              <Filter size={15} />
              {filterType !== "all"
                ? activeFilterOption?.label
                : "Lọc loại món"}
              <ChevronDown
                size={14}
                className={`transition-transform ${filterOpen ? "rotate-180" : ""}`}
              />
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Lọc theo loại
                  </p>
                </div>
                {FILTER_OPTIONS.map((opt) => {
                  const isActive = filterType === opt.value;
                  const count =
                    opt.value === "all"
                      ? baseForCount.length
                      : baseForCount.filter((f) => f.foodType === opt.value)
                          .length;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelectFilter(opt.value)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                        ${isActive ? "bg-amber-50 text-amber-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      <span>{opt.label}</span>
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
                  const isNumeric = opt.key === "price";
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
                              ${isActive ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
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

          {/* Thêm món ăn */}
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm"
          >
            <Plus size={16} /> Thêm Món Ăn
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-slate-800">
          Danh sách món ăn
        </h2>
        <span className="text-sm font-medium text-slate-600">
          Tổng số món ăn: {sortedFoods.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <th className="py-4 px-4 font-semibold">STT</th>
              <th className="py-4 px-4 font-semibold">TÊN MÓN ĂN</th>
              <th className="py-4 px-4 font-semibold">ĐƠN GIÁ</th>
              <th className="py-4 px-4 font-semibold">LOẠI</th>
              <th className="py-4 px-4 font-semibold text-center">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentFoods.map((food, index) => (
              <tr
                key={food.id}
                className="hover:bg-slate-50 transition-colors text-sm"
              >
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {(currentPage - 1) * itemsPerPage + index + 1}
                </td>
                <td className="py-4 px-4 font-medium text-slate-800 whitespace-nowrap">
                  {food.name}
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {food.price.toLocaleString("vi-VN")} đ
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {food.foodType || "-"}
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(food)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(food.id)}
                      className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {currentFoods.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Không tìm thấy món ăn nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION với dấu "..." --- */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:opacity-50 text-sm"
          >
            «
          </button>

          {pageNumbers.map((page, i) =>
            page === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm select-none"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-slate-800 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ),
          )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded bg-slate-50 text-slate-500 hover:bg-slate-100 disabled:opacity-50 text-sm"
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
                {editingId ? "Chỉnh Sửa Món Ăn" : "Thêm Món Ăn Mới"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên món ăn
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
                  Đơn giá
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={
                    formData.price
                      ? Number(formData.price).toLocaleString("vi-VN")
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Loại
                </label>
                <select
                  value={formData.foodType}
                  onChange={(e) =>
                    setFormData({ ...formData, foodType: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                >
                  {FOOD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-center gap-3 pt-4">
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
