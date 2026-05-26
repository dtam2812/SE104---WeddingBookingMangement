import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import axios from "../common";

const statusLabel = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  partial: "Thanh toán một phần",
};

const statusStyle = {
  paid: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  partial: "bg-amber-50 text-amber-600 border border-amber-200",
  unpaid: "bg-slate-50 text-slate-600 border border-slate-200",
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [weddings, setWeddings] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [formData, setFormData] = useState({
    wedding_id: "",
    table_count: "",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchInvoices();
    fetchWeddings();
  }, []);

  const fetchInvoices = async () => {
    const res = await axios.get("/api/invoices");
    const data = res.data.data || [];
    setInvoices(data.map((inv, idx) => ({ ...inv, display_num: idx + 1 })));
  };

  const fetchWeddings = async () => {
    const res = await axios.get("/api/weddings");
    setWeddings(res.data.data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("/api/invoices", formData);
    setIsModalOpen(false);
    fetchInvoices();
  };

  // Chỉ gửi payment_date + status, backend tự tính late_days và penalty_amount
  const handleConfirmPayment = async (invoice) => {
    if (confirm("Xác nhận thanh toán hóa đơn này?")) {
      const today = new Date().toISOString().split("T")[0];
      await axios.put(`/api/invoices/${invoice.id}`, {
        payment_date: today,
        status: "paid",
      });
      fetchInvoices();
    }
  };

  const handleUndoPayment = async (invoice) => {
    if (confirm("Hoàn tác thanh toán hóa đơn này?")) {
      await axios.put(`/api/invoices/${invoice.id}`, {
        payment_date: null,
        late_days: 0,
        penalty_amount: 0,
        status: "unpaid",
      });
      fetchInvoices();
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa hóa đơn này?")) {
      await axios.delete(`/api/invoices/${id}`);
      fetchInvoices();
    }
  };

  const openNewModal = () => {
    setFormData({ wedding_id: "", table_count: "" });
    setIsModalOpen(true);
  };

  const filteredInvoices = invoices.filter((i) => {
    const idStr = `HD${(i.id || "").toString().padStart(3, "0")}`.toLowerCase();
    const weddingIdStr =
      `TC${(i.wedding_id || "").toString().padStart(3, "0")}`.toLowerCase();

    const matchSearch =
      i.groom_name?.toLowerCase().includes(search.toLowerCase()) ||
      i.bride_name?.toLowerCase().includes(search.toLowerCase()) ||
      idStr.includes(search.toLowerCase()) ||
      weddingIdStr.includes(search.toLowerCase());

    // wedding_date từ MongoDB là ISO string, cần slice lấy phần YYYY-MM-DD
    const matchDate = filterDate
      ? i.wedding_date?.slice(0, 10) === filterDate
      : true;

    const matchStatus = filterStatus ? i.status === filterStatus : true;

    return matchSearch && matchDate && matchStatus;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const currentInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 uppercase">
          QUẢN LÝ HÓA ĐƠN
        </h1>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Tìm kiếm hóa đơn..."
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
            title="Ngày tổ chức tiệc"
          />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="unpaid">Chưa thanh toán</option>
            <option value="paid">Đã thanh toán</option>
            <option value="partial">Thanh toán một phần</option>
          </select>
          <button
            onClick={openNewModal}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm"
          >
            <Plus size={16} /> Lập Hóa Đơn
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-slate-800">
          Danh sách hóa đơn
        </h2>
        <span className="text-sm font-medium text-slate-600">
          Tổng số hóa đơn: {filteredInvoices.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <th className="py-4 px-4 font-semibold">MÃ HĐ</th>
              <th className="py-4 px-4 font-semibold">MÃ TIỆC</th>
              <th className="py-4 px-4 font-semibold">CHÚ RỂ / CÔ DÂU</th>
              <th className="py-4 px-4 font-semibold">NGÀY TIỆC</th>
              <th className="py-4 px-4 font-semibold">NGÀY THANH TOÁN</th>
              <th className="py-4 px-4 font-semibold">TỔNG TIỀN</th>
              <th className="py-4 px-4 font-semibold">TRỄ (NGÀY)</th>
              <th className="py-4 px-4 font-semibold">TIỀN PHẠT</th>
              <th className="py-4 px-4 font-semibold">TRẠNG THÁI</th>
              <th className="py-4 px-4 font-semibold text-center">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentInvoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="hover:bg-slate-50 transition-colors text-sm"
              >
                <td className="py-4 px-4 font-medium text-slate-800">
                  HD{invoice.display_num.toString().padStart(3, "0")}
                </td>
                <td className="py-4 px-4 text-slate-600">
                  TC{(invoice.wedding_id || "").toString().padStart(3, "0")}
                </td>
                <td className="py-4 px-4 text-slate-800">
                  {invoice.groom_name} & {invoice.bride_name}
                </td>
                <td className="py-4 px-4 text-slate-600">
                  {invoice.wedding_date?.slice(0, 10) || "-"}
                </td>
                <td className="py-4 px-4 text-slate-600">
                  {invoice.payment_date
                    ? invoice.payment_date.slice(0, 10)
                    : "-"}
                </td>
                <td className="py-4 px-4 font-medium text-slate-800">
                  {invoice.total_amount?.toLocaleString("vi-VN")} đ
                </td>
                <td className="py-4 px-4 text-slate-600">
                  {invoice.late_days > 0 ? invoice.late_days : "-"}
                </td>
                <td className="py-4 px-4 text-red-500 font-medium">
                  {invoice.penalty_amount > 0
                    ? invoice.penalty_amount.toLocaleString("vi-VN") + " đ"
                    : "-"}
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${statusStyle[invoice.status] || statusStyle.unpaid}`}
                  >
                    {statusLabel[invoice.status] || invoice.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center gap-2">
                    {invoice.payment_date ? (
                      <button
                        onClick={() => handleUndoPayment(invoice)}
                        className="px-3 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded text-xs font-medium transition-colors"
                      >
                        Hoàn tác
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConfirmPayment(invoice)}
                        className="px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-medium transition-colors"
                      >
                        Thanh toán
                      </button>
                    )}
                    {user?.role === "admin" && (
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium transition-colors"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {currentInvoices.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">
                  Không tìm thấy hóa đơn nào.
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
                Lập Hóa Đơn Mới
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Chọn Tiệc Cưới
                </label>
                <select
                  required
                  value={formData.wedding_id}
                  onChange={(e) => {
                    const w = weddings.find(
                      (x) => x.id.toString() === e.target.value,
                    );
                    setFormData({
                      wedding_id: e.target.value,
                      table_count: w ? w.table_count.toString() : "",
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                >
                  <option value="">-- Chọn tiệc --</option>
                  {weddings
                    .filter((w) => !invoices.find((i) => i.wedding_id === w.id))
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        TC{w.id.toString().padStart(3, "0")} - {w.groom_name} &{" "}
                        {w.bride_name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số lượng bàn thực tế
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.table_count}
                  onChange={(e) =>
                    setFormData({ ...formData, table_count: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                />
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
                  Lập hóa đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
