import { useState, useEffect } from "react";
import { Search, Plus, X, CreditCard, RotateCcw, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { toast } from "react-toastify";
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

const calcLateDays = (weddingDateStr, paymentDueDateStr) => {
  const baseDate = paymentDueDateStr || weddingDateStr;
  const [y, m, d] = baseDate.slice(0, 10).split("-");
  // Dùng Date.UTC để tránh lỗi timezone
  const base = new Date(Date.UTC(+y, +m - 1, +d));
  const penaltyStart = new Date(+base);
  penaltyStart.setUTCDate(penaltyStart.getUTCDate() + 1);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diffMs = today - penaltyStart;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
};

function _arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

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
  const [createError, setCreateError] = useState("");
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

  // ── PDF Export modal ──────────────────────────────────────────────────────
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfSelectedId, setPdfSelectedId] = useState("");
  const [pdfError, setPdfError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchInvoices();
    fetchWeddings();
    fetchPenaltyRate();
  }, []);

  const fetchInvoices = async () => {
    const res = await axios.get("/api/invoices");
    const sorted = [...(res.data.data || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    setInvoices(sorted.map((inv, idx) => ({ ...inv, display_num: idx + 1 })));
  };

  const fetchWeddings = async () => {
    const res = await axios.get("/api/weddings");
    const sorted = [...(res.data.data || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    setWeddings(sorted.map((w, idx) => ({ ...w, display_num: idx + 1 })));
  };

  const fetchPenaltyRate = async () => {
  try {
    const res = await axios.get("/api/rules");
    const rules = res.data.data || [];
    
    // Đổi "PENALTY_RATE" thành "TIEN_PHAT" cho khớp với Database
    const rule = rules.find((r) => r.code === "TIEN_PHAT");
    
    if (rule) {
      // Dùng parseFloat để bóc con số 2 ra khỏi chuỗi "2%", sau đó chia 100 để ra 0.02
      const rate = parseFloat(rule.value) / 100;
      if (!isNaN(rate)) {
        setPenaltyRate(rate);
      }
    }
  } catch {
    // keep fallback
  }
};

  // ── Create invoice ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");
    try {
      await axios.post("/api/invoices", formData);
      setIsModalOpen(false);
      fetchInvoices();
    } catch (err) {
      setCreateError(err.response?.data?.message || "Có lỗi xảy ra khi lập hóa đơn!");
    }
  };

  const openNewModal = () => {
    setFormData({ wedding_id: "", table_count: "", apply_penalty: false });
    setCreateError("");
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
    try {
      await axios.put(`/api/invoices/${selectedInvoice.id}`, {
        paid_amount_now: raw,
      });
      setIsPaymentModalOpen(false);
      fetchInvoices();
    } catch (err) {
      setPaymentError(err.response?.data?.message || "Có lỗi xảy ra khi thanh toán!");
    }
  };

  // ── Undo & Delete ─────────────────────────────────────────────────────────
  const handleUndoPayment = async (invoice) => {
    if (confirm("Hoàn tác tất cả thanh toán của hóa đơn này?")) {
      try {
        await axios.put(`/api/invoices/${invoice.id}`, {
          payment_date: null,
          paid_amount: 0,
          late_days: 0,
          penalty_amount: 0,
          status: "unpaid",
        });
        fetchInvoices();
      } catch (err) {
        toast.error(err.response?.data?.message || "Có lỗi xảy ra khi hoàn tác!");
      }
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa hóa đơn này?")) {
      try {
        await axios.delete(`/api/invoices/${id}`);
        fetchInvoices();
      } catch (err) {
        toast.error(err.response?.data?.message || "Có lỗi xảy ra khi xóa hóa đơn!");
      }
    }
  };

  // ── Filter & Paginate ─────────────────────────────────────────────────────
  const filteredInvoices = invoices.filter((i) => {
    const wedding = weddings.find((w) => String(w.id) === String(i.wedding_id));
    const idStr = `HD${(i.id || "").toString().padStart(3, "0")}`.toLowerCase();
    const weddingIdStr = wedding
      ? `TC${String(wedding.display_num).padStart(3, "0")}`.toLowerCase()
      : "";
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

  // ── PDF Export ────────────────────────────────────────────────────────────
  const exportPdf = async (invoice) => {
    try {
    const w = weddings.find((x) => String(x.id) === String(invoice.wedding_id));
    const paid = invoice.paid_amount || 0;
    const stillOwed = invoice.remaining_amount - paid;

    // Load Roboto font (hỗ trợ tiếng Việt)
    const fontUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf";
    const fontBoldUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf";
    const [fontRes, fontBoldRes] = await Promise.all([fetch(fontUrl), fetch(fontBoldUrl)]);
    const fontBuffer = await fontRes.arrayBuffer();
    const fontBoldBuffer = await fontBoldRes.arrayBuffer();

    const doc = new jsPDF("portrait", "mm", "a4");
    doc.addFileToVFS("Roboto-Regular.ttf", _arrayBufferToBase64(fontBuffer));
    doc.addFileToVFS("Roboto-Bold.ttf", _arrayBufferToBase64(fontBoldBuffer));
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
    doc.setFont("Roboto", "normal");

    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFont("Roboto", "bold");
    doc.setFontSize(22);
    doc.setTextColor(31, 78, 121);
    doc.text("HÓA ĐƠN TIỆC CƯỚI", pageW / 2, 25, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Wedding Management System", pageW / 2, 32, { align: "center" });
    doc.line(20, 37, pageW - 20, 37);

    // Info
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.setFont("Roboto", "normal");
    let y = 48;
    const row = (label, value) => {
      doc.setFont("Roboto", "bold");
      doc.text(label + ":", 20, y);
      doc.setFont("Roboto", "normal");
      doc.text(value, 65, y);
      y += 7;
    };
    row("Mã hóa đơn", `HD${String(invoice.display_num).padStart(3, "0")}`);
    row("Mã tiệc", w ? `TC${String(w.display_num).padStart(3, "0")}` : "???");
    row("Tên chú rể", invoice.groom_name);
    row("Tên cô dâu", invoice.bride_name);
    row("Ngày tổ chức", invoice.wedding_date ? (() => { const [y2, m, d] = invoice.wedding_date.slice(0, 10).split("-"); return `${d}/${m}/${y2}`; })() : "-");
    row("Sảnh", invoice.hall_name);
    row("Số lượng bàn", String(invoice.table_count));
    row("Trạng thái thanh toán", statusLabel[invoice.status] || invoice.status);

    // Items table
    y += 5;
    doc.setFont("Roboto", "bold");
    doc.setFontSize(14);
    doc.setTextColor(31, 78, 121);
    doc.text("CHI TIẾT HÓA ĐƠN", 20, y);
    y += 8;

    const bodyRows = [];
    if (w && w.foods) {
      w.foods.forEach((f) => {
        bodyRows.push([f.name, "Món ăn", "1", `${(f.booked_price || f.price).toLocaleString("vi-VN")} đ`, `${((f.booked_price || f.price)).toLocaleString("vi-VN")} đ`]);
      });
    }
    if (w && w.services) {
      w.services.forEach((s) => {
        const total = (s.booked_price || s.price) * (s.quantity || 1);
        bodyRows.push([s.name, "Dịch vụ", `${s.quantity}`, `${(s.booked_price || s.price).toLocaleString("vi-VN")} đ`, `${total.toLocaleString("vi-VN")} đ`]);
      });
    }

    autoTable(doc, {
      startY: y,
      head: [["Tên", "Loại", "SL", "Đơn giá", "Thành tiền"]],
      body: bodyRows,
      theme: "grid",
      styles: { font: "Roboto" },
      headStyles: { fillColor: [31, 78, 121], textColor: 255, fontStyle: "bold", fontSize: 9, font: "Roboto" },
      bodyStyles: { fontSize: 9, font: "Roboto" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 20 },
    });

    y = doc.lastAutoTable.finalY + 10;

    // Totals
    const totalsY = y;
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.setFont("Roboto", "normal");

    const totalRow = (label, value, bold = false) => {
      doc.setFont("Roboto", bold ? "bold" : "normal");
      doc.text(label, pageW - 100, y);
      doc.text(value, pageW - 20, y, { align: "right" });
      y += 7;
    };

    totalRow("Tổng tiền hóa đơn:", `${invoice.total_amount.toLocaleString("vi-VN")} đ`, true);
    totalRow("Tiền đặt cọc:", `${invoice.deposit.toLocaleString("vi-VN")} đ`);
    totalRow("Số tiền còn nợ:", `${invoice.remaining_amount.toLocaleString("vi-VN")} đ`);
    totalRow("Đã thanh toán:", `${paid.toLocaleString("vi-VN")} đ`);
    if (invoice.penalty_amount > 0) {
      totalRow("Tiền phạt trễ hạn:", `${invoice.penalty_amount.toLocaleString("vi-VN")} đ`);
    }
    doc.setDrawColor(31, 78, 121);
    doc.line(pageW - 100, y, pageW - 20, y);
    y += 5;
    doc.setFont("Roboto", "bold");
    doc.setFontSize(12);
    doc.setTextColor(31, 78, 121);
    const grandTotal = stillOwed + invoice.penalty_amount;
    totalRow("TỔNG CỘNG CÒN THANH TOÁN:", `${grandTotal.toLocaleString("vi-VN")} đ`);

    // Footer signature
    y = Math.max(y + 15, 250);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("Roboto", "normal");
    const today = new Date();
    const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    doc.text(`Ngày xuất: ${dateStr}`, 20, y);
    doc.text("Người lập hóa đơn", pageW - 60, y);
    doc.text("(Ký, ghi rõ họ tên)", pageW - 60, y + 5, { align: "center" });

    doc.save(`HoaDon_HD${String(invoice.display_num).padStart(3, "0")}_${dateStr.replace(/\//g, "")}.pdf`);
    } catch (err) {
      toast.error("Lỗi xuất PDF: " + (err.message || "Không thể tạo file PDF!"));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-w-0 overflow-hidden">
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
            onClick={() => {
              setPdfSelectedId("");
              setPdfError("");
              setIsPdfModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm"
          >
            <FileText size={16} /> Xuất Hóa Đơn
          </button>
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
      <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <th className="py-4 px-4 font-semibold whitespace-nowrap">MÃ HĐ</th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">MÃ TIỆC</th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">CHÚ RỂ / CÔ DÂU</th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">NGÀY TIỆC</th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">ĐÃ TRẢ</th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">CÒN NỢ</th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">TRỄ (NGÀY)</th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">TIỀN PHẠT</th>
              <th className="py-4 px-4 font-semibold whitespace-nowrap">TRẠNG THÁI</th>
              <th className="py-4 px-4 font-semibold text-center whitespace-nowrap">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentInvoices.map((invoice) => {
              const paid = invoice.paid_amount || 0;
              const stillOwed = invoice.remaining_amount - paid;
              const estLateDays = invoice.apply_penalty ? calcLateDays(invoice.wedding_date) : 0;
              const estPenalty = estLateDays > 0 ? Math.round(stillOwed * penaltyRate * estLateDays) : 0;
              const displayLateDays = invoice.late_days > 0 ? invoice.late_days : estLateDays;
              const displayPenalty = invoice.penalty_amount > 0 ? invoice.penalty_amount : estPenalty;
              return (
                <tr
                  key={invoice.id}
                  className="hover:bg-slate-50 transition-colors text-sm"
                >
                  <td className="py-4 px-4 whitespace-nowrap font-medium text-slate-800">
                    HD{invoice.display_num.toString().padStart(3, "0")}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                    {(() => {
                      const w = weddings.find((x) => String(x.id) === String(invoice.wedding_id));
                      return w ? `TC${String(w.display_num).padStart(3, "0")}` : "???";
                    })()}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-slate-800">
                    {invoice.groom_name} & {invoice.bride_name}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                    {invoice.wedding_date
                      ? (() => { const [y, m, d] = invoice.wedding_date.slice(0, 10).split("-"); return `${d}/${m}/${y}`; })()
                      : "-"}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap font-medium text-emerald-600">
                    {fmt(paid)}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap font-medium text-slate-800">
                    {stillOwed > 0 ? (
                      fmt(stillOwed)
                    ) : (
                      <span className="text-emerald-600">Đã đủ</span>
                    )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                    {displayLateDays > 0 ? displayLateDays : "-"}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-red-500 font-medium">
                    {displayPenalty > 0
                      ? fmt(displayPenalty)
                      : "-"}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${statusStyle[invoice.status] || statusStyle.unpaid}`}
                    >
                      {statusLabel[invoice.status] || invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
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
              {createError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                  {createError}
                </div>
              )}
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
                    .filter((w) => !invoices.find((i) => String(i.wedding_id) === String(w.id)))
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        TC{String(w.display_num).padStart(3, "0")} - {w.groom_name} &{" "}
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
                      label={`Số ngày trễ (từ ${selectedInvoice.wedding_date ? (() => { const [y, m, d] = selectedInvoice.wedding_date.slice(0, 10).split("-"); return `${d}/${m}/${y}`; })() : ""})`}
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
                    value={paymentAmount ? Number(paymentAmount).toLocaleString("vi-VN") : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setPaymentAmount(raw);
                      const num = Number(raw) || 0;
                      const grand = paymentCalc?.grand_total || 0;
                      if (num > grand && grand > 0) {
                        setPaymentError("Số tiền thanh toán vượt quá tổng nợ.");
                      } else {
                        setPaymentError("");
                      }
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
                        String(paymentCalc.grand_total),
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
                      paymentCalc.paying_now > paymentCalc.grand_total
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : paymentCalc.after_payment <= 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {paymentCalc.paying_now > paymentCalc.grand_total
                      ? `⚠ Số tiền thanh toán (${fmt(paymentCalc.paying_now)}) vượt quá tổng nợ (${fmt(paymentCalc.grand_total)})!`
                      : paymentCalc.after_payment <= 0
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

      {/* ── PDF EXPORT MODAL ───────────────────────────────────────────────── */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                Xuất Hóa Đơn PDF
              </h2>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!pdfSelectedId) {
                  setPdfError("Vui lòng chọn hóa đơn!");
                  return;
                }
                const inv = invoices.find((x) => x.id === pdfSelectedId);
                if (inv) {
                  exportPdf(inv);
                  setIsPdfModalOpen(false);
                }
              }}
              className="p-6 space-y-5"
            >
              {pdfError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
                  {pdfError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Chọn hóa đơn cần xuất
                </label>
                <select
                  required
                  value={pdfSelectedId}
                  onChange={(e) => {
                    setPdfSelectedId(e.target.value);
                    setPdfError("");
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
                >
                  <option value="">-- Chọn hóa đơn --</option>
                  {invoices.map((inv) => {
                    const w = weddings.find((x) => String(x.id) === String(inv.wedding_id));
                    return (
                      <option key={inv.id} value={inv.id}>
                        HD{String(inv.display_num).padStart(3, "0")} - {inv.groom_name} & {inv.bride_name}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-6 py-2 text-slate-600 font-medium bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  <FileText size={16} className="inline mr-1" /> Xuất PDF
                </button>
              </div>
            </form>
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
