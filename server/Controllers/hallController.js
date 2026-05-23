import { Hall, Wedding } from "../Models/index.js";

const POPULATE_TYPE = { path: "type_id", select: "name min_price" };

export const getAll = async (req, res) => {
  try {
    const data = await Hall.find()
      .populate(POPULATE_TYPE)
      .sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getById = async (req, res) => {
  try {
    const doc = await Hall.findById(req.params.id).populate(POPULATE_TYPE);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sảnh!" });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAvailable = async (req, res) => {
  const { date, shift } = req.query;

  if (!date || !shift) {
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng cung cấp date và shift!" });
  }

  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedWeddings = await Wedding.find({
      wedding_date: { $gte: startOfDay, $lte: endOfDay },
      shift,
      status: { $nin: ["cancelled"] },
    }).select("hall_id");

    const bookedHallIds = bookedWeddings.map((w) => w.hall_id);

    const available = await Hall.find({
      _id: { $nin: bookedHallIds },
      status: "available",
    }).populate(POPULATE_TYPE);

    res.json({ success: true, data: available });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const doc = await Hall.create(req.body);
    const populated = await doc.populate(POPULATE_TYPE);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const update = async (req, res) => {
  try {
    if (req.body.status) {
      const statusMap = {
        Active: "available",
        active: "available",
        Inactive: "unavailable",
        inactive: "unavailable",
        maintaining: "unavailable",
      };
      req.body.status = statusMap[req.body.status] ?? req.body.status;
    }

    const doc = await Hall.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    }).populate(POPULATE_TYPE);

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sảnh!" });
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    const doc = await Hall.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sảnh!" });
    }
    res.json({ success: true, message: "Đã xóa sảnh!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
