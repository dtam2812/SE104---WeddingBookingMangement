import { useState, useEffect } from "react";
import {
  Download,
  TrendingUp,
  Calendar,
  CheckCircle,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import axios from "../common";

const fmt = (n) => (n != null ? Number(n).toLocaleString("vi-VN") + " đ" : "-");

const fmtDate = (dateStr) => {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

const MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

export default function Reports() {
  const [reportType, setReportType] = useState("all");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [day, setDay] = useState("");
  const [reportData, setReportData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalWeddings, setTotalWeddings] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [avgRevenue, setAvgRevenue] = useState(0);
  const [weddings, setWeddings] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportIncludeList, setExportIncludeList] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportType, month, year]);
  useEffect(() => {
    fetchWeddings();
  }, []);

  const getReportParams = () => {
    if (reportType === "day") return { date: day };
    if (reportType === "month") return { month, year };
    if (reportType === "year") return { year };
    return { type: "all" };
  };

  const fetchReport = async () => {
    setReportLoading(true);
    setReportError("");
    try {
      const params = new URLSearchParams(getReportParams());
      const res = await axios.get(`/api/invoices/revenue?${params}`);
      const data = (res.data.data || []).map((inv, idx) => ({
        ...inv,
        display_num: idx + 1,
      }));
      setReportData(data);
      setTotalRevenue(res.data.total_revenue || 0);
      setTotalWeddings(res.data.total_weddings || 0);
      setTotalCompleted(res.data.total_completed || 0);
      setAvgRevenue(res.data.avg_revenue || 0);

      // Tính công nợ từ data trả về
      const debt = data
        .filter((r) => !r.is_virtual && r.status !== "paid")
        .reduce((sum, r) => {
          const owed = (r.remaining_amount || 0) - (r.paid_amount || 0);
          return sum + Math.max(0, owed) + (r.penalty_amount || 0);
        }, 0);
      setTotalDebt(debt);
    } catch (err) {
      setReportError(
        err.response?.data?.message || "Không thể tải dữ liệu báo cáo!",
      );
      setReportData([]);
      setTotalRevenue(0);
      setTotalWeddings(0);
      setTotalCompleted(0);
      setAvgRevenue(0);
      setTotalDebt(0);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchWeddings = async () => {
    const res = await axios.get("/api/weddings");
    const sorted = [...(res.data.data || [])].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );
    setWeddings(sorted.map((w, idx) => ({ ...w, display_num: idx + 1 })));
  };

  const weddingMap = weddings.reduce((map, w) => {
    map[String(w.id || w._id)] = w;
    return map;
  }, {});

  const getExportFileName = () => {
    const now = new Date();
    const dateStr = `${now.getDate()}${now.getMonth() + 1}${now.getFullYear()}`;
    if (reportType === "day")
      return `BaoCao_Ngay${day?.replace(/-/g, "")}_${dateStr}.xlsx`;
    if (reportType === "month")
      return `BaoCao_Thang${month}_${year}_${dateStr}.xlsx`;
    if (reportType === "year") return `BaoCao_Nam${year}_${dateStr}.xlsx`;
    return `BaoCao_ToanThoiGian_${dateStr}.xlsx`;
  };

  const getReportTitle = () => {
    if (reportType === "day") {
      if (!day) return "BÁO CÁO DOANH THU";
      const [y, m, d] = day.split("-");
      return `BÁO CÁO DOANH THU NGÀY ${d}/${m}/${y}`;
    }
    if (reportType === "month")
      return `BÁO CÁO DOANH THU THÁNG ${month}/${year}`;
    if (reportType === "year") return `BÁO CÁO DOANH THU NĂM ${year}`;
    return "BÁO CÁO DOANH THU TOÀN THỜI GIAN";
  };

  // Tính công nợ từng dòng
  const calcRowDebt = (r) => {
    if (r.is_virtual || r.status === "paid") return 0;
    const owed = (r.remaining_amount || 0) - (r.paid_amount || 0);
    return Math.max(0, owed) + (r.penalty_amount || 0);
  };

  const monthlyRevenue = (() => {
    const result = Array(12).fill(0);
    reportData.forEach((inv) => {
      if (inv.wedding_date) {
        const m = new Date(inv.wedding_date).getMonth();
        result[m] += inv.total_amount + (inv.penalty_amount || 0);
      }
    });
    return result;
  })();
  const maxRevenue = Math.max(...monthlyRevenue, 1);

  // ── Excel Export ─────────────────────────────────────────────────────
  const doExport = async (includeList) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Wedding Management System";
    workbook.created = new Date();

    // Sheet 1: Tổng quan
    const sheet1 = workbook.addWorksheet("Tổng quan");
    sheet1.mergeCells("A1:F1");
    const titleCell = sheet1.getCell("A1");
    titleCell.value = getReportTitle();
    titleCell.font = {
      name: "Calibri",
      size: 18,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E79" },
    };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet1.getRow(1).height = 45;

    sheet1.mergeCells("A2:F2");
    const periodCell = sheet1.getCell("A2");
    if (reportType === "day") {
      if (day) {
        const [y, m, d] = day.split("-");
        periodCell.value = `Kỳ báo cáo: Ngày ${d}/${m}/${y}`;
      } else periodCell.value = "Kỳ báo cáo: Theo ngày";
    } else if (reportType === "month")
      periodCell.value = `Kỳ báo cáo: Tháng ${month}/${year}`;
    else if (reportType === "year")
      periodCell.value = `Kỳ báo cáo: Năm ${year}`;
    else periodCell.value = "Kỳ báo cáo: Toàn thời gian";
    periodCell.font = {
      name: "Calibri",
      size: 11,
      italic: true,
      color: { argb: "FF555555" },
    };
    periodCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet1.getRow(2).height = 22;

    const cards = [
      {
        label: "Tổng doanh thu",
        value: `${totalRevenue.toLocaleString("vi-VN")} đ`,
        color: "FF1F4E79",
      },
      { label: "Tổng số tiệc", value: `${totalWeddings}`, color: "FF2E7D32" },
      {
        label: "Công nợ",
        value: `${totalDebt.toLocaleString("vi-VN")} đ`,
        color: "FFE65100",
      },
      {
        label: "Doanh thu TB/tiệc",
        value: `${avgRevenue.toLocaleString("vi-VN")} đ`,
        color: "FF6A1B9A",
      },
    ];

    cards.forEach((card, i) => {
      const col = i * 2 + 1;
      sheet1.mergeCells(4, col, 4, col + 1);
      const lc = sheet1.getCell(4, col);
      lc.value = card.label;
      lc.font = {
        name: "Calibri",
        size: 12,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      lc.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: card.color },
      };
      lc.alignment = { horizontal: "center", vertical: "middle" };
      lc.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      sheet1.mergeCells(5, col, 5, col + 1);
      const vc = sheet1.getCell(5, col);
      vc.value = card.value;
      vc.font = { name: "Calibri", size: 14, bold: true };
      vc.alignment = { horizontal: "center", vertical: "middle" };
      vc.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF5F5F5" },
      };
      vc.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    [1, 2, 3, 4, 5, 6].forEach((c) => {
      sheet1.getColumn(c).width = 20;
    });
    sheet1.getRow(4).height = 28;
    sheet1.getRow(5).height = 28;

    // Sheet 2: Chi tiết
    if (includeList) {
      const sheet2 = workbook.addWorksheet("Chi tiết tiệc cưới");

      sheet2.mergeCells("A1:L1");
      const s2Title = sheet2.getCell("A1");
      s2Title.value = getReportTitle() + " — Danh sách tiệc cưới";
      s2Title.font = {
        name: "Calibri",
        size: 14,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      s2Title.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F4E79" },
      };
      s2Title.alignment = { horizontal: "center", vertical: "middle" };
      sheet2.getRow(1).height = 35;

      sheet2.mergeCells("A2:L2");
      const s2Period = sheet2.getCell("A2");
      if (reportType === "month")
        s2Period.value = `Kỳ báo cáo: Tháng ${month}/${year}`;
      else if (reportType === "year")
        s2Period.value = `Kỳ báo cáo: Năm ${year}`;
      else s2Period.value = "Kỳ báo cáo: Toàn thời gian";
      s2Period.font = {
        name: "Calibri",
        size: 10,
        italic: true,
        color: { argb: "FF666666" },
      };
      s2Period.alignment = { horizontal: "center", vertical: "middle" };
      sheet2.getRow(2).height = 18;

      const columns = [
        { header: "STT", key: "stt", width: 8 },
        { header: "Mã hóa đơn", key: "ma_hd", width: 16 },
        { header: "Mã tiệc", key: "ma_tc", width: 12 },
        { header: "Tên cô dâu", key: "bride", width: 20 },
        { header: "Tên chú rể", key: "groom", width: 20 },
        { header: "Ngày tổ chức", key: "date", width: 15 },
        { header: "Sảnh", key: "hall", width: 18 },
        { header: "Số bàn", key: "tables", width: 10 },
        { header: "Doanh thu", key: "total", width: 20 },
        { header: "Công nợ", key: "debt", width: 20 },
        { header: "Trạng thái", key: "status", width: 20 },
        { header: "Ghi chú", key: "notes", width: 30 },
      ];
      sheet2.columns = columns;

      const headerRow = sheet2.getRow(3);
      headerRow.height = 28;
      columns.forEach((col, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = col.header;
        cell.font = {
          name: "Calibri",
          size: 11,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2C5F8A" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      const statusLabels = {
        unpaid: "Chưa thanh toán",
        paid: "Đã thanh toán",
        partial: "Thanh toán một phần",
        cancelled_forfeit: "Hủy sát ngày",
        uninvoiced_deposit: "Chưa lập HĐ",
      };
      const statusColors = {
        paid: "FF2E7D32",
        partial: "FFE65100",
        unpaid: "FF555555",
        cancelled_forfeit: "FFC62828",
        uninvoiced_deposit: "FF0277BD",
      };

      reportData.forEach((r, idx) => {
        const w = weddingMap[String(r.wedding_id)];
        const rowDebt = calcRowDebt(r);
        const noteValue =
          r.status === "cancelled_forfeit"
            ? "Hủy sát ngày - Không hoàn cọc"
            : r.status === "uninvoiced_deposit"
              ? "Chưa lập hóa đơn - Chỉ cọc"
              : "";

        const row = sheet2.addRow({
          stt: idx + 1,
          ma_hd: r.is_virtual
            ? r.status === "cancelled_forfeit"
              ? "Hủy/Cọc"
              : "Chưa lập HĐ"
            : `HD${String(r.display_num).padStart(3, "0")}`,
          ma_tc: w ? `TC${String(w.display_num).padStart(3, "0")}` : "???",
          bride: r.bride_name,
          groom: r.groom_name,
          date: fmtDate(r.wedding_date),
          hall: r.hall_name,
          tables: r.table_count,
          total: r.total_amount + (r.penalty_amount || 0),
          debt: rowDebt,
          status: statusLabels[r.status] || r.status,
          notes: noteValue,
        });

        row.height = 22;
        row.eachCell((cell, colNum) => {
          cell.font = { name: "Calibri", size: 11 };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: idx % 2 === 0 ? "FFFFFFFF" : "FFF0F4F8" },
          };
          cell.alignment =
            colNum <= 3 || colNum === 8
              ? { horizontal: "center", vertical: "middle" }
              : { vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Doanh thu
        const totalCell = row.getCell(9);
        totalCell.numFmt = '#,##0 "đ"';
        totalCell.alignment = { horizontal: "right", vertical: "middle" };

        // Công nợ — màu đỏ nếu > 0
        const debtCell = row.getCell(10);
        debtCell.numFmt = '#,##0 "đ"';
        debtCell.alignment = { horizontal: "right", vertical: "middle" };
        if (rowDebt > 0) {
          debtCell.font = {
            name: "Calibri",
            size: 11,
            bold: true,
            color: { argb: "FFC62828" },
          };
        }

        // Trạng thái
        const statusCell = row.getCell(11);
        statusCell.font = {
          name: "Calibri",
          size: 11,
          bold: true,
          color: { argb: statusColors[r.status] || "FF555555" },
        };
      });

      // Dòng tổng
      const totalRow = sheet2.addRow({});
      totalRow.height = 24;
      totalRow.getCell(8).value = "TỔNG:";
      totalRow.getCell(8).font = { name: "Calibri", size: 11, bold: true };
      totalRow.getCell(8).alignment = {
        horizontal: "right",
        vertical: "middle",
      };

      const grandTotalCell = totalRow.getCell(9);
      grandTotalCell.value = totalRevenue;
      grandTotalCell.numFmt = '#,##0 "đ"';
      grandTotalCell.font = {
        name: "Calibri",
        size: 12,
        bold: true,
        color: { argb: "FF1F4E79" },
      };
      grandTotalCell.alignment = { horizontal: "right", vertical: "middle" };

      const grandDebtCell = totalRow.getCell(10);
      grandDebtCell.value = totalDebt;
      grandDebtCell.numFmt = '#,##0 "đ"';
      grandDebtCell.font = {
        name: "Calibri",
        size: 12,
        bold: true,
        color: { argb: "FFC62828" },
      };
      grandDebtCell.alignment = { horizontal: "right", vertical: "middle" };

      totalRow.eachCell((cell) => {
        cell.border = {
          top: { style: "medium" },
          bottom: { style: "double" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      sheet2.views = [{ state: "frozen", ySplit: 3 }];
      sheet2.autoFilter = {
        from: { row: 3, column: 1 },
        to: { row: reportData.length + 3, column: columns.length },
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, getExportFileName());
  };

  // ── Render ───────────────────────────────────────────────────────────
  const statusLabels = {
    unpaid: "Chưa thanh toán",
    paid: "Đã thanh toán",
    partial: "Thanh toán một phần",
    cancelled_forfeit: "Hủy sát ngày",
    uninvoiced_deposit: "Chưa lập HĐ",
  };
  const statusStyles = {
    paid: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    partial: "bg-amber-50 text-amber-600 border border-amber-200",
    unpaid: "bg-slate-50 text-slate-600 border border-slate-200",
    cancelled_forfeit: "bg-rose-50 text-rose-600 border border-rose-200",
    uninvoiced_deposit: "bg-sky-50 text-sky-600 border border-sky-200",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 uppercase">
          {getReportTitle()}
        </h1>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
          >
            <option value="day">Theo ngày</option>
            <option value="month">Theo tháng</option>
            <option value="year">Theo năm</option>
            <option value="all">Toàn thời gian</option>
          </select>

          {reportType === "day" && (
            <input
              type="date"
              value={day}
              onChange={(e) => { setDay(e.target.value); }}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
            />
          )}

          {reportType === "month" && (
            <>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
              >
                {Array.from(
                  { length: 10 },
                  (_, i) => new Date().getFullYear() - i,
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </>
          )}

          {reportType === "year" && (
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
            >
              {Array.from(
                { length: 10 },
                (_, i) => new Date().getFullYear() - i,
              ).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm"
          >
            <Download size={16} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Summary Cards — 5 cards gồm cả công nợ */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-600">
              Tổng doanh thu
            </span>
            <DollarSign size={20} className="text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-900">
            {totalRevenue.toLocaleString("vi-VN")} đ
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border border-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-emerald-600">
              Tổng số tiệc
            </span>
            <Calendar size={20} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-900">
            {totalWeddings}
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-xl border border-teal-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-teal-600">
              Số tiệc hoàn thành
            </span>
            <CheckCircle size={20} className="text-teal-500" />
          </div>
          <div className="text-xl font-bold text-teal-900">
            {totalCompleted}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-red-600">Công nợ</span>
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <div className="text-xl font-bold text-red-700">
            {totalDebt.toLocaleString("vi-VN")} đ
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-amber-600">
              Doanh thu TB/tiệc
            </span>
            <TrendingUp size={20} className="text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-900">
            {avgRevenue.toLocaleString("vi-VN")} đ
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      {reportType === "year" && (
        <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="text-base font-semibold text-slate-800 mb-4">
            Biểu đồ doanh thu theo tháng
          </h3>
          <div className="relative" style={{ height: "200px" }}>
            {[0, 25, 50, 75, 100].map((pct) => (
              <div
                key={pct}
                className="absolute w-full border-t border-slate-200"
                style={{ bottom: `${pct}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end gap-1 px-1">
              {monthlyRevenue.map((rev, i) => {
                const heightPct =
                  rev > 0 ? Math.max((rev / maxRevenue) * 95, 4) : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full"
                  >
                    {rev > 0 && (
                      <span className="text-xs text-slate-500 font-medium mb-1 leading-none">
                        {Math.round(rev / 1_000_000)}tr
                      </span>
                    )}
                    <div
                      className="w-full rounded-t transition-all duration-500"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: rev > 0 ? "#4f46e5" : "#e2e8f0",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-1 px-1 mt-1">
            {MONTHS.map((_, i) => (
              <div
                key={i}
                className="flex-1 text-center text-xs text-slate-500"
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-3 gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />{" "}
              Doanh thu
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-slate-800">
          Danh sách hóa đơn
        </h2>
        <span className="text-sm font-medium text-slate-600">
          Tổng số hóa đơn: {reportData.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
              <th className="py-4 px-4 font-semibold">MÃ HĐ</th>
              <th className="py-4 px-4 font-semibold">MÃ TC</th>
              <th className="py-4 px-4 font-semibold">CÔ DÂU</th>
              <th className="py-4 px-4 font-semibold">CHÚ RỂ</th>
              <th className="py-4 px-4 font-semibold">NGÀY TIỆC</th>
              <th className="py-4 px-4 font-semibold">SẢNH</th>
              <th className="py-4 px-4 font-semibold text-right">SỐ BÀN</th>
              <th className="py-4 px-4 font-semibold text-right">DOANH THU</th>
              <th className="py-4 px-4 font-semibold text-right">CÔNG NỢ</th>
              <th className="py-4 px-4 font-semibold">TRẠNG THÁI</th>
              <th className="py-4 px-4 font-semibold">GHI CHÚ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reportData.map((r) => {
              const w = weddingMap[String(r.wedding_id)];
              const rowDebt = calcRowDebt(r);
              return (
                <tr
                  key={r.id || r._id}
                  className="hover:bg-slate-50 transition-colors text-sm"
                >
                  <td className="py-4 px-4 font-medium text-slate-800 whitespace-nowrap">
                    {r.is_virtual
                      ? r.status === "cancelled_forfeit"
                        ? "Hủy/Cọc"
                        : "Chưa lập HĐ"
                      : `HD${String(r.display_num).padStart(3, "0")}`}
                  </td>
                  <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                    {w ? `TC${String(w.display_num).padStart(3, "0")}` : "???"}
                  </td>
                  <td className="py-4 px-4 text-slate-800 whitespace-nowrap">
                    {r.bride_name}
                  </td>
                  <td className="py-4 px-4 text-slate-800 whitespace-nowrap">
                    {r.groom_name}
                  </td>
                  <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                    {fmtDate(r.wedding_date)}
                  </td>
                  <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                    {r.hall_name}
                  </td>
                  <td className="py-4 px-4 text-slate-800 text-right whitespace-nowrap">
                    {r.table_count}
                  </td>
                  <td className="py-4 px-4 font-medium text-emerald-600 text-right whitespace-nowrap">
                    {fmt(r.total_amount + (r.penalty_amount || 0))}
                  </td>
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    {rowDebt > 0 ? (
                      <span className="font-medium text-red-600">
                        {fmt(rowDebt)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[r.status] || statusStyles.unpaid}`}
                    >
                      {statusLabels[r.status] || r.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 text-xs whitespace-nowrap">
                    {r.status === "cancelled_forfeit"
                      ? "Hủy sát ngày - Không hoàn cọc"
                      : r.status === "uninvoiced_deposit"
                        ? "Chưa lập hóa đơn - Chỉ cọc"
                        : ""}
                  </td>
                </tr>
              );
            })}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-500">
                  Không có dữ liệu doanh thu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                Xuất báo cáo Excel
              </h2>
              <p className="text-sm text-slate-500 mt-1">{getReportTitle()}</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 font-medium">
                Bạn có muốn bao gồm danh sách tiệc cưới trong file Excel không?
              </p>
              <div className="space-y-2">
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer ${exportIncludeList ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <input
                    type="radio"
                    name="exportType"
                    checked={exportIncludeList}
                    onChange={() => setExportIncludeList(true)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Có — Bao gồm danh sách tiệc
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Xuất 2 sheet: Tổng quan + Chi tiết từng tiệc (có cột Công
                      nợ)
                    </p>
                  </div>
                </label>
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${!exportIncludeList ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <input
                    type="radio"
                    name="exportType"
                    checked={!exportIncludeList}
                    onChange={() => setExportIncludeList(false)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Không — Chỉ tổng quan
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Xuất 1 sheet tóm tắt các chỉ số chính
                    </p>
                  </div>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-5 py-2 text-slate-600 font-medium bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-sm"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setIsExportModalOpen(false);
                  doExport(exportIncludeList);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm flex items-center gap-2"
              >
                <Download size={15} /> Xuất Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
