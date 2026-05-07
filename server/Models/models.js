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
); // Map to 'account' collection

export const HallType = mongoose.model(
  "HallType",
  new mongoose.Schema({
    name: { type: String, required: true },
    min_price: Number,
  }),
  "hall_types",
);

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
); // Map to 'halls' collection

export const Food = mongoose.model(
  "Food",
  new mongoose.Schema({
    name: { type: String, required: true },
    price: Number,
    notes: String,
  }),
  "foods",
); // Map to 'foods' collection

export const Service = mongoose.model(
  "Service",
  new mongoose.Schema({
    name: { type: String, required: true },
    price: Number,
    description: String,
  }),
  "services",
); // Map to 'services' collection

export const Rule = mongoose.model(
  "Rule",
  new mongoose.Schema({
    code: { type: String, unique: true },
    value: String,
    description: String,
  }),
  "rules",
);

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
); // Map to 'weddings' collection

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
); // Map to 'orders' collection
