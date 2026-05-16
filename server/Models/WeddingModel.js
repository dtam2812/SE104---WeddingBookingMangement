import mongoose from "mongoose";

const WeddingFoodSchema = new mongoose.Schema(
  {
    food_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { _id: false },
);

const WeddingServiceSchema = new mongoose.Schema(
  {
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { _id: false },
);

const WeddingSchema = new mongoose.Schema(
  {
    groom_name: { type: String, required: true, trim: true },
    bride_name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },

    wedding_date: { type: Date, required: true },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
      required: true,
    },

    hall_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hall",
      required: true,
    },
    hall_name: { type: String, required: true },

    table_count: { type: Number, required: true, min: 1 },
    reserve_table_count: { type: Number, default: 0, min: 0 },

    deposit: { type: Number, default: 0, min: 0 },

    foods: [WeddingFoodSchema],
    services: [WeddingServiceSchema],

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

const Wedding =
  mongoose.models.Wedding || mongoose.model("Wedding", WeddingSchema);

export default Wedding;
