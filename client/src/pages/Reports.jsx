import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import axios from "../common";

export default function Reports() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchReport();
  }, [month, year]);

  const fetchReport = async () => {
    try {
      const res = await axios.get(
        `/api/invoices/revenue?month=${month}&year=${year}`,
      );
      setReportData(res.data.data || []);
      setTotalRevenue(res.data.total_revenue || 0);
    } catch (err) {
      console.error("Lỗi fetchReport:", err.response?.data || err.message);
    }
  };

  const exportToExcel = () => {
    const wsData = [
      [
        "Mã Hóa Đơn",
        "Khách Hàng",
        "Ngày Tiệc",
        "Ngày Thanh Toán",
        "Doanh Thu",
        "Tiền Phạt",
        "Tổng Cộng",
      ],
      ...reportData.map((r) => [
        `HD${r.id.toString().padStart(3, "0")}`,
        `${r.groom_name} & ${r.bride_name}`,
        r.wedding_date,
        r.payment_date,
        r.total_amount,
        r.penalty_amount,
        r.total_amount + r.penalty_amount,
      ]),
      ["", "", "", "TỔNG DOANH THU:", "", "", totalRevenue],
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
              <th className="py-4 px-4 font-semibold">KHÁCH HÀNG</th>
              <th className="py-4 px-4 font-semibold">NGÀY TIỆC</th>
              <th className="py-4 px-4 font-semibold">NGÀY TT</th>
              <th className="py-4 px-4 font-semibold text-right">DOANH THU</th>
              <th className="py-4 px-4 font-semibold text-right">TIỀN PHẠT</th>
              <th className="py-4 px-4 font-semibold text-right">TỔNG CỘNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reportData.map((r) => (
              <tr
                key={r.id}
                className="hover:bg-slate-50 transition-colors text-sm"
              >
                <td className="py-4 px-4 font-medium text-slate-800">
                  HD{r.id.toString().padStart(3, "0")}
                </td>
                <td className="py-4 px-4 text-slate-600">
                  {r.groom_name} & {r.bride_name}
                </td>
                <td className="py-4 px-4 text-slate-600">{r.wedding_date}</td>
                <td className="py-4 px-4 text-slate-600">{r.payment_date}</td>
                <td className="py-4 px-4 text-slate-800 text-right">
                  {r.total_amount.toLocaleString("vi-VN")} đ
                </td>
                <td className="py-4 px-4 text-red-500 text-right">
                  {r.penalty_amount > 0
                    ? r.penalty_amount.toLocaleString("vi-VN") + " đ"
                    : "-"}
                </td>
                <td className="py-4 px-4 font-medium text-emerald-600 text-right">
                  {(r.total_amount + r.penalty_amount).toLocaleString("vi-VN")}{" "}
                  đ
                </td>
              </tr>
            ))}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
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
