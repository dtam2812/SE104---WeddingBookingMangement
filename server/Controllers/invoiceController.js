import { Invoice } from "../Models/index.js";
import { Rule } from "../Models/index.js";
import { Wedding } from "../Models/index.js";

export const getAll = async (req, res) => {
  try {
    const data = await Invoice.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getById = async (req, res) => {
  try {
    const doc = await Invoice.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hóa đơn!" });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRevenueReport = async (req, res) => {
  try {
    const { date, month, year, type } = req.query;
    const filter = {};

    if (type === "all") {
      // No date filter - get all
    } else if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.wedding_date = { $gte: start, $lte: end };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.wedding_date = { $gte: start, $lt: end };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      filter.wedding_date = { $gte: start, $lt: end };
    }

    const invoices = await Invoice.find(filter);
    
    // Lấy danh sách wedding_id đã có hóa đơn
    const invoicedWeddingIds = invoices.map(inv => inv.wedding_id.toString());

    // Bộ lọc tìm các tiệc cưới chưa lập hóa đơn nhưng đã xác nhận/diễn ra/kết thúc/đã hủy mà có cọc > 0
    const weddingFilter = {
      _id: { $nin: invoicedWeddingIds },
      status: { $in: ["da_xac_nhan", "dang_dien_ra", "hoan_thanh", "da_huy"] },
      deposit: { $gt: 0 }
    };

    if (type === "all") {
      // Không lọc ngày
    } else if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      weddingFilter.wedding_date = { $gte: start, $lte: end };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      weddingFilter.wedding_date = { $gte: start, $lt: end };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      weddingFilter.wedding_date = { $gte: start, $lt: end };
    }

    const unInvoicedWeddings = await Wedding.find(weddingFilter);
    const unInvoicedDepositTotal = unInvoicedWeddings.reduce((sum, w) => sum + (w.deposit || 0), 0);

    const virtualInvoices = unInvoicedWeddings.map((w) => ({
      id: `W_${w._id}`,
      wedding_id: w._id,
      groom_name: w.groom_name,
      bride_name: w.bride_name,
      wedding_date: w.wedding_date,
      hall_name: w.hall_name,
      table_count: w.table_count || 0,
      total_amount: w.deposit, // Tiền cọc thu được coi như doanh thu thực tế phát sinh
      deposit: w.deposit,
      remaining_amount: 0,
      paid_amount: 0,
      late_days: 0,
      penalty_amount: 0,
      status: w.status === "da_huy" ? "cancelled_forfeit" : "uninvoiced_deposit",
      is_virtual: true
    }));

    const total_revenue = invoices.reduce(
      (sum, inv) => sum + inv.total_amount + inv.penalty_amount,
      0,
    ) + unInvoicedDepositTotal;

    const total_penalty = invoices.reduce(
      (sum, inv) => sum + inv.penalty_amount,
      0,
    );
    const total_weddings = invoices.length + unInvoicedWeddings.length;
    const total_completed = invoices.filter((inv) => inv.status === "paid").length;
    const avg_revenue = total_weddings > 0 ? Math.round(total_revenue / total_weddings) : 0;

    res.json({
      success: true,
      data: [...invoices, ...virtualInvoices],
      total_revenue,
      total_penalty,
      total_weddings,
      total_completed,
      avg_revenue,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CREATE ──────────────────────────────────────────────────────────────────
export const create = async (req, res) => {
  const { wedding_id, table_count, apply_penalty, payment_due_date, extra_services } = req.body;

  if (!wedding_id) {
    return res
      .status(400)
      .json({ success: false, message: "Thiếu wedding_id!" });
  }

  try {
    const wedding = await Wedding.findById(wedding_id);
    if (!wedding) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tiệc cưới!" });
    }

    if (wedding.status !== "hoan_thanh") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể lập hóa đơn cho tiệc cưới ở trạng thái Kết thúc!",
      });
    }

    const actualTableCount =
      table_count && Number(table_count) > 0
        ? Number(table_count)
        : wedding.table_count;

    const foodTotal =
      (wedding.foods || []).reduce(
        (sum, f) => sum + (f.booked_price || f.price) * (f.quantity || 1),
        0,
      ) * actualTableCount;

    const serviceTotal = (wedding.services || []).reduce(
      (sum, s) => sum + s.price * (s.quantity || 1),
      0,
    );

    const extraServiceTotal = (extra_services || []).reduce(
      (sum, s) => sum + Number(s.price || 0) * Number(s.quantity || 1),
      0,
    );

    const total_amount = foodTotal + serviceTotal + extraServiceTotal;
    const remaining_amount = Math.max(0, total_amount - (wedding.deposit || 0));

    const invoiceData = {
      wedding_id,
      groom_name: wedding.groom_name,
      bride_name: wedding.bride_name,
      wedding_date: wedding.wedding_date,
      hall_name: wedding.hall_name,
      table_count: actualTableCount,
      total_amount,
      deposit: wedding.deposit || 0,
      remaining_amount,
      paid_amount: 0,
      extra_services: extra_services || [],
      late_days: 0,
      penalty_amount: 0,
      payment_due_date:
        payment_due_date || wedding.payment_due_date || wedding.wedding_date,
      apply_penalty: apply_penalty === true || apply_penalty === "true",
      status: "unpaid",
    };

    const doc = await Invoice.create(invoiceData);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
// Handles two cases:
//   A) Payment  → req.body.paid_amount_now (number)
//   B) Undo     → req.body.status === "unpaid" && payment_date === null
export const update = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hóa đơn!" });
    }

    const updates = { ...req.body };

    // ── CASE A: Recording a payment ─────────────────────────────────────────
    if (req.body.paid_amount_now !== undefined) {
      const paying_now = Number(req.body.paid_amount_now) || 0;

      if (paying_now <= 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Số tiền thanh toán phải lớn hơn 0!",
          });
      }

      delete updates.paid_amount_now; // not a schema field

      const new_paid_amount = (invoice.paid_amount || 0) + paying_now;

      // Fetch penalty rate (hỗ trợ cả TIEN_PHAT và PENALTY_RATE)
      const penaltyRule = await Rule.findOne({ code: { $in: ["TIEN_PHAT", "PENALTY_RATE"] } });
      let penaltyRate = 0.01; // fallback 1%
      if (penaltyRule) {
        const parsed = parseFloat(penaltyRule.value);
        if (!isNaN(parsed)) {
          if (typeof penaltyRule.value === "string" && penaltyRule.value.includes("%")) {
            penaltyRate = parsed / 100;
          } else if (parsed >= 1) {
            penaltyRate = parsed / 100;
          } else {
            penaltyRate = parsed;
          }
        }
      }

      // 1. Tính số ngày trễ và tiền phạt tại thời điểm hiện tại (nếu có áp dụng phạt)
      let late_days = 0;
      let penalty_amount = 0;
      if (invoice.apply_penalty) {
        const dueDate = invoice.payment_due_date
          ? new Date(invoice.payment_due_date)
          : new Date(invoice.wedding_date);
        const penaltyStart = new Date(dueDate);
        penaltyStart.setDate(penaltyStart.getDate() + 1);
        penaltyStart.setHours(0, 0, 0, 0);

        const payDate = new Date();
        payDate.setHours(0, 0, 0, 0);

        const diffMs = payDate - penaltyStart;
        late_days = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1 : 0;
        penalty_amount = late_days > 0 ? Math.round(invoice.remaining_amount * penaltyRate * late_days) : 0;
      }

      // Tổng số tiền cần thanh toán bao gồm nợ gốc và tiền phạt tính đến thời điểm hiện tại
      const total_required = invoice.remaining_amount + penalty_amount;

      if (new_paid_amount >= total_required) {
        // ── Fully paid (Thanh toán đủ cả gốc lẫn phạt) ──────────────────────
        updates.paid_amount = new_paid_amount;
        updates.status = "paid";
        updates.payment_date = new Date();
        updates.late_days = late_days;
        updates.penalty_amount = penalty_amount;
      } else {
        // ── Partial payment (Thanh toán một phần) ───────────────────────────
        updates.paid_amount = new_paid_amount;
        updates.status = "partial";
        // Đối với thanh toán một phần, chưa chốt ngày thanh toán cuối cùng
        // nên ta không cập nhật cố định payment_date, late_days và penalty_amount.
      }
    }

    // ── CASE B: Undo (reset everything) ────────────────────────────────────
    if (req.body.status === "unpaid" && req.body.payment_date === null) {
      updates.paid_amount = 0;
      updates.late_days = 0;
      updates.penalty_amount = 0;
      updates.payment_date = null;
      updates.status = "unpaid";
    }

    const doc = await Invoice.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: doc });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const remove = async (req, res) => {
  try {
    const doc = await Invoice.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hóa đơn!" });
    }
    // ── Không cho xóa hóa đơn đã thanh toán hoặc thanh toán một phần ─────────
    if (doc.status === "paid" || doc.status === "partial") {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa hóa đơn đã thanh toán hoặc thanh toán một phần! Vui lòng hoàn tác thanh toán trước.",
      });
    }
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Đã xóa hóa đơn!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
