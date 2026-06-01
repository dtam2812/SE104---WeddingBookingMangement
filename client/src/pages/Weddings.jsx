import { useState, useEffect } from "react";
import { Search, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import axios from "../common";

const formatDateVN = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

const statusLabel = {
  cho_xac_nhan: "Chờ xác nhận",
  da_xac_nhan: "Đã xác nhận",
  dang_dien_ra: "Đang diễn ra",
  hoan_thanh: "Kết thúc",
  da_huy: "Đã hủy",
};

const statusList = ["cho_xac_nhan", "da_xac_nhan", "dang_dien_ra", "hoan_thanh", "da_huy"];

export default function Weddings() {
  const [weddings, setWeddings] = useState([]);
  const [halls, setHalls] = useState([]);
  const [hallTypes, setHallTypes] = useState([]);
  const [foods, setFoods] = useState([]);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterHall, setFilterHall] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingWedding, setViewingWedding] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const toDateInput = (d) => d ? d.slice(0, 10) : "";

  const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  const [formData, setFormData] = useState({
    groom_name: "",
    bride_name: "",
    phone: "",
    wedding_date: "",
    shift: "",
    hall_id: "",
    table_count: "",
    reserve_table_count: "0",
    deposit: "",
  });

  const [selectedFoods, setSelectedFoods] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [foodInput, setFoodInput] = useState("");
  const [serviceInput, setServiceInput] = useState("");
  const [serviceQty, setServiceQty] = useState(1);

  const [isSearchHallModalOpen, setIsSearchHallModalOpen] = useState(false);
  const [searchHallData, setSearchHallData] = useState({ date: "", shift: "" });
  const [availableHalls, setAvailableHalls] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchWeddings();
    fetchHalls();
    fetchHallTypes();
    fetchFoods();
    fetchServices();
  }, []);

  const fetchWeddings = async () => {
    const res = await axios.get("/api/weddings");
    const sorted = [...(res.data.data || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    setWeddings(sorted.map((w, idx) => ({ ...w, display_num: idx + 1 })));
  };

  const fetchHalls = async () => {
    const res = await axios.get("/api/halls");
    setHalls(res.data.data || []);
  };

  const fetchHallTypes = async () => {
    const res = await axios.get("/api/hall-types");
    setHallTypes(res.data.data || []);
  };

  const fetchFoods = async () => {
    const res = await axios.get("/api/foods");
    setFoods(res.data.data || []);
  };

  const fetchServices = async () => {
    const res = await axios.get("/api/services");
    setServices(res.data.data || []);
  };

  const handleSearchHall = async (e) => {
    e.preventDefault();
    const res = await axios.get(
      `/api/halls/available?date=${searchHallData.date}&shift=${searchHallData.shift}`,
    );
    setAvailableHalls(res.data.data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.phone && formData.phone.length !== 10) {
      toast.error("Số điện thoại phải có đúng 10 chữ số!");
      return;
    }
    try {
      // ── Validate deposit <= tổng tiệc ──────────────────────────────────────
      const t = Number(formData.table_count) || 0;
      const foodPerTable = selectedFoods.reduce((s, f) => s + (f.booked_price || f.price || 0), 0);
      const foodTotal = foodPerTable * t;
      const serviceTotal = selectedServices.reduce(
        (s, sv) => s + ((sv.booked_price || sv.price || 0) * (sv.quantity || 1)),
        0,
      );
      const selHall = halls.find((h) => h.id.toString() === formData.hall_id);
      
      let pricePerTable = 0;
      if (formData.hall_min_price !== undefined && formData.hall_min_price !== null && formData.hall_min_price !== "") {
        pricePerTable = Number(formData.hall_min_price);
      } else {
        pricePerTable = selHall?.type_id?.min_price || 0;
      }
      
      const hallTotal = pricePerTable * t;
      const total = foodTotal + serviceTotal + hallTotal;
      const deposit = Number(formData.deposit) || 0;

      if (total > 0 && deposit > total) {
        toast.error(
          `Tiền đặt cọc (${deposit.toLocaleString("vi-VN")} đ) không được vượt quá tổng tiền tiệc (${total.toLocaleString("vi-VN")} đ)!`,
        );
        return;
      }

      const payload = {
        ...formData,
        foods: selectedFoods,
        services: selectedServices,
      };
      if (editingId) {
        await axios.put(`/api/weddings/${editingId}`, payload);
      } else {
        await axios.post("/api/weddings", payload);
      }
      setIsModalOpen(false);
      fetchWeddings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu tiệc cưới!");
    }
  };

  const handleEdit = (wedding) => {
    setEditingId(wedding.id);
    setFormData({
      groom_name: wedding.groom_name,
      bride_name: wedding.bride_name,
      phone: wedding.phone,
      wedding_date: toDateInput(wedding.wedding_date),
      shift: wedding.shift,
      hall_id: wedding.hall_id ? wedding.hall_id.toString() : "",
      table_count: wedding.table_count.toString(),
      reserve_table_count: wedding.reserve_table_count.toString(),
      deposit: wedding.deposit.toString(),
      hall_min_price: wedding.hall_min_price,
    });
    setSelectedFoods(wedding.foods || []);
    setSelectedServices(wedding.services || []);
    setIsModalOpen(true);
  };

  const handleView = (wedding) => {
    setViewingWedding(wedding);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa tiệc cưới này?")) {
      try {
        await axios.delete(`/api/weddings/${id}`);
        fetchWeddings();
      } catch (err) {
        toast.error(err.response?.data?.message || "Có lỗi xảy ra khi xóa tiệc cưới!");
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    const tomorrow = getTomorrow();
    setFormData({
      groom_name: "",
      bride_name: "",
      phone: "",
      wedding_date: "",
      shift: "",
      hall_id: "",
      table_count: "",
      reserve_table_count: "0",
      deposit: "",
    });
    setSelectedFoods([]);
    setSelectedServices([]);
    setIsModalOpen(true);
  };

  const addFood = () => {
    const food = foods.find((f) => f.id.toString() === foodInput);
    if (food && !selectedFoods.find((f) => f.food_id === food.id || f.id === food.id)) {
      setSelectedFoods([...selectedFoods, { food_id: food.id, name: food.name, price: food.price, quantity: 1 }]);
    }
    setFoodInput("");
  };

  const addService = () => {
    const service = services.find((s) => s.id.toString() === serviceInput);
    if (service && !selectedServices.find((s) => s.service_id === service.id || s.id === service.id)) {
      setSelectedServices([
        ...selectedServices,
        { service_id: service.id, name: service.name, price: service.price, quantity: serviceQty },
      ]);
    }
    setServiceInput("");
    setServiceQty(1);
  };

  const filteredWeddings = weddings.filter((w) => {
    const matchSearch =
      w.groom_name.toLowerCase().includes(search.toLowerCase()) ||
      w.bride_name.toLowerCase().includes(search.toLowerCase()) ||
      w.phone.includes(search) ||
      (w.hall_name || "").toLowerCase().includes(search.toLowerCase());

    let matchMonth = true,
      matchYear = true,
      matchDate = true,
      matchHall = true;

    if (w.wedding_date) {
      const dateObj = new Date(w.wedding_date);
      if (filterMonth)
        matchMonth = (dateObj.getMonth() + 1).toString() === filterMonth;
      if (filterYear)
        matchYear = dateObj.getFullYear().toString() === filterYear;
      if (filterDate) matchDate = w.wedding_date.slice(0, 10) === filterDate;
    }
    if (filterHall)
      matchHall = (w.hall_id || "").toString() === filterHall.toString();
    const matchStatus = filterStatus ? w.status === filterStatus : true;

    return matchSearch && matchMonth && matchYear && matchDate && matchHall && matchStatus;
  });

  const totalPages = Math.ceil(filteredWeddings.length / itemsPerPage);
  const currentWeddings = filteredWeddings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Tính tổng tiền tiệc
  const calcTotal = (wedding) => {
    if (!wedding) return 0;
    const foodTotal = (wedding.foods || []).reduce(
      (sum, f) => sum + (f.booked_price || f.price || 0),
      0,
    );
    const serviceTotal = (wedding.services || []).reduce(
      (sum, s) => sum + (s.booked_price || s.price || 0) * (s.quantity || 1),
      0,
    );
    const tableTotal = (wedding.table_count || 0) * foodTotal;
    const selHall = halls.find((h) => h.id.toString() === wedding.hall_id?.toString());
    // type_id đã được populate → chứa { _id, name, min_price }
    const hallTotal = (selHall?.type_id?.min_price || 0) * (wedding.table_count || 0);
    return serviceTotal + tableTotal + hallTotal;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 uppercase">
          QUẢN LÝ ĐẶT TIỆC CƯỚI
        </h1>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Tìm kiếm tiệc..."
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
          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
            title="Ngày tổ chức"
          />
          <select
            value={filterHall}
            onChange={(e) => {
              setFilterHall(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
          >
            <option value="">Tất cả sảnh</option>
            {halls.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            {statusList.map((s) => (
              <option key={s} value={s}>{statusLabel[s]}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearchHallData({ date: "", shift: "" });
              setAvailableHalls(null);
              setIsSearchHallModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm"
          >
            <Search size={16} /> Tra cứu sảnh trống
          </button>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm"
          >
            <Plus size={16} /> Thêm Tiệc Cưới
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-slate-800">
          Danh sách tiệc cưới
        </h2>
        <span className="text-sm font-medium text-slate-600">
          Tổng số tiệc: {filteredWeddings.length}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <th className="py-4 px-4 font-semibold">Mã tiệc</th>
              <th className="py-4 px-4 font-semibold">Chú rể</th>
              <th className="py-4 px-4 font-semibold">Cô dâu</th>
              <th className="py-4 px-4 font-semibold">SĐT</th>
              <th className="py-4 px-4 font-semibold">Sảnh</th>
              <th className="py-4 px-4 font-semibold">Ngày</th>
              <th className="py-4 px-4 font-semibold">Ca</th>
              <th className="py-4 px-4 font-semibold">Số bàn</th>
              <th className="py-4 px-4 font-semibold">Trạng thái</th>
              <th className="py-4 px-4 font-semibold text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentWeddings.map((wedding) => (
              <tr
                key={wedding.id}
                className="hover:bg-slate-50 transition-colors text-sm"
              >
                <td className="py-4 px-4 font-medium text-slate-800 whitespace-nowrap">
                  TC{String(wedding.display_num).padStart(3, "0")}
                </td>
                <td className="py-4 px-4 text-slate-800 whitespace-nowrap">
                  {wedding.groom_name}
                </td>
                <td className="py-4 px-4 text-slate-800 whitespace-nowrap">
                  {wedding.bride_name}
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">{wedding.phone}</td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {wedding.hall_name}
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {formatDateVN(wedding.wedding_date)}
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">{wedding.shift}</td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {wedding.table_count}
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <select
                    value={wedding.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      try {
                        const res = await axios.put(`/api/weddings/${wedding.id}`, { status: newStatus });
                        toast.success(res.data.message || `Cập nhật trạng thái → ${statusLabel[newStatus]}`);
                        fetchWeddings();
                      } catch (err) {
                        toast.error(err.response?.data?.message || "Lỗi cập nhật trạng thái!");
                      }
                    }}
                    className={`text-xs font-medium rounded px-1 py-1 border ${
                      wedding.status === "cho_xac_nhan" ? "bg-amber-50 text-amber-600 border-amber-200" :
                      wedding.status === "da_xac_nhan" ? "bg-blue-50 text-blue-600 border-blue-200" :
                      wedding.status === "dang_dien_ra" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      wedding.status === "hoan_thanh" ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                      wedding.status === "da_huy" ? "bg-red-50 text-red-500 border-red-200" :
                      "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    {statusList.map((s) => (
                      <option key={s} value={s}>{statusLabel[s]}</option>
                    ))}
                  </select>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleView(wedding)}
                      className="px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-medium transition-colors"
                    >
                      Xem
                    </button>
                    {user?.role === "admin" && (
                      <>
                        <button
                          onClick={() => handleEdit(wedding)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(wedding.id)}
                          className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium transition-colors"
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {currentWeddings.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500 whitespace-nowrap">
                  Không tìm thấy tiệc cưới nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* ===================== ADD/EDIT MODAL ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Chỉnh Sửa Tiệc Cưới" : "Thêm Tiệc Cưới Mới"}
              </h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form
                id="weddingForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tên chú rể
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.groom_name}
                      onChange={(e) =>
                        setFormData({ ...formData, groom_name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tên cô dâu
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.bride_name}
                      onChange={(e) =>
                        setFormData({ ...formData, bride_name: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setFormData({ ...formData, phone: val });
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ngày đãi tiệc
                    </label>
                    <input
                      type="date"
                      required
                      min={getTomorrow()}
                      value={formData.wedding_date}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          wedding_date: val,
                        });
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ca
                    </label>
                    <select
                      required
                      value={formData.shift}
                      onChange={(e) =>
                        setFormData({ ...formData, shift: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    >
                      <option value="">Chọn ca</option>
                      <option value="Trưa">Trưa</option>
                      <option value="Tối">Tối</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Sảnh
                    </label>
                    <select
                      required
                      value={formData.hall_id}
                      onChange={(e) =>
                        setFormData({ ...formData, hall_id: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    >
                      <option value="">Chọn sảnh</option>
                      {halls
                        .filter((h) => h.status !== "unavailable")
                        .filter((h) => {
                          if (!formData.wedding_date || !formData.shift) return true;
                          return !weddings.find(
                            (w) =>
                              w.hall_id === h.id &&
                              String(w.id) !== String(editingId) &&
                              w.wedding_date?.slice(0, 10) === formData.wedding_date &&
                              w.shift === formData.shift &&
                              w.status !== "da_huy",
                          );
                        })
                        .map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} (Tối đa {h.max_tables} bàn)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Số lượng bàn
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.table_count}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          table_count: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Số bàn dự trữ
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.reserve_table_count}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reserve_table_count: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Thực đơn */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    Thực đơn
                  </h3>
                  <div className="flex gap-3 mb-4">
                    <select
                      value={foodInput}
                      onChange={(e) => setFoodInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    >
                      <option value="">Chọn món ăn</option>
                      {foods
                        .filter((f) => !selectedFoods.find((sf) => sf.food_id === f.id || sf.id === f.id))
                        .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} - {f.price.toLocaleString("vi-VN")} đ
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addFood}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Thêm món
                    </button>
                  </div>
                  {selectedFoods.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <ul className="space-y-2">
                        {selectedFoods.map((f, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm"
                          >
                            <span className="font-medium">{f.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-emerald-600 font-medium">
                                {(f.booked_price || f.price).toLocaleString(
                                  "vi-VN",
                                )}{" "}
                                đ
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedFoods(
                                    selectedFoods.filter((_, i) => i !== idx),
                                  )
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Dịch vụ */}
                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">
                    Dịch vụ
                  </h3>
                  <div className="flex gap-3 mb-4">
                    <select
                      value={serviceInput}
                      onChange={(e) => setServiceInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    >
                      <option value="">Chọn dịch vụ</option>
                      {services
                        .filter((s) => !selectedServices.find((ss) => ss.service_id === s.id || ss.id === s.id))
                        .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} - {s.price.toLocaleString("vi-VN")} đ
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={serviceQty}
                      onChange={(e) => setServiceQty(parseInt(e.target.value))}
                      className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                      placeholder="SL"
                    />
                    <button
                      type="button"
                      onClick={addService}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                    >
                      Thêm DV
                    </button>
                  </div>
                  {selectedServices.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <ul className="space-y-2">
                        {selectedServices.map((s, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm"
                          >
                            <span className="font-medium">
                              {s.name} (x{s.quantity})
                            </span>
                            <div className="flex items-center gap-4">
                              <span className="text-emerald-600 font-medium">
                                {(
                                  (s.booked_price || s.price) * s.quantity
                                ).toLocaleString("vi-VN")}{" "}
                                đ
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedServices(
                                    selectedServices.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  )
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Tiền cọc + Ngày hạn thanh toán + Tổng tiệc */}
                <div className="border-t border-slate-100 pt-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tiền đặt cọc (VNĐ)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formData.deposit ? Number(formData.deposit).toLocaleString("vi-VN") : ""}
                      onChange={(e) =>
                        setFormData({ ...formData, deposit: e.target.value.replace(/\D/g, "") })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    />
                  </div>

                  {(() => {
                    const t = Number(formData.table_count) || 0;
                    const foodPerTable = selectedFoods.reduce((s, f) => s + (f.booked_price || f.price || 0), 0);
                    const foodTotal = foodPerTable * t;
                    const serviceTotal = selectedServices.reduce((s, sv) => s + ((sv.booked_price || sv.price || 0) * (sv.quantity || 1)), 0);
                    const selHall = halls.find((h) => h.id.toString() === formData.hall_id);
                    
                    let pricePerTable = 0;
                    if (formData.hall_min_price !== undefined && formData.hall_min_price !== null && formData.hall_min_price !== "") {
                      pricePerTable = Number(formData.hall_min_price);
                    } else {
                      pricePerTable = selHall?.type_id?.min_price || 0;
                    }
                    
                    const hallTotal = pricePerTable * t;
                    const total = foodTotal + serviceTotal + hallTotal;
                    const deposit = Number(formData.deposit) || 0;
                    return (
                      <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Tiền thức ăn</span>
                          <span className="font-semibold text-indigo-900">{foodTotal.toLocaleString("vi-VN")} đ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Tiền dịch vụ</span>
                          <span className="font-semibold text-indigo-900">{serviceTotal.toLocaleString("vi-VN")} đ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-700">Tiền bàn ({pricePerTable.toLocaleString("vi-VN")} đ × {t} bàn)</span>
                          <span className="font-semibold text-indigo-900">{hallTotal.toLocaleString("vi-VN")} đ</span>
                        </div>
                        <div className="border-t border-indigo-200 pt-1 mt-1 flex justify-between font-bold text-base">
                          <span className="text-indigo-800">Tổng tiệc</span>
                          <span className="text-indigo-900">{total.toLocaleString("vi-VN")} đ</span>
                        </div>
                        {deposit > 0 && (
                          <div className="flex justify-between text-amber-700">
                            <span>Đặt cọc</span>
                            <span className="font-semibold">-{deposit.toLocaleString("vi-VN")} đ</span>
                          </div>
                        )}
                        {deposit > 0 && (
                          <div className="border-t border-indigo-200 pt-1 mt-1 flex justify-between font-bold">
                            <span className={total >= deposit ? "text-indigo-800" : "text-red-600"}>Còn lại</span>
                            <span className={total >= deposit ? "text-indigo-900" : "text-red-600"}>
                              {Math.max(0, total - deposit).toLocaleString("vi-VN")} đ
                            </span>
                          </div>
                        )}
                        {deposit > total && (
                          <p className="text-xs text-red-500 mt-1">⚠ Tiền cọc lớn hơn tổng tiệc!</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 flex-shrink-0 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="weddingForm"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
              >
                Lưu Tiệc Cưới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW MODAL ===================== */}
      {isViewModalOpen && viewingWedding && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">
                  Chi tiết tiệc cưới
                </p>
                <h2 className="text-xl font-bold text-slate-800">
                  TC{String(viewingWedding.display_num).padStart(3, "0")} —{" "}
                  {viewingWedding.groom_name} &amp; {viewingWedding.bride_name}
                </h2>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Thông tin cơ bản */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Thông tin chung
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Chú rể", value: viewingWedding.groom_name },
                    { label: "Cô dâu", value: viewingWedding.bride_name },
                    { label: "Số điện thoại", value: viewingWedding.phone },
                    {
                      label: "Ngày tiệc",
                      value: formatDateVN(viewingWedding.wedding_date),
                    },
                    { label: "Ca", value: viewingWedding.shift },
                    { label: "Sảnh", value: viewingWedding.hall_name },
                    {
                      label: "Số bàn",
                      value: `${viewingWedding.table_count} bàn${
                        viewingWedding.reserve_table_count > 0
                          ? ` (+${viewingWedding.reserve_table_count} dự trữ)`
                          : ""
                      }`,
                    },
                    {
                      label: "Trạng thái",
                      value: statusLabel[viewingWedding.status] || viewingWedding.status || "-",
                      highlight: true,
                    },
                    {
                      label: "Tiền đặt cọc",
                      value: `${viewingWedding.deposit.toLocaleString("vi-VN")} đ`,
                      highlight: true,
                    },
                  ].map(({ label, value, highlight }) => (
                    <div
                      key={label}
                      className="bg-slate-50 rounded-xl p-3 flex flex-col gap-0.5"
                    >
                      <span className="text-xs text-slate-400">{label}</span>
                      <span
                        className={`font-semibold text-sm ${
                          highlight ? "text-emerald-600" : "text-slate-800"
                        }`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thực đơn */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Thực đơn
                </h3>
                {viewingWedding.foods && viewingWedding.foods.length > 0 ? (
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Tên món</th>
                          <th className="py-3 px-4 font-semibold text-right">
                            Đơn giá / bàn
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingWedding.foods.map((f, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-800">
                              {f.name}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-slate-800">
                              {(f.booked_price || f.price).toLocaleString(
                                "vi-VN",
                              )}{" "}
                              đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-sm">
                    Chưa có món ăn
                  </p>
                )}
              </div>

              {/* Dịch vụ */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Dịch vụ
                </h3>
                {viewingWedding.services &&
                viewingWedding.services.length > 0 ? (
                  <div className="rounded-xl border border-slate-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                          <th className="py-3 px-4 font-semibold">
                            Tên dịch vụ
                          </th>
                          <th className="py-3 px-4 font-semibold text-center">
                            Số lượng
                          </th>
                          <th className="py-3 px-4 font-semibold text-right">
                            Thành tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {viewingWedding.services.map((s, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-3 px-4 text-slate-800">
                              {s.name}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-600">
                              {s.quantity}
                            </td>
                            <td className="py-3 px-4 text-right font-medium text-slate-800">
                              {(
                                (s.booked_price || s.price) * s.quantity
                              ).toLocaleString("vi-VN")}{" "}
                              đ
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-sm">
                    Chưa có dịch vụ
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== SEARCH HALL MODAL ===================== */}
      {isSearchHallModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                Tra Cứu Sảnh Trống
              </h2>
              <button
                onClick={() => setIsSearchHallModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSearchHall} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ngày
                  </label>
                  <input
                    type="date"
                    required
                    value={searchHallData.date}
                    onChange={(e) =>
                      setSearchHallData({
                        ...searchHallData,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ca
                  </label>
                  <select
                    required
                    value={searchHallData.shift}
                    onChange={(e) =>
                      setSearchHallData({
                        ...searchHallData,
                        shift: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                  >
                    <option value="">Chọn ca</option>
                    <option value="Trưa">Trưa</option>
                    <option value="Tối">Tối</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
                >
                  Tra cứu
                </button>
              </form>

              {availableHalls !== null && (
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">
                    Kết quả tra cứu:
                  </h3>
                  {availableHalls.length > 0 ? (
                    <ul className="space-y-2">
                      {availableHalls.map((h) => (
                        <li
                          key={h.id}
                          className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100 flex justify-between items-center"
                        >
                          <span className="font-medium">{h.name}</span>
                          <span className="text-sm">
                            Tối đa {h.max_tables} bàn
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center">
                      Không có sảnh trống trong thời gian này.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
