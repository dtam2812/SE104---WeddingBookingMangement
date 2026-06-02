import { Shift } from "../Models/index.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAll = async (req, res) => {
  try {
    const data = await Shift.find().sort({ startTime: 1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getById = async (req, res) => {
  try {
    const doc = await Shift.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy ca!" });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { name } = req.body;
    if (name) {
      const existing = await Shift.findOne({
        name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
      });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Tên ca đã tồn tại!" });
      }
    }
    const doc = await Shift.create(req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Tên ca đã tồn tại!" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const { name } = req.body;
    if (name) {
      const existing = await Shift.findOne({
        name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Tên ca đã tồn tại!" });
      }
    }
    const doc = await Shift.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy ca!" });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Tên ca đã tồn tại!" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const doc = await Shift.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy ca!" });
    }
    res.json({ success: true, message: "Đã xóa ca!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
