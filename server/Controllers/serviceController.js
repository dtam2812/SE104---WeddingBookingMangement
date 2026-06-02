import { Service, Wedding } from "../Models/index.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAll = async (req, res) => {
  try {
    const data = await Service.find().sort({ createdAt: 1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getById = async (req, res) => {
  try {
    const doc = await Service.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy dịch vụ!" });
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
      const existing = await Service.findOne({ name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" } });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Tên dịch vụ đã tồn tại!" });
      }
    }
    const doc = await Service.create(req.body);
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
      const existing = await Service.findOne({
        name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Tên dịch vụ đã tồn tại!" });
      }
    }
    const doc = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy dịch vụ!" });
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
    const wedding = await Wedding.findOne({
      "services.service_id": req.params.id,
    });
    if (wedding) {
      return res.status(400).json({
        success: false,
        message:
          "Không thể xóa dịch vụ này vì đã có trong tiệc cưới \"" +
          wedding.groom_name +
          " & " +
          wedding.bride_name +
          '"!',
      });
    }
    const doc = await Service.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy dịch vụ!" });
    }
    res.json({ success: true, message: "Đã xóa dịch vụ!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
