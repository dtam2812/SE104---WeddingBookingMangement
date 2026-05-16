import { User } from "../Models/index.js";

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (user) {
      if (user.status !== "Active") {
        return res
          .status(403)
          .json({ success: false, message: "Tài khoản đã bị khóa!" });
      }
      const userObj = user.toJSON();
      delete userObj.password;
      res.json({
        success: true,
        user: userObj,
        token: "mock_token_" + Math.random().toString(36).substring(2),
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Tài khoản hoặc mật khẩu không đúng!",
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
