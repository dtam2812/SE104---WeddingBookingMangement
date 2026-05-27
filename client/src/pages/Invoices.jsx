import { useState, useEffect } from "react";
import { Search, Plus, X, CreditCard, RotateCcw } from "lucide-react";
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

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => (n != null ? Number(n).toLocaleString("vi-VN") + " đ" : "-");

const calcLateDays = (weddingDateStr) => {
  const wedding = new Date(weddingDateStr);
  // Penalty starts 1 day after wedding
  const penaltyStart = new Date(wedding);
  penaltyStart.setDate(penaltyStart.getDate() + 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today - penaltyStart;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
};

// ────────────────────────────────────────────────────────────────────────────

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [weddings, setWeddings] = useState([]);
  const [penaltyRate, setPenaltyRate] = useState(0.01); // fallback 1%
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // ── Create modal ──────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    wedding_id: "",
    table_count: "",
    apply_penalty: false,
  });

  // ── Payment modal ─────────────────────────────────────────────────────────
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchInvoices();
    fetchWeddings();
    fetchPenaltyRate();
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

  const fetchPenaltyRate = async () => {
    try {
      const res = await axios.get("/api/rules");
      const rules = res.data.data || [];
      const rule = rules.find((r) => r.code === "PENALTY_RATE");
      if (rule) setPenaltyRate(Number(rule.value));
    } catch {
      // keep fallback
    }
  };

  // ── Create invoice ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("/api/invoices", formData);
    setIsModalOpen(false);
    fetchInvoices();
  };

  const openNewModal = () => {
    setFormData({ wedding_id: "", table_count: "", apply_penalty: false });
    setIsModalOpen(true);
  };

  // ── Payment modal helpers ─────────────────────────────────────────────────
  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount("");
    setPaymentError("");
    setIsPaymentModalOpen(true);
  };

  // Pre-compute values shown in payment modal
  const paymentCalc = (() => {
    if (!selectedInvoice) return null;
    const already_paid = selectedInvoice.paid_amount || 0;
    const still_owed = selectedInvoice.remaining_amount - already_paid;
    const late_days = selectedInvoice.apply_penalty
      ? calcLateDays(selectedInvoice.wedding_date)
      : 0;
    const est_penalty =
      late_days > 0 ? Math.round(still_owed * penaltyRate * late_days) : 0;
    const grand_total = still_owed + est_penalty;
    const paying_now = Number(paymentAmount.replace(/\D/g, "")) || 0;
    const after_payment = grand_total - paying_now;
    return {
      already_paid,
      still_owed,
      late_days,
      est_penalty,
      grand_total,
      paying_now,
      after_payment,
    };
  })();

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentError("");
    const raw = Number(paymentAmount.replace(/\D/g, ""));
    if (!raw || raw <= 0) {
      setPaymentError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    if (raw > (paymentCalc?.grand_total || 0)) {
      setPaymentError("Số tiền thanh toán vượt quá tổng nợ.");
      return;
    }
    await axios.put(`/api/invoices/${selectedInvoice.id}`, {
      paid_amount_now: raw,
    });
    setIsPaymentModalOpen(false);
    fetchInvoices();
  };

  // ── Undo & Delete ─────────────────────────────────────────────────────────
  const handleUndoPayment = async (invoice) => {
    if (confirm("Hoàn tác tất cả thanh toán của hóa đơn này?")) {
      await axios.put(`/api/invoices/${invoice.id}`, {
        payment_date: null,
        paid_amount: 0,
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

  // ── Filter & Paginate ─────────────────────────────────────────────────────
  const filteredInvoices = invoices.filter((i) => {
    const idStr = `HD${(i.id || "").toString().padStart(3, "0")}`.toLowerCase();
    const weddingIdStr =
      `TC${(i.wedding_id || "").toString().padStart(3, "0")}`.toLowerCase();
    const matchSearch =
      i.groom_name?.toLowerCase().includes(search.toLowerCase()) ||
      i.bride_name?.toLowerCase().includes(search.toLowerCase()) ||
      idStr.includes(search.toLowerCase()) ||
      weddingIdStr.includes(search.toLowerCase());
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <th className="py-4 px-4 font-semibold">MÃ HĐ</th>
              <th className="py-4 px-4 font-semibold">MÃ TIỆC</th>
              <th className="py-4 px-4 font-semibold">CHÚ RỂ / CÔ DÂU</th>
              <th className="py-4 px-4 font-semibold">NGÀY TIỆC</th>
              <th className="py-4 px-4 font-semibold">ĐÃ TRẢ</th>
              <th className="py-4 px-4 font-semibold">CÒN NỢ</th>
              <th className="py-4 px-4 font-semibold">TRỄ (NGÀY)</th>
              <th className="py-4 px-4 font-semibold">TIỀN PHẠT</th>
              <th className="py-4 px-4 font-semibold">TRẠNG THÁI</th>
              <th className="py-4 px-4 font-semibold text-center">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentInvoices.map((invoice) => {
              const paid = invoice.paid_amount || 0;
              const stillOwed = invoice.remaining_amount - paid;
              return (
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
                  <td className="py-4 px-4 font-medium text-emerald-600">
                    {fmt(paid)}
                  </td>
                  <td className="py-4 px-4 font-medium text-slate-800">
                    {stillOwed > 0 ? (
                      fmt(stillOwed)
                    ) : (
                      <span className="text-emerald-600">Đã đủ</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-slate-600">
                    {invoice.late_days > 0 ? invoice.late_days : "-"}
                  </td>
                  <td className="py-4 px-4 text-red-500 font-medium">
                    {invoice.penalty_amount > 0
                      ? fmt(invoice.penalty_amount)
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
                      {invoice.status === "paid" ? (
                        <button
                          onClick={() => handleUndoPayment(invoice)}
                          className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded text-xs font-medium transition-colors"
                        >
                          <RotateCcw size={12} /> Hoàn tác
                        </button>
                      ) : (
                        <button
                          onClick={() => openPaymentModal(invoice)}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded text-xs font-medium transition-colors"
                        >
                          <CreditCard size={12} /> Thanh toán
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
              );
            })}
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

      {/* ── CREATE INVOICE MODAL ───────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                Lập Hóa Đơn Mới
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Wedding select */}
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
                      ...formData,
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

              {/* Table count */}
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

              {/* ── PENALTY TOGGLE ── */}
              <div className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    Áp dụng tiền phạt trễ hạn
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tính phạt bắt đầu từ <strong>1 ngày sau</strong> khi diễn ra
                    đám cưới. Mức phạt:{" "}
                    <strong>{(penaltyRate * 100).toFixed(0)}%</strong>/ngày trên
                    số tiền còn nợ.
                  </p>
                </div>
                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      apply_penalty: !formData.apply_penalty,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    formData.apply_penalty ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                      formData.apply_penalty ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-3 pt-2">
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

      {/* ── PAYMENT MODAL ─────────────────────────────────────────────────── */}
      {isPaymentModalOpen && selectedInvoice && paymentCalc && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Ghi Nhận Thanh Toán
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {selectedInvoice.groom_name} &amp;{" "}
                  {selectedInvoice.bride_name}
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary rows */}
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <Row
                  label="Tổng tiền hóa đơn"
                  value={fmt(selectedInvoice.total_amount)}
                />
                <Row label="Đặt cọc" value={fmt(selectedInvoice.deposit)} />
                <Row
                  label="Số tiền còn nợ"
                  value={fmt(selectedInvoice.remaining_amount)}
                />
                {paymentCalc.already_paid > 0 && (
                  <Row
                    label="Đã thanh toán trước"
                    value={fmt(paymentCalc.already_paid)}
                    highlight="emerald"
                  />
                )}
                <div className="border-t border-slate-200 pt-2 mt-2" />
                <Row
                  label="Cần thanh toán"
                  value={fmt(paymentCalc.still_owed)}
                  bold
                />

                {selectedInvoice.apply_penalty && (
                  <>
                    <div className="border-t border-slate-200 pt-2 mt-2" />
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                      <span>⚠</span>
                      <span>Hóa đơn này áp dụng phạt trễ hạn</span>
                    </div>
                    <Row
                      label={`Số ngày trễ (từ ${selectedInvoice.wedding_date?.slice(0, 10)})`}
                      value={
                        paymentCalc.late_days > 0
                          ? `${paymentCalc.late_days} ngày`
                          : "Chưa trễ"
                      }
                      highlight={paymentCalc.late_days > 0 ? "red" : undefined}
                    />
                    <Row
                      label={`Tiền phạt ước tính (${(penaltyRate * 100).toFixed(0)}%/ngày)`}
                      value={
                        paymentCalc.est_penalty > 0
                          ? fmt(paymentCalc.est_penalty)
                          : "-"
                      }
                      highlight={
                        paymentCalc.est_penalty > 0 ? "red" : undefined
                      }
                    />
                    <div className="border-t border-slate-200 pt-2 mt-2" />
                    <Row
                      label="Tổng cộng cần trả (gồm phạt)"
                      value={fmt(paymentCalc.grand_total)}
                      bold
                    />
                  </>
                )}
              </div>

              {/* Amount input */}
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Số tiền khách thanh toán lần này
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Nhập số tiền..."
                    value={paymentAmount}
                    onChange={(e) => {
                      // Allow only digits
                      const raw = e.target.value.replace(/\D/g, "");
                      setPaymentAmount(
                        raw ? Number(raw).toLocaleString("vi-VN") : "",
                      );
                      setPaymentError("");
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                    required
                  />
                  {paymentError && (
                    <p className="text-xs text-red-500 mt-1">{paymentError}</p>
                  )}
                  {/* Quick-fill button */}
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentAmount(
                        paymentCalc.grand_total.toLocaleString("vi-VN"),
                      )
                    }
                    className="mt-1.5 text-xs text-indigo-600 hover:underline"
                  >
                    Điền đủ số tiền ({fmt(paymentCalc.grand_total)})
                  </button>
                </div>

                {/* After-payment preview */}
                {paymentCalc.paying_now > 0 && (
                  <div
                    className={`rounded-lg px-4 py-3 text-sm font-medium ${
                      paymentCalc.after_payment <= 0
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {paymentCalc.after_payment <= 0
                      ? "✓ Thanh toán đầy đủ — trạng thái sẽ chuyển thành Đã thanh toán"
                      : `Còn nợ sau khi thanh toán: ${fmt(paymentCalc.after_payment)} — trạng thái sẽ là Thanh toán một phần`}
                  </div>
                )}

                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-6 py-2 text-slate-600 font-medium bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    Xác nhận thanh toán
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Small helper component for summary rows
function Row({ label, value, bold, highlight }) {
  const valueClass =
    highlight === "emerald"
      ? "text-emerald-600"
      : highlight === "red"
        ? "text-red-500"
        : "text-slate-800";
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span
        className={`${bold ? "font-bold text-base" : "font-medium"} ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}
