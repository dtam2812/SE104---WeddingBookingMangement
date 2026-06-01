import mongoose from "mongoose";

export async function connectDatabase() {
  const DB_URL = process.env.DB_URL;

  if (!DB_URL) {
    throw new Error("Thiếu biến môi trường DB_URL trong file .env!");
  }

  try {
    await mongoose.connect(DB_URL);
    console.log("Kết nối MongoDB thành công");

    // Tự động seed rule HAN_HUY_TIEC nếu chưa có
    const ruleExists = await mongoose.connection.db.collection("rules").findOne({ code: "HAN_HUY_TIEC" });
    if (!ruleExists) {
      await mongoose.connection.db.collection("rules").insertOne({
        code: "HAN_HUY_TIEC",
        value: "15 ngày",
        description: "Hạn hủy tiệc cưới để được hoàn tiền cọc",
      });
      console.log("Seeded rule HAN_HUY_TIEC successfully!");
    } else if (ruleExists.value === "15") {
      await mongoose.connection.db.collection("rules").updateOne(
        { code: "HAN_HUY_TIEC" },
        { $set: { value: "15 ngày" } }
      );
      console.log("Updated rule HAN_HUY_TIEC value to '15 ngày'");
    }
  } catch (err) {
    console.error("Lỗi kết nối MongoDB:", err.message);
    process.exit(1);
  }
}
