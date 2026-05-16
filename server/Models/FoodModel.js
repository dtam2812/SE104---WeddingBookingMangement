import mongoose from "mongoose";

const FoodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

const Food = mongoose.models.Food || mongoose.model("Food", FoodSchema);

export default Food;
