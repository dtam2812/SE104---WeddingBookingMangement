import { FoodType, Food } from "../Models/index.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAll = async (req, res) => {
  try {
    const data = await FoodType.find().sort({ createdAt: 1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getById = async (req, res) => {
  try {
    const doc = await FoodType.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy loại món ăn!" });
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
      const existing = await FoodType.findOne({
        name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
      });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Tên loại món ăn đã tồn tại!" });
      }
    }
    const doc = await FoodType.create(req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Tên loại món ăn đã tồn tại!" });
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
      const existing = await FoodType.findOne({
        name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Tên loại món ăn đã tồn tại!" });
      }
    }
    const doc = await FoodType.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy loại món ăn!" });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Tên loại món ăn đã tồn tại!" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const foodUsing = await Food.findOne({ foodType: req.params.id });
    if (foodUsing) {
      return res.status(400).json({
        success: false,
        message:
          'Không thể xóa loại món ăn này vì đang được sử dụng bởi món ăn "' +
          foodUsing.name +
          '"!',
      });
    }
    const doc = await FoodType.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy loại món ăn!" });
    }
    res.json({ success: true, message: "Đã xóa loại món ăn!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
