import mongoose from "mongoose";

export async function connectDatabase() {
  const DB_URL = process.env.DB_URL;

  if (!DB_URL) {
    throw new Error("Thiếu biến môi trường DB_URL trong file .env!");
  }

  try {
    await mongoose.connect(DB_URL);
    console.log("Kết nối MongoDB thành công");
  } catch (err) {
    console.error("Lỗi kết nối MongoDB:", err.message);
    process.exit(1);
  }
}
