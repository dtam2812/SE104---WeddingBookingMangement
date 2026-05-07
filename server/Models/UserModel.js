import mongoose from "mongoose";

mongoose.plugin((schema) => {
  const transform = (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  };
  schema.set("toJSON", { virtuals: true, transform });
  schema.set("toObject", { virtuals: true, transform });
});

export const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    full_name: String,
    phone: String,
    email: String,
    role: String,
    status: String,
  }),
  "account",
);
