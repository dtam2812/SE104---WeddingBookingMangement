import bcrypt from "bcrypt";
import { User, HallType, Hall, Food, Service, Rule } from "../Models/index.js";

export async function seedDatabase() {
  try {
    const count = await User.countDocuments();
    if (count > 0) return;

    console.log(" Seeding initial data...");

    await User.create([
      {
        username: "admin",
        password: await bcrypt.hash("123", 10),
        full_name: "Quản trị viên",
        role: "admin",
        status: "active",
      },
      {
        username: "nhanvien",
        password: await bcrypt.hash("123", 10),
        full_name: "Nhân viên tư vấn",
        role: "staff",
        status: "active",
      },
    ]);

    const type1 = await HallType.create({
      name: "Sảnh Lớn",
      min_price: 5000000,
    });
    const type2 = await HallType.create({
      name: "Sảnh Vừa",
      min_price: 3000000,
    });

    await Hall.create([
      {
        name: "Sảnh Kim Cương",
        type_id: type1._id,
        max_tables: 100,
        status: "available",
      },
      {
        name: "Sảnh Vàng",
        type_id: type2._id,
        max_tables: 50,
        status: "available",
      },
    ]);

    await Food.create([
      { name: "Súp cua", price: 500000, notes: "Khai vị" },
      { name: "Gà bó xôi", price: 800000, notes: "Món chính" },
    ]);

    await Service.create([
      { name: "Ban nhạc", price: 2000000, description: "Ban nhạc 3 người" },
      {
        name: "Trang trí hoa tươi",
        price: 5000000,
        description: "Hoa hồng nhập khẩu",
      },
    ]);

    await Rule.create([
      {
        code: "PENALTY_RATE",
        value: "0.01",
        description: "Phạt trễ hạn 1%/ngày trên số tiền còn lại",
      },
    ]);

    console.log("Seeding complete.");
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}
