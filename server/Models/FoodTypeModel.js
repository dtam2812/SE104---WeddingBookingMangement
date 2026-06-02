import mongoose from "mongoose";

const FoodTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

FoodTypeSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

FoodTypeSchema.set("toJSON", { virtuals: true });
FoodTypeSchema.set("toObject", { virtuals: true });

const FoodType =
  mongoose.models.FoodType || mongoose.model("FoodType", FoodTypeSchema);

export default FoodType;
