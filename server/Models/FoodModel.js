import mongoose from "mongoose";

const FoodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    foodType: {
      type: String,
      required: true,
      enum: ["Khai vị", "Món chính", "Tráng miệng", "Đồ uống"],
      default: "Món chính",
    },
  },
  { timestamps: true },
);

const Food = mongoose.models.Food || mongoose.model("Food", FoodSchema);

export default Food;
