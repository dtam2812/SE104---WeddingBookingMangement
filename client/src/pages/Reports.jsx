import { useState, useEffect } from "react";
import { Download, TrendingUp, Calendar, CheckCircle, DollarSign } from "lucide-react";
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
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

export default function Reports() {
  const [reportType, setReportType] = useState("all");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalWeddings, setTotalWeddings] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [avgRevenue, setAvgRevenue] = useState(0);
  const [weddings, setWeddings] = useState([]);
  const [penaltyRate, setPenaltyRate] = useState(0.01);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    fetchReport();
  }, [reportType, month, year]);

  useEffect(() => {
    fetchWeddings();
    fetchPenaltyRate();
  }, []);

  const getReportParams = () => {
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
    } catch (err) {
      setReportError(err.response?.data?.message || "Không thể tải dữ liệu báo cáo!");
      setReportData([]);
      setTotalRevenue(0);
      setTotalWeddings(0);
      setTotalCompleted(0);
      setAvgRevenue(0);
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

  const fetchPenaltyRate = async () => {
    try {
      const res = await axios.get("/api/rules");
      const rules = res.data.data || [];
      const rule = rules.find((r) => r.code === "PENALTY_RATE");
      if (rule) setPenaltyRate(Number(rule.value));
    } catch { /* keep fallback */ }
  };

  const weddingMap = weddings.reduce((map, w) => {
    map[String(w.id || w._id)] = w;
    return map;
  }, {});

  const getExportFileName = () => {
    const now = new Date();
    const dateStr = `${now.getDate()}${now.getMonth() + 1}${now.getFullYear()}`;
    if (reportType === "month") return `BaoCao_Thang${month}_${year}_${dateStr}.xlsx`;
    if (reportType === "year") return `BaoCao_Nam${year}_${dateStr}.xlsx`;
    return `BaoCao_ToanThoiGian_${dateStr}.xlsx`;
  };

  const getReportTitle = () => {
    if (reportType === "month") return `BÁO CÁO DOANH THU THÁNG ${month}/${year}`;
    if (reportType === "year") return `BÁO CÁO DOANH THU NĂM ${year}`;
    return "BÁO CÁO DOANH THU TOÀN THỜI GIAN";
  };

  // ── Chart data for monthly revenue ──────────────────────────────────
  const monthlyRevenue = (() => {
    const result = Array(12).fill(0);
    reportData.forEach((inv) => {
      if (inv.wedding_date) {
        const d = new Date(inv.wedding_date);
        const m = d.getMonth();
        result[m] += inv.total_amount + (inv.penalty_amount || 0);
      }
    });
    return result;
  })();

  const maxRevenue = Math.max(...monthlyRevenue, 1);

  // ── Excel Export with ExcelJS ────────────────────────────────────────
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Wedding Management System";
    workbook.created = new Date();

    // ============== Sheet 1: Tổng quan ==============
    const sheet1 = workbook.addWorksheet("Tổng quan");
    sheet1.mergeCells("A1:F1");
    const titleCell = sheet1.getCell("A1");
    titleCell.value = getReportTitle();
    titleCell.font = { name: "Calibri", size: 18, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet1.getRow(1).height = 45;

    // Summary cards
    const cards = [
      { label: "Tổng doanh thu", value: `${totalRevenue.toLocaleString("vi-VN")} đ`, color: "FF1F4E79" },
      { label: "Tổng số tiệc", value: `${totalWeddings}`, color: "FF2E7D32" },
      { label: "Số tiệc hoàn thành", value: `${totalCompleted}`, color: "FF00796B" },
      { label: "Doanh thu TB/tiệc", value: `${avgRevenue.toLocaleString("vi-VN")} đ`, color: "FFE65100" },
    ];

    cards.forEach((card, i) => {
      const col = i * 2 + 1;
      sheet1.mergeCells(3, col, 3, col + 1);
      const labelCell = sheet1.getCell(3, col);
      labelCell.value = card.label;
      labelCell.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
      labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: card.color } };
      labelCell.alignment = { horizontal: "center", vertical: "middle" };
      labelCell.border = {
        top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" },
      };

      sheet1.mergeCells(4, col, 4, col + 1);
      const valueCell = sheet1.getCell(4, col);
      valueCell.value = card.value;
      valueCell.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FF333333" } };
      valueCell.alignment = { horizontal: "center", vertical: "middle" };
      valueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
      valueCell.border = {
        top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" },
      };
    });

    sheet1.getColumn(1).width = 20;
    sheet1.getColumn(2).width = 20;
    sheet1.getColumn(3).width = 20;
    sheet1.getColumn(4).width = 20;
    sheet1.getColumn(5).width = 20;
    sheet1.getColumn(6).width = 20;

    // ============== Sheet 2: Chi tiết ==============
    const sheet2 = workbook.addWorksheet("Chi tiết");

    const columns = [
      { header: "STT", key: "stt", width: 8 },
      { header: "Mã hóa đơn", key: "ma_hd", width: 14 },
      { header: "Mã tiệc", key: "ma_tc", width: 12 },
      { header: "Tên cô dâu", key: "bride", width: 20 },
      { header: "Tên chú rể", key: "groom", width: 20 },
      { header: "Ngày tổ chức", key: "date", width: 15 },
      { header: "Sảnh", key: "hall", width: 18 },
      { header: "Số bàn", key: "tables", width: 10 },
      { header: "Tổng tiền", key: "total", width: 18 },
      { header: "Trạng thái", key: "status", width: 18 },
    ];

    sheet2.columns = columns;

    // Header style
    const headerRow = sheet2.getRow(1);
    headerRow.height = 30;
    columns.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" },
      };
    });

    // Data rows
    reportData.forEach((r, idx) => {
      const w = weddingMap[String(r.wedding_id)];
      const statusLabels = { unpaid: "Chưa thanh toán", paid: "Đã thanh toán", partial: "Thanh toán một phần" };
      const row = sheet2.addRow({
        stt: idx + 1,
        ma_hd: `HD${String(r.display_num).padStart(3, "0")}`,
        ma_tc: w ? `TC${String(w.display_num).padStart(3, "0")}` : "???",
        bride: r.bride_name,
        groom: r.groom_name,
        date: fmtDate(r.wedding_date),
        hall: r.hall_name,
        tables: r.table_count,
        total: r.total_amount + (r.penalty_amount || 0),
        status: statusLabels[r.status] || r.status,
      });

      // Zebra striping
      row.eachCell((cell, colNum) => {
        if (idx % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F7FA" } };
        }
        cell.font = { name: "Calibri", size: 11 };
        cell.alignment = colNum <= 2 || colNum === 8 ? { horizontal: "center", vertical: "middle" } : { vertical: "middle" };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" },
        };
      });

      // Format total as currency
      const totalCell = row.getCell(9);
      totalCell.numFmt = '#,##0 "đ"';
      totalCell.alignment = { horizontal: "right", vertical: "middle" };
    });

    // Auto filter
    sheet2.autoFilter = { from: { row: 1, column: 1 }, to: { row: reportData.length + 1, column: columns.length } };
    // Freeze header
    sheet2.views = [{ state: "frozen", ySplit: 1 }];

    // Total row
    const totalRow = sheet2.addRow({});
    totalRow.getCell(1).value = "";
    totalRow.getCell(8).value = "TỔNG DOANH THU:";
    totalRow.getCell(8).font = { name: "Calibri", size: 11, bold: true };
    totalRow.getCell(8).alignment = { horizontal: "right", vertical: "middle" };
    const grandTotalCell = totalRow.getCell(9);
    grandTotalCell.value = totalRevenue;
    grandTotalCell.numFmt = '#,##0 "đ"';
    grandTotalCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF1F4E79" } };
    grandTotalCell.alignment = { horizontal: "right", vertical: "middle" };

    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: "medium" }, left: { style: "thin" }, bottom: { style: "double" }, right: { style: "thin" },
      };
    });

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, getExportFileName());
  };

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 uppercase">
          {getReportTitle()}
        </h1>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Report type selector */}
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
          >
            <option value="month">Theo tháng</option>
            <option value="year">Theo năm</option>
            <option value="all">Toàn thời gian</option>
          </select>

          {reportType === "month" && (
            <>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-sm"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
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
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm"
          >
            <Download size={16} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-600">Tổng doanh thu</span>
            <DollarSign size={20} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{totalRevenue.toLocaleString("vi-VN")} đ</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border border-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-emerald-600">Tổng số tiệc</span>
            <Calendar size={20} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{totalWeddings}</div>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-xl border border-teal-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-teal-600">Số tiệc hoàn thành</span>
            <CheckCircle size={20} className="text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-teal-900">{totalCompleted}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-amber-600">Doanh thu TB/tiệc</span>
            <TrendingUp size={20} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{avgRevenue.toLocaleString("vi-VN")} đ</div>
        </div>
      </div>

      {/* Bar Chart */}
      {reportType === "year" && (
        <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <h3 className="text-base font-semibold text-slate-800 mb-4">
            Biểu đồ doanh thu theo tháng
          </h3>
          <div className="flex items-end gap-2 h-48">
            {monthlyRevenue.map((rev, i) => {
              const height = Math.max((rev / maxRevenue) * 100, rev > 0 ? 5 : 0);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-500 font-medium">
                    {rev > 0 ? Math.round(rev / 1000000) + "tr" : ""}
                  </span>
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${height}%`,
                      backgroundColor: rev > 0 ? "#4f46e5" : "#e2e8f0",
                      minHeight: rev > 0 ? "4px" : "2px",
                      transition: "height 0.3s",
                    }}
                  />
                  <span className="text-xs text-slate-600">{i + 1}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center mt-3 gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-600 inline-block" /> Doanh thu</span>
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
              <th className="py-4 px-4 font-semibold">TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reportData.map((r) => {
              const w = weddingMap[String(r.wedding_id)];
              const statusLabels = { unpaid: "Chưa thanh toán", paid: "Đã thanh toán", partial: "Thanh toán một phần" };
              const statusStyles = {
                paid: "bg-emerald-50 text-emerald-600 border border-emerald-200",
                partial: "bg-amber-50 text-amber-600 border border-amber-200",
                unpaid: "bg-slate-50 text-slate-600 border border-slate-200",
              };
              return (
              <tr
                key={r.id || r._id}
                className="hover:bg-slate-50 transition-colors text-sm"
              >
                <td className="py-4 px-4 font-medium text-slate-800 whitespace-nowrap">
                  HD{String(r.display_num).padStart(3, "0")}
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {w ? `TC${String(w.display_num).padStart(3, "0")}` : "???"}
                </td>
                <td className="py-4 px-4 text-slate-800 whitespace-nowrap">{r.bride_name}</td>
                <td className="py-4 px-4 text-slate-800 whitespace-nowrap">{r.groom_name}</td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">{fmtDate(r.wedding_date)}</td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">{r.hall_name}</td>
                <td className="py-4 px-4 text-slate-800 text-right whitespace-nowrap">{r.table_count}</td>
                <td className="py-4 px-4 font-medium text-emerald-600 text-right whitespace-nowrap">
                  {fmt(r.total_amount + (r.penalty_amount || 0))}
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[r.status] || statusStyles.unpaid}`}>
                    {statusLabels[r.status] || r.status}
                  </span>
                </td>
              </tr>
              );
            })}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  Không có dữ liệu doanh thu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
