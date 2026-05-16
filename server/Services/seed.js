import { User, HallType, Hall, Food, Service, Rule } from "../Models/models.js";

export async function seedDatabase() {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log("Seeding initial data...");
      await User.create([
        {
          username: "admin",
          password: "123",
          full_name: "Quản trị viên",
          role: "admin",
          status: "Active",
        },
        {
          username: "nhanvien",
          password: "123",
          full_name: "Nhân viên tư vấn",
          role: "user",
          status: "Active",
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
          type_id: type1.id,
          type_name: "Sảnh Lớn",
          max_tables: 100,
          status: "Active",
        },
        {
          name: "Sảnh Vàng",
          type_id: type2.id,
          type_name: "Sảnh Vừa",
          max_tables: 50,
          status: "Active",
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
          code: "TIEN_PHAT",
          value: "1%",
          description: "Phạt trễ hạn mỗi ngày",
        },
      ]);
      console.log("Seeding complete.");
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}
