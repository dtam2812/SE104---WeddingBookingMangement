import mongoose from "mongoose";

mongoose.plugin((schema) => {
  const transform = (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  };
  schema.set("toJSON", { virtuals: true, transform });
  schema.set("toObject", { virtuals: true, transform });
});

export const Food = mongoose.model(
  "Food",
  new mongoose.Schema({
    name: { type: String, required: true },
    price: Number,
    notes: String,
  }),
  "foods",
);
