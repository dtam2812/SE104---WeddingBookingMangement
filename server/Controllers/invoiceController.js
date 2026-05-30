import { HallType } from "../Models/index.js";
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
    const { month, year } = req.query;
    const filter = {};

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.wedding_date = { $gte: start, $lt: end };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      filter.wedding_date = { $gte: start, $lt: end };
    }

    const invoices = await Invoice.find(filter);
    const total_revenue = invoices.reduce(
      (sum, inv) => sum + inv.total_amount + inv.penalty_amount,
      0,
    );
    const total_penalty = invoices.reduce(
      (sum, inv) => sum + inv.penalty_amount,
      0,
    );

    res.json({ success: true, data: invoices, total_revenue, total_penalty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── CREATE ──────────────────────────────────────────────────────────────────
export const create = async (req, res) => {
  const { wedding_id, table_count, apply_penalty } = req.body;

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

    const total_amount = foodTotal + serviceTotal;
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
      late_days: 0,
      penalty_amount: 0,
      // ✅ NEW: store penalty preference
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

      // Fetch penalty rate
      const penaltyRule = await Rule.findOne({ code: "PENALTY_RATE" });
      const penaltyRate = penaltyRule ? Number(penaltyRule.value) : 0.01;

      if (new_paid_amount >= invoice.remaining_amount) {
        // ── Fully paid ────────────────────────────────────────────────────
        updates.paid_amount = new_paid_amount;
        updates.status = "paid";
        updates.payment_date = new Date();

        if (invoice.apply_penalty) {
          // Penalty starts 1 day after wedding date
          const weddingDate = new Date(invoice.wedding_date);
          const penaltyStart = new Date(weddingDate);
          penaltyStart.setDate(penaltyStart.getDate() + 1);
          penaltyStart.setHours(0, 0, 0, 0);

          const payDate = new Date();
          payDate.setHours(0, 0, 0, 0);

          const diffMs = payDate - penaltyStart;
          const late_days =
            diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1 : 0;

          updates.late_days = late_days;
          updates.penalty_amount =
            late_days > 0
              ? Math.round(invoice.remaining_amount * penaltyRate * late_days)
              : 0;
        }
      } else {
        // ── Partial payment ───────────────────────────────────────────────
        updates.paid_amount = new_paid_amount;
        updates.status = "partial";
        // No payment_date or penalty yet — will be applied on final payment
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
    const doc = await Invoice.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hóa đơn!" });
    }
    res.json({ success: true, message: "Đã xóa hóa đơn!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
