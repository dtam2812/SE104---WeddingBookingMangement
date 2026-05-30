# 💍 Wedding Booking Management

Hệ thống website quản lý đặt tiệc cưới — cho phép quản lý sảnh, tiệc cưới, hóa đơn, thực đơn, dịch vụ và báo cáo doanh thu.

---

## 📚 Thông tin môn học

|                          |                                           |
| ------------------------ | ----------------------------------------- |
| **Môn học**              | SE104 — Nhập môn Công nghệ Phần mềm       |
| **Đề tài**               | Thiết kế hệ thống quản lý tiệc cưới       |
| **Giảng viên hướng dẫn** | Đỗ Thị Thanh Tuyền                        |
| **Nhóm**                 | Nhóm 1                                    |
| **Trường**               | Đại học Công nghệ Thông tin — ĐHQG TP.HCM |

---

## 👥 Nhóm sinh viên thực hiện

| Tên                 | MSSV     | Lớp       |
| ------------------- | -------- | --------- |
| Đinh Nguyễn Đức Tâm | 23521384 | SE104.Q21 |
| Nguyễn Phước Thịnh  | 23521505 | SE104.Q21 |
| Đỗ Tấn Tường        | 23521749 | SE104.Q21 |
| Trần Thành Vinh     | 23521799 | SE104.Q21 |
| Lê Văn Quý          | 23521317 | SE104.Q23 |

---

## 🔗 Repository

[https://github.com/dtam2812/SE104---WeddingBookingMangement](https://github.com/dtam2812/SE104---WeddingBookingMangement)

---

## 🛠️ Công nghệ sử dụng

| Thành phần | Công nghệ                      |
| ---------- | ------------------------------ |
| Frontend   | React.js (Vite) + Tailwind CSS |
| Backend    | Node.js + Express.js           |
| Database   | MongoDB Atlas                  |
| Auth       | JWT (JSON Web Token)           |

---

## ⚙️ Cấu hình môi trường

Tạo file `.env` trong thư mục `server/` với nội dung sau:

```env
JWT_SECRET=jwtSecret
PORT=8080
DB_URL=mongodb+srv://nguyenductam98765_db_user:dtam2812@cluster0.rhi4hs0.mongodb.net/WeddingManagement
JWT_EXPIRES_IN=8h
```

---

## 🚀 Hướng dẫn cài đặt và chạy dự án

### Yêu cầu hệ thống

- [Node.js](https://nodejs.org/) >= 18.x
- npm >= 9.x
- Kết nối Internet (để kết nối MongoDB Atlas)

---

### Bước 1 — Clone dự án

```bash
git clone https://github.com/dtam2812/SE104---WeddingBookingMangement.git
cd SE104---WeddingBookingMangement
```

---

### Bước 2 — Cấu hình biến môi trường

Tạo file `.env` trong thư mục `server/` và dán nội dung sau vào:

```env
JWT_SECRET=jwtSecret
PORT=5000
DB_URL=mongodb+srv://nguyenductam98765_db_user:dtam2812@cluster0.rhi4hs0.mongodb.net/WeddingManagement
JWT_EXPIRES_IN=8h
```

---

### Bước 3 — Cài đặt và chạy Backend (Server)

```bash
cd server
npm install
npm start
```

> Server sẽ chạy tại: `http://localhost:8080`

---

### Bước 4 — Cài đặt và chạy Frontend (Client)

Mở terminal mới, sau đó:

```bash
cd client
npm install
npm run dev
```

> Ứng dụng sẽ chạy tại: `http://localhost:5173`

---

## 🔑 Tài khoản đăng nhập mặc định

| Vai trò | Tên đăng nhập | Mật khẩu |
| ------- | ------------- | -------- |
| Admin   | admin         | 123456   |

---

## 📁 Cấu trúc thư mục

```
SE104---WeddingBookingMangement/
├── client/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/      # Layout, các component dùng chung
│   │   ├── pages/           # Các màn hình chính
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Accounts.jsx
│   │   │   ├── Weddings.jsx
│   │   │   ├── Invoices.jsx
│   │   │   ├── Halls.jsx
│   │   │   ├── Foods.jsx
│   │   │   ├── Services.jsx
│   │   │   ├── Rules.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── ResetPassword.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── server/                  # Backend (Node.js + Express)
    ├── Controllers/         # Xử lý logic nghiệp vụ
    ├── Models/              # Định nghĩa schema MongoDB
    ├── Router/              # Định nghĩa các API route
    ├── Middleware/          # Xác thực JWT
    ├── Services/            # Kết nối database
    ├── .env                 # Biến môi trường (tự tạo)
    ├── server.js
    └── package.json
```

---

## 📋 Các chức năng chính

- ✅ Đăng nhập / Đặt lại mật khẩu
- ✅ Quản lý tài khoản (Admin/Nhân viên)
- ✅ Quản lý đặt tiệc cưới
- ✅ Quản lý sảnh & tra cứu sảnh trống
- ✅ Quản lý thực đơn & dịch vụ
- ✅ Lập hóa đơn & thanh toán
- ✅ Tính tiền phạt trễ hạn tự động
- ✅ Báo cáo doanh thu theo tháng/năm
- ✅ Xuất báo cáo ra file Excel
