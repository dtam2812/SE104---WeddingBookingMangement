import { Rule } from "../Models/index.js";

export const getAll = async (req, res) => {
  try {
    const data = await Rule.find().sort({ code: 1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getByCode = async (req, res) => {
  try {
    const doc = await Rule.findOne({ code: req.params.code.toUpperCase() });
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy quy định!" });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const doc = await Rule.create(req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Mã quy định '${req.body.code}' đã tồn tại!`,
      });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const doc = await Rule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy quy định!" });
    }
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
    const doc = await Rule.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy quy định!" });
    }
    res.json({ success: true, message: "Đã xóa quy định!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
