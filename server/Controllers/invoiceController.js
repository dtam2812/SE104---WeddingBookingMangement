import { Invoice, Wedding } from "../Models/index.js";

export const getAll = async (req, res) => {
  try {
    const data = await Invoice.find();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRevenueReport = async (req, res) => {
  try {
    const invoices = await Invoice.find();
    const total = invoices.reduce(
      (sum, inv) => sum + (inv.total_amount || 0) + (inv.penalty_amount || 0),
      0,
    );
    res.json({ data: invoices, total_revenue: total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const body = req.body;

    if (body.wedding_id) {
      const wedding = await Wedding.findById(body.wedding_id);
      if (wedding) {
        body.wedding_date = wedding.wedding_date;
        body.groom_name = wedding.groom_name;
        body.bride_name = wedding.bride_name;
        body.deposit = wedding.deposit;

        const foods = wedding.foods || [];
        const services = wedding.services || [];

        let foodTotal = foods.reduce(
          (sum, f) => sum + (f.booked_price || f.price),
          0,
        );
        let serviceTotal = services.reduce(
          (sum, s) => sum + (s.booked_price || s.price) * (s.quantity || 1),
          0,
        );

        body.total_amount =
          foodTotal * Number(body.table_count || 0) + serviceTotal;
        body.status = "Chưa thanh toán";
        body.late_days = 0;
        body.penalty_amount = 0;
      }
    }

    const doc = await Invoice.create(body);
    res.json({ success: true, id: doc.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    await Invoice.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
