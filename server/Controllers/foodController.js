import { Food, Wedding } from "../Models/index.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAll = async (req, res) => {
  try {
    const { type, sortBy, order } = req.query;

    const filter = {};
    if (type && type !== "all") {
      filter.foodType = type;
    }

    let sort = { createdAt: -1 };
    if (sortBy === "price") {
      sort = { price: order === "asc" ? 1 : -1 };
    } else if (sortBy === "name") {
      sort = { name: order === "desc" ? -1 : 1 };
    } else if (sortBy === "createdAt") {
      sort = { createdAt: order === "asc" ? 1 : -1 };
    }

    const data = await Food.find(filter).sort(sort);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getById = async (req, res) => {
  try {
    const doc = await Food.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy món ăn!" });
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
      const existing = await Food.findOne({ name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" } });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Tên món ăn đã tồn tại!" });
      }
    }
    const doc = await Food.create(req.body);
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
    const { name } = req.body;
    if (name) {
      const existing = await Food.findOne({
        name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Tên món ăn đã tồn tại!" });
      }
    }
    const doc = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy món ăn!" });
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
    const wedding = await Wedding.findOne({ "foods.food_id": req.params.id });
    if (wedding) {
      return res.status(400).json({
        success: false,
        message:
          "Không thể xóa món ăn này vì đã có trong tiệc cưới \"" +
          wedding.groom_name +
          " & " +
          wedding.bride_name +
          '"!',
      });
    }
    const doc = await Food.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy món ăn!" });
    }
    res.json({ success: true, message: "Đã xóa món ăn!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
