import { Wedding, Hall } from "../Models/index.js";

export const getAll = async (req, res) => {
  try {
    const data = await Wedding.find();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const body = req.body;

    if (body.hall_id) {
      const hall = await Hall.findById(body.hall_id);
      body.hall_name = hall ? hall.name : "";
    }

    const doc = await Wedding.create(body);
    res.json({ success: true, id: doc.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const body = req.body;

    if (body.hall_id) {
      const hall = await Hall.findById(body.hall_id);
      body.hall_name = hall ? hall.name : "";
    }

    await Wedding.findByIdAndUpdate(req.params.id, body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    await Wedding.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
