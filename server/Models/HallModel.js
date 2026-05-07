import mongoose from "mongoose";

mongoose.plugin((schema) => {
  const transform = (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  };
  schema.set("toJSON", { virtuals: true, transform });
  schema.set("toObject", { virtuals: true, transform });
});

export const Hall = mongoose.model(
  "Hall",
  new mongoose.Schema({
    name: { type: String, required: true },
    type_id: String,
    type_name: String,
    max_tables: Number,
    status: String,
  }),
  "halls",
);
