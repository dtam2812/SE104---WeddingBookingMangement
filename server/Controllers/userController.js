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
    const { username, password, full_name, phone, email, role, status } =
      req.body;

    if (!username || !username.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập tên tài khoản!" });
    }
    if (!full_name || !full_name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập họ tên!" });
    }
    if (!password || !password.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập mật khẩu!" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const doc = await User.create({
      username: username.trim(),
      password: hashedPassword,
      full_name: full_name.trim(),
      phone: phone?.trim() || "",
      email: email?.trim() || "",
      role: role || "staff",
      status: status || "active",
    });

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
    const { password, full_name, phone, email, role, status } = req.body;

    const updateData = {};

    if (full_name && full_name.trim()) updateData.full_name = full_name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Không có dữ liệu nào để cập nhật!" });
    }

    const doc = await User.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: "after",
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
