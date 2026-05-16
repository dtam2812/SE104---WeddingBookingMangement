import { Hall, HallType } from "../Models/index.js";

export const getAll = async (req, res) => {
  try {
    const data = await Hall.find();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAvailable = async (req, res) => {
  try {
    const halls = await Hall.find();
    res.json({ data: halls });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const body = req.body;

    if (body.type_id) {
      const type = await HallType.findById(body.type_id);
      body.type_name = type ? type.name : "";
    }

    const doc = await Hall.create(body);
    res.json({ success: true, id: doc.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const body = req.body;

    if (body.type_id) {
      const type = await HallType.findById(body.type_id);
      body.type_name = type ? type.name : "";
    }

    await Hall.findByIdAndUpdate(req.params.id, body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    await Hall.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
