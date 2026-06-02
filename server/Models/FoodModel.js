import mongoose from "mongoose";

const FoodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    foodType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodType",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

const Food = mongoose.models.Food || mongoose.model("Food", FoodSchema);

export default Food;
