import mongoose from "mongoose";

mongoose.plugin((schema) => {
  const transform = (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  };
  schema.set("toJSON", { virtuals: true, transform });
  schema.set("toObject", { virtuals: true, transform });
});

export const Wedding = mongoose.model(
  "Wedding",
  new mongoose.Schema({
    groom_name: String,
    bride_name: String,
    phone: String,
    wedding_date: String,
    shift: String,
    hall_id: String,
    hall_name: String,
    table_count: Number,
    reserve_table_count: Number,
    deposit: Number,
    foods: Array,
    services: Array,
  }),
  "weddings",
);
