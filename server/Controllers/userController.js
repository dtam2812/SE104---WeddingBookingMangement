import bcrypt from "bcrypt";
import { User } from "../Models/index.js";
const SALT_ROUNDS = 10;

export const getAll = async (req, res) => {
  try {
    const data = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getById = async (req, res) => {
  try {
    const doc = await User.findById(req.params.id).select("-password");
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng!" });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const body = { ...req.body };

    if (!body.password) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập mật khẩu!" });
    }

    body.password = await bcrypt.hash(body.password, SALT_ROUNDS);

    const doc = await User.create(body);
    const result = doc.toJSON();
    delete result.password;

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Tên đăng nhập đã tồn tại!" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const body = { ...req.body };

    if (body.password) {
      body.password = await bcrypt.hash(body.password, SALT_ROUNDS);
    }

    const doc = await User.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng!" });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Tên đăng nhập đã tồn tại!" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const doc = await User.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng!" });
    }
    res.json({ success: true, message: "Đã xóa người dùng!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
