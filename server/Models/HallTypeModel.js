import mongoose from "mongoose";

const HallTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    min_price: { type: Number, default: 0, min: 0 },
    description: { type: String, trim: true, default: "" },
    capacity_min: { type: Number, default: 0, min: 0 },
    capacity_max: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

const HallType =
  mongoose.models.HallType || mongoose.model("HallType", HallTypeSchema);

export default HallType;
