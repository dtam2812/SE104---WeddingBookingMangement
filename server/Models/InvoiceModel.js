import mongoose from "mongoose";

mongoose.plugin((schema) => {
  const transform = (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  };
  schema.set("toJSON", { virtuals: true, transform });
  schema.set("toObject", { virtuals: true, transform });
});

export const Invoice = mongoose.model(
  "Invoice",
  new mongoose.Schema({
    wedding_id: String,
    wedding_date: String,
    payment_date: String,
    groom_name: String,
    bride_name: String,
    table_count: Number,
    total_amount: Number,
    deposit: Number,
    late_days: Number,
    penalty_amount: Number,
    status: String,
  }),
  "orders",
);
