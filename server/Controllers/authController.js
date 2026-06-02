import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/index.js";

const SALT_ROUNDS = 10;

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập tài khoản và mật khẩu!",
    });
  }

  try {
    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản hoặc mật khẩu không đúng!",
      });
    }

    if (user.status !== "active") {
      return res
        .status(403)
        .json({ success: false, message: "Tài khoản đã bị khóa!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản hoặc mật khẩu không đúng!",
      });
    }

    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: Number(process.env.JWT_EXPIRES_IN) || 3600,
    });
    const userObj = user.toJSON();
    delete userObj.password;

    res.json({ success: true, token, user: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập đầy đủ thông tin!",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Mật khẩu phải có ít nhất 6 ký tự!",
    });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Tài khoản không tồn tại!",
      });
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashed;
    await user.save();

    res.json({ success: true, message: "Đổi mật khẩu thành công!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
