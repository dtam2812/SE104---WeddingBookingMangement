import { Role, User } from "../Models/index.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAll = async (req, res) => {
  try {
    const data = await Role.find().sort({ name: 1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getById = async (req, res) => {
  try {
    const doc = await Role.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy vai trò!" });
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
      const existing = await Role.findOne({
        name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
      });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Tên vai trò đã tồn tại!" });
      }
    }
    const doc = await Role.create(req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Tên vai trò đã tồn tại!" });
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
    const old = await Role.findById(req.params.id);
    if (!old) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy vai trò!" });
    }
    if (name) {
      const existing = await Role.findOne({
        name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Tên vai trò đã tồn tại!" });
      }
    }
    const doc = await Role.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (name && name !== old.name) {
      await User.updateMany(
        { $or: [{ role: old.name }, { role: req.params.id }] },
        { role: name },
      );
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ success: false, message: "Tên vai trò đã tồn tại!" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy vai trò!" });
    }
    const userUsing = await User.findOne({
      $or: [{ role: req.params.id }, { role: role.name }],
    });
    if (userUsing) {
      return res.status(400).json({
        success: false,
        message:
          'Không thể xóa vai trò này vì đang được sử dụng bởi tài khoản "' +
          userUsing.username +
          '"!',
      });
    }
    const doc = await Role.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy vai trò!" });
    }
    res.json({ success: true, message: "Đã xóa vai trò!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
