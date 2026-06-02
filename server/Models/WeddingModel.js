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
    shift_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },
    shift: {
      type: String,
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

    payment_due_date: { type: Date },

    hall_min_price: { type: Number },

    status: {
      type: String,
      enum: ["cho_xac_nhan", "da_xac_nhan", "dang_dien_ra", "hoan_thanh", "da_huy"],
      default: "cho_xac_nhan",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

WeddingSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

const Wedding =
  mongoose.models.Wedding || mongoose.model("Wedding", WeddingSchema);

export default Wedding;
