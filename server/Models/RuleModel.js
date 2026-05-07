import mongoose from "mongoose";

mongoose.plugin((schema) => {
  const transform = (doc, ret) => {
    delete ret._id;
    delete ret.__v;
  };
  schema.set("toJSON", { virtuals: true, transform });
  schema.set("toObject", { virtuals: true, transform });
});

export const Rule = mongoose.model(
  "Rule",
  new mongoose.Schema({
    code: { type: String, unique: true },
    value: String,
    description: String,
  }),
  "rules",
);
