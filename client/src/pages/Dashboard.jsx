import { useEffect, useState } from "react";
import axios from "../common";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalWeddings: 0,
    totalRevenue: 0,
    totalDebt: 0,
    totalActual: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [weddingsRes, invoicesRes] = await Promise.all([
        axios.get("/api/weddings"),
        axios.get("/api/invoices"),
      ]);

      const weddings = weddingsRes.data.data || [];
      const invoices = invoicesRes.data.data || [];

      const totalRevenue = invoices.reduce(
        (sum, inv) => sum + (inv.total_amount || 0) + (inv.penalty_amount || 0),
        0,
      );

      const totalDebt = invoices
        .filter((inv) => inv.status !== "paid")
        .reduce(
          (sum, inv) =>
            sum +
            ((inv.remaining_amount || 0) - (inv.paid_amount || 0)) +
            (inv.penalty_amount || 0),
          0,
        );

      const totalActual = invoices.reduce(
        (sum, inv) =>
          sum + (inv.deposit || 0) + (inv.paid_amount || 0),
        0,
      );

      setStats({
        totalWeddings: weddings.length,
        totalRevenue,
        totalDebt,
        totalActual,
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 uppercase">
        TRANG CHỦ
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Chào mừng đến với hệ thống Quản lý Tiệc Cưới!
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-slate-500 mb-2 uppercase">
            Tổng số tiệc cưới
          </div>
          <div className="text-3xl font-bold text-indigo-600">
            {stats.totalWeddings}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-slate-500 mb-2 uppercase">
            Tổng doanh thu
          </div>
          <div className="text-3xl font-bold text-emerald-600">
            {stats.totalRevenue.toLocaleString("vi-VN")} đ
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-slate-500 mb-2 uppercase">
            Công nợ
          </div>
          <div className="text-3xl font-bold text-amber-500">
            {stats.totalDebt.toLocaleString("vi-VN")} đ
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-slate-500 mb-2 uppercase">
            Thực thu
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {stats.totalActual.toLocaleString("vi-VN")} đ
          </div>
        </div>
      </div>
    </div>
  );
}
