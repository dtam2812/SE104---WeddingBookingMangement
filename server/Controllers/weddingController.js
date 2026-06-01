import { Wedding, Hall, Invoice, HallType, Rule } from "../Models/index.js";

const formatWedding = (w) => ({
  ...w,
  id: w._id.toString(),
  hall_id: w.hall_id ? w.hall_id.toString() : null,
});

const getHallMinPrice = async (hallId) => {
  if (!hallId) return 0;
  const hall = await Hall.findById(hallId);
  if (hall && hall.type_id) {
    const hallType = await HallType.findById(hall.type_id);
    if (hallType) {
      return hallType.min_price || 0;
    }
  }
  return 0;
};

const calculateWeddingTotal = async (data) => {
  const tableCount = Number(data.table_count) || 0;

  // Calculate food total
  const foodTotal = (data.foods || []).reduce(
    (sum, f) => sum + (f.booked_price || f.price || 0) * (f.quantity || 1),
    0,
  ) * tableCount;

  // Calculate service total
  const serviceTotal = (data.services || []).reduce(
    (sum, s) => sum + (s.price || s.booked_price || 0) * (s.quantity || 1),
    0,
  );

  // Calculate hall total
  let hallTotal = 0;
  if (data.hall_id) {
    if (data.hall_min_price !== undefined && data.hall_min_price !== null) {
      hallTotal = data.hall_min_price * tableCount;
    } else {
      const hall = await Hall.findById(data.hall_id);
      if (hall && hall.type_id) {
        const hallType = await HallType.findById(hall.type_id);
        if (hallType) {
          hallTotal = (hallType.min_price || 0) * tableCount;
        }
      }
    }
  }

  return foodTotal + serviceTotal + hallTotal;
};

// ── Auto-update statuses based on wedding_date ──────────────────────────
async function autoUpdateStatuses() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // da_xac_nhan + wedding_date <= today → dang_dien_ra
  await Wedding.updateMany(
    {
      status: "da_xac_nhan",
      wedding_date: { $lte: endOfToday },
    },
    { $set: { status: "dang_dien_ra" } },
  );

  // dang_dien_ra + wedding_date < today → hoan_thanh
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(23, 59, 59, 999);

  await Wedding.updateMany(
    {
      status: "dang_dien_ra",
      wedding_date: { $lte: startOfYesterday },
    },
    { $set: { status: "hoan_thanh" } },
  );
}

export const getAll = async (req, res) => {
  try {
    await autoUpdateStatuses();

    const { date, month, year, hall_id } = req.query;
    const filter = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.wedding_date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.wedding_date = { $gte: start, $lt: end };
    } else if (year && !month) {
      const start = new Date(year, 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      filter.wedding_date = { $gte: start, $lt: end };
    }
    if (hall_id) {
      filter.hall_id = hall_id;
    }

    const data = await Wedding.find(filter).lean();
    const formatted = data.map(formatWedding);
    res.json({ data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const body = req.body;

    // ── Validate phone number format (exactly 10 digits) ────────────────────
    if (!body.phone || !/^\d{10}$/.test(body.phone)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại phải chứa đúng 10 chữ số!",
      });
    }

    // ── Validate wedding_date >= tomorrow ──────────────────────────────────
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const wDate = new Date(body.wedding_date);
    wDate.setHours(0, 0, 0, 0);
    if (wDate < tomorrow) {
      return res.status(400).json({
        success: false,
        message: "Ngày đãi tiệc phải từ ngày mai trở đi!",
      });
    }

    // ── Validate table_count + reserve <= hall.max_tables ──────────────────
    if (body.hall_id) {
      const hall = await Hall.findById(body.hall_id);
      if (!hall) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy sảnh!" });
      }
      body.hall_name = hall.name;

      const totalTables =
        Number(body.table_count) + Number(body.reserve_table_count || 0);
      if (totalTables > hall.max_tables) {
        return res.status(400).json({
          success: false,
          message: `Số bàn (${body.table_count}) + dự trữ (${body.reserve_table_count || 0}) = ${totalTables} vượt quá sức chứa tối đa của sảnh (${hall.max_tables} bàn)!`,
        });
      }
    }

    // ── Lock hall price if status is confirmed ────────────────────────────
    if (body.status && body.status !== "cho_xac_nhan") {
      body.hall_min_price = await getHallMinPrice(body.hall_id);
    }

    // ── Validate deposit <= tổng tiệc ──────────────────────────────────────
    const total = await calculateWeddingTotal(body);
    const deposit = Number(body.deposit) || 0;
    if (total > 0 && deposit > total) {
      return res.status(400).json({
        success: false,
        message: `Tiền đặt cọc (${deposit.toLocaleString("vi-VN")} đ) không được vượt quá tổng tiền tiệc (${total.toLocaleString("vi-VN")} đ)!`,
      });
    }

    const doc = await Wedding.create(body);
    res.json({ success: true, id: doc._id.toString() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    const body = req.body;

    // ── Validate phone number format if provided ───────────────────────────
    if (body.phone !== undefined && !/^\d{10}$/.test(body.phone)) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại phải chứa đúng 10 chữ số!",
      });
    }

    // ── Lấy dữ liệu tiệc hiện tại để bù vào các trường không được gửi lên ───────────────
    const currentWedding = await Wedding.findById(req.params.id);
    if (!currentWedding) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tiệc cưới!" });
    }

    // ── Validate table_count + reserve <= hall.max_tables ──────────────────
    if (body.hall_id) {
      const hall = await Hall.findById(body.hall_id);
      if (!hall) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy sảnh!" });
      }
      body.hall_name = hall.name;

      const totalTables =
        Number(body.table_count) + Number(body.reserve_table_count || 0);
      if (totalTables > hall.max_tables) {
        return res.status(400).json({
          success: false,
          message: `Số bàn (${body.table_count}) + dự trữ (${body.reserve_table_count || 0}) = ${totalTables} vượt quá sức chứa tối đa của sảnh (${hall.max_tables} bàn)!`,
        });
      }
    }

    // ── Kiểm tra trùng lịch sảnh ────────────────────────────────────────────
    const effectiveHallId = body.hall_id || currentWedding.hall_id;
    const effectiveDate   = body.wedding_date || currentWedding.wedding_date;
    const effectiveShift  = body.shift || currentWedding.shift;

    if (effectiveHallId && effectiveDate && effectiveShift) {
      const startOfDay = new Date(effectiveDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(effectiveDate);
      endOfDay.setHours(23, 59, 59, 999);

      const conflict = await Wedding.findOne({
        _id: { $ne: req.params.id },
        hall_id: effectiveHallId,
        wedding_date: { $gte: startOfDay, $lte: endOfDay },
        shift: effectiveShift,
        status: { $nin: ["da_huy"] },
      });

      if (conflict) {
        const hallName = body.hall_name || currentWedding.hall_name;
        return res.status(400).json({
          success: false,
          message: `Sảnh “${hallName}” đã được đặt cho tiệc “${conflict.groom_name} & ${conflict.bride_name}” ca ${effectiveShift} ngày này!`,
        });
      }
    }

    // ── Xử lý khóa giá sảnh ────────────────────────────────────────────────
    const effectiveStatus = body.status !== undefined ? body.status : currentWedding.status;

    if (effectiveStatus !== "cho_xac_nhan") {
      const isStatusTransitionToConfirmed = currentWedding.status === "cho_xac_nhan";
      const isHallChanged = body.hall_id !== undefined && String(body.hall_id) !== String(currentWedding.hall_id);
      
      if (isStatusTransitionToConfirmed || isHallChanged || currentWedding.hall_min_price === undefined || currentWedding.hall_min_price === null) {
        body.hall_min_price = await getHallMinPrice(effectiveHallId);
      } else {
        body.hall_min_price = currentWedding.hall_min_price;
      }
    } else {
      body.hall_min_price = null;
    }

    // ── Validate deposit <= tổng tiệc ──────────────────────────────────────
    const mergedData = {
      table_count: body.table_count !== undefined ? body.table_count : currentWedding.table_count,
      foods: body.foods !== undefined ? body.foods : currentWedding.foods,
      services: body.services !== undefined ? body.services : currentWedding.services,
      hall_id: body.hall_id !== undefined ? body.hall_id : currentWedding.hall_id,
      hall_min_price: body.hall_min_price !== undefined ? body.hall_min_price : currentWedding.hall_min_price,
    };

    const total = await calculateWeddingTotal(mergedData);
    const deposit = body.deposit !== undefined ? Number(body.deposit) || 0 : currentWedding.deposit || 0;

    if (total > 0 && deposit > total) {
      return res.status(400).json({
        success: false,
        message: `Tiền đặt cọc (${deposit.toLocaleString("vi-VN")} đ) không được vượt quá tổng tiền tiệc (${total.toLocaleString("vi-VN")} đ)!`,
      });
    }

    // ── Xử lý khi trạng thái chuyển sang Đã Hủy ──────────────────────────────
    if (body.status === "da_huy" && currentWedding.status !== "da_huy") {
      // 1. Kiểm tra xem có hóa đơn liên quan không
      const invoice = await Invoice.findOne({ wedding_id: req.params.id });
      if (invoice) {
        return res.status(400).json({
          success: false,
          message: "Không thể hủy tiệc cưới đã có hóa đơn liên quan! Vui lòng xóa/hoàn tác hóa đơn trước.",
        });
      }

      // 2. Tính khoảng cách từ ngày cưới đến ngày hiện tại
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const wDate = new Date(currentWedding.wedding_date);
      wDate.setHours(0, 0, 0, 0);

      const diffMs = wDate - today;
      const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // 3. Lấy hạn hủy tiệc từ quy định
      const rule = await Rule.findOne({ code: "HAN_HUY_TIEC" });
      const limitDays = rule ? parseInt(rule.value) : 15; // default 15 days

      if (daysRemaining >= limitDays) {
        // Hủy sớm: Hoàn cọc (deposit = 0)
        body.deposit = 0;
        await Wedding.findByIdAndUpdate(req.params.id, body);
        return res.json({
          success: true,
          message: `Đã hủy tiệc cưới thành công và hoàn trả tiền đặt cọc do hủy trước ngày cưới ${daysRemaining} ngày (Hạn quy định là ${limitDays} ngày).`,
        });
      } else {
        // Hủy trễ: Giữ nguyên cọc
        await Wedding.findByIdAndUpdate(req.params.id, body);
        return res.json({
          success: true,
          message: `Đã hủy tiệc cưới thành công. Tiền đặt cọc (${(currentWedding.deposit || 0).toLocaleString("vi-VN")} đ) không được hoàn trả do hủy muộn (chỉ còn ${daysRemaining} ngày trước ngày cưới, hạn quy định là ${limitDays} ngày).`,
        });
      }
    }

    await Wedding.findByIdAndUpdate(req.params.id, body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const doc = await Wedding.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tiệc cưới!" });
    }

    // ── Không cho xóa tiệc đang diễn ra hoặc đã hoàn thành ─────────────────
    if (doc.status === "dang_dien_ra") {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa tiệc cưới đang diễn ra!",
      });
    }
    if (doc.status === "hoan_thanh") {
      return res.status(400).json({
        success: false,
        message: "Không thể xóa tiệc cưới đã hoàn thành!",
      });
    }

    const invoice = await Invoice.findOne({ wedding_id: req.params.id });
    if (invoice) {
      return res.status(400).json({
        success: false,
        message:
          "Không thể xóa tiệc cưới này vì đã có hóa đơn liên quan (Mã hóa đơn: " +
          invoice._id.toString().slice(-6).toUpperCase() +
          ")!",
      });
    }
    await Wedding.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Đã xóa tiệc cưới thành công!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
