import { HallType } from "../Models/index.js";
import { Invoice } from "../Models/index.js";
import { Rule } from "../Models/index.js";

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
    const filter = { status: "paid" };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.payment_date = { $gte: start, $lt: end };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      filter.payment_date = { $gte: start, $lt: end };
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

export const create = async (req, res) => {
  const { wedding_id, payment_date } = req.body;

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

    const penaltyRule = await Rule.findOne({ code: "PENALTY_RATE" });
    const penaltyRate = penaltyRule ? Number(penaltyRule.value) : 0.01;

    const foodTotal =
      (wedding.foods || []).reduce(
        (sum, f) => sum + f.price * (f.quantity || 1),
        0,
      ) * wedding.table_count;

    // Tính tổng tiền dịch vụ
    const serviceTotal = (wedding.services || []).reduce(
      (sum, s) => sum + s.price * (s.quantity || 1),
      0,
    );

    const total_amount = foodTotal + serviceTotal;
    const remaining_amount = total_amount - (wedding.deposit || 0);

    let late_days = 0;
    let penalty_amount = 0;

    if (payment_date) {
      const weddingDate = new Date(wedding.wedding_date);
      const payDate = new Date(payment_date);
      const diffMs = payDate - weddingDate;
      late_days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      penalty_amount =
        late_days > 0
          ? Math.round(remaining_amount * penaltyRate * late_days)
          : 0;
    }

    const invoiceData = {
      wedding_id,
      // Snapshot từ wedding
      groom_name: wedding.groom_name,
      bride_name: wedding.bride_name,
      wedding_date: wedding.wedding_date,
      hall_name: wedding.hall_name,
      table_count: wedding.table_count,
      // Tài chính
      total_amount,
      deposit: wedding.deposit || 0,
      remaining_amount,
      payment_date: payment_date ? new Date(payment_date) : undefined,
      late_days,
      penalty_amount,
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

export const update = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy hóa đơn!" });
    }

    if (req.body.payment_date) {
      const penaltyRule = await Rule.findOne({ code: "PENALTY_RATE" });
      const penaltyRate = penaltyRule ? Number(penaltyRule.value) : 0.01;

      const weddingDate = new Date(invoice.wedding_date);
      const payDate = new Date(req.body.payment_date);
      const diffMs = payDate - weddingDate;
      const late_days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const penalty_amount =
        late_days > 0
          ? Math.round(invoice.remaining_amount * penaltyRate * late_days)
          : 0;

      req.body.late_days = late_days;
      req.body.penalty_amount = penalty_amount;
    }

    const doc = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
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
