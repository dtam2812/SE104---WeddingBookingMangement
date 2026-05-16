import mongoose from "mongoose";

const HallTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    min_price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

const HallType =
  mongoose.models.HallType || mongoose.model("HallType", HallTypeSchema);

export default HallType;
