import * as Models from "../Models/models.js";

const modelsMap = {
  halls: Models.Hall,
  "hall-types": Models.HallType,
  foods: Models.Food,
  services: Models.Service,
  users: Models.User,
  rules: Models.Rule,
  weddings: Models.Wedding,
  invoices: Models.Invoice,
};

export const getAvailableHalls = async (req, res) => {
  try {
    const halls = await Models.Hall.find();
    res.json({ data: halls });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRevenueReport = async (req, res) => {
  try {
    const invoices = await Models.Invoice.find();
    const total = invoices.reduce(
      (sum, inv) => sum + (inv.total_amount || 0) + (inv.penalty_amount || 0),
      0,
    );
    res.json({ data: invoices, total_revenue: total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAll = async (req, res) => {
  const Model = modelsMap[req.params.resource];
  if (!Model) return res.status(404).json({ message: "Resource not found" });
  try {
    const data = await Model.find();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const create = async (req, res) => {
  const resource = req.params.resource;
  const Model = modelsMap[resource];
  if (!Model) return res.status(404).json({ message: "Resource not found" });

  const body = req.body;

  try {
    if (resource === "halls" && body.type_id) {
      const type = await Models.HallType.findById(body.type_id);
      body.type_name = type ? type.name : "";
    }

    if (resource === "weddings" && body.hall_id) {
      const hall = await Models.Hall.findById(body.hall_id);
      body.hall_name = hall ? hall.name : "";
    }

    if (resource === "invoices" && body.wedding_id) {
      const wedding = await Models.Wedding.findById(body.wedding_id);
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

    const doc = await Model.create(body);
    res.json({ success: true, id: doc.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const update = async (req, res) => {
  const resource = req.params.resource;
  const Model = modelsMap[resource];
  if (!Model) return res.status(404).json({ message: "Resource not found" });

  const body = req.body;

  try {
    if (resource === "halls" && body.type_id) {
      const type = await Models.HallType.findById(body.type_id);
      body.type_name = type ? type.name : "";
    }

    if (resource === "weddings" && body.hall_id) {
      const hall = await Models.Hall.findById(body.hall_id);
      body.hall_name = hall ? hall.name : "";s
    }

    await Model.findByIdAndUpdate(req.params.id, body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const remove = async (req, res) => {
  const Model = modelsMap[req.params.resource];
  if (!Model) return res.status(404).json({ message: "Resource not found" });
  try {
    await Model.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
