import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import axios from "../common";

const fmt = (n) => (n != null ? Number(n).toLocaleString("vi-VN") + " đ" : "-");

const calcLateDays = (weddingDateStr) => {
  const wedding = new Date(weddingDateStr);
  const penaltyStart = new Date(wedding);
  penaltyStart.setDate(penaltyStart.getDate() + 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today - penaltyStart;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
};

const fmtDate = (dateStr) => {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};

export default function Reports() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [weddings, setWeddings] = useState([]);
  const [penaltyRate, setPenaltyRate] = useState(0.01);

  useEffect(() => {
    fetchReport();
  }, [month, year]);

  useEffect(() => {
    fetchWeddings();
    fetchPenaltyRate();
  }, []);

  const fetchReport = async () => {
    const res = await axios.get(
      `/api/invoices/revenue?month=${month}&year=${year}`,
    );
    const data = (res.data.data || []).map((inv, idx) => ({
      ...inv,
      display_num: idx + 1,
    }));
    setReportData(data);
    setTotalRevenue(res.data.total_revenue || 0);
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
    } catch {
      // keep fallback
    }
  };

  const weddingMap = weddings.reduce((map, w) => {
    map[String(w.id || w._id)] = w;
    return map;
  }, {});

  const exportToExcel = () => {
    const wsData = [
      [
        "Mã HĐ",
        "Mã TC",
        "Khách Hàng",
        "Ngày Tiệc",
        "Ngày Thanh Toán",
        "Doanh Thu",
        "Tiền Phạt",
        "Tổng Cộng",
      ],
      ...reportData.map((r) => {
        const w = weddingMap[String(r.wedding_id)];
        const estLateDays = r.apply_penalty ? calcLateDays(r.wedding_date) : 0;
        const estPenalty =
          estLateDays > 0
            ? Math.round(
                (r.remaining_amount - (r.paid_amount || 0)) *
                  penaltyRate *
                  estLateDays,
              )
            : 0;
        const displayPenalty =
          r.penalty_amount > 0 ? r.penalty_amount : estPenalty;
        return [
          `HD${String(r.display_num).padStart(3, "0")}`,
          w ? `TC${String(w.display_num).padStart(3, "0")}` : "???",
          `${r.groom_name} & ${r.bride_name}`,
          fmtDate(r.wedding_date),
          fmtDate(r.payment_date),
          r.total_amount,
          displayPenalty,
          r.total_amount + displayPenalty,
        ];
      }),
      ["", "", "", "", "TỔNG DOANH THU:", "", "", totalRevenue],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DoanhThu");
    XLSX.writeFile(wb, `BaoCaoDoanhThu_${month}_${year}.xlsx`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 uppercase">
          BÁO CÁO DOANH THU
        </h1>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
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
              { length: 5 },
              (_, i) => new Date().getFullYear() - i,
            ).map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm"
          >
            <Download size={16} /> Xuất Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
          <div className="text-sm font-medium text-indigo-600 mb-2">
            Tổng số hóa đơn
          </div>
          <div className="text-3xl font-bold text-indigo-900">
            {reportData.length}
          </div>
        </div>
        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 md:col-span-2">
          <div className="text-sm font-medium text-emerald-600 mb-2">
            Tổng doanh thu tháng {month}/{year}
          </div>
          <div className="text-3xl font-bold text-emerald-900">
            {totalRevenue.toLocaleString("vi-VN")} đ
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-slate-800">
          Danh sách hóa đơn thanh toán
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
              <th className="py-4 px-4 font-semibold">KHÁCH HÀNG</th>
              <th className="py-4 px-4 font-semibold">NGÀY TIỆC</th>
              <th className="py-4 px-4 font-semibold">NGÀY TT</th>
              <th className="py-4 px-4 font-semibold text-right">DOANH THU</th>
              <th className="py-4 px-4 font-semibold text-right">TIỀN PHẠT</th>
              <th className="py-4 px-4 font-semibold text-right">TỔNG CỘNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reportData.map((r) => {
              const w = weddingMap[String(r.wedding_id)];
              const estLateDays = r.apply_penalty
                ? calcLateDays(r.wedding_date)
                : 0;
              const estPenalty =
                estLateDays > 0
                  ? Math.round(
                      (r.remaining_amount - (r.paid_amount || 0)) *
                        penaltyRate *
                        estLateDays,
                    )
                  : 0;
              const displayPenalty =
                r.penalty_amount > 0 ? r.penalty_amount : estPenalty;
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
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                  {r.groom_name} & {r.bride_name}
                </td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">{fmtDate(r.wedding_date)}</td>
                <td className="py-4 px-4 text-slate-600 whitespace-nowrap">{fmtDate(r.payment_date)}</td>
                <td className="py-4 px-4 text-slate-800 text-right whitespace-nowrap">
                  {fmt(r.total_amount)}
                </td>
                <td className="py-4 px-4 text-red-500 text-right whitespace-nowrap">
                  {displayPenalty > 0 ? fmt(displayPenalty) : "-"}
                </td>
                <td className="py-4 px-4 font-medium text-emerald-600 text-right whitespace-nowrap">
                  {fmt(r.total_amount + displayPenalty)}
                </td>
              </tr>
              );
            })}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 whitespace-nowrap">
                  Không có dữ liệu doanh thu trong tháng này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
