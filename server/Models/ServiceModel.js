import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
  },
  { timestamps: true },
);

const Service =
  mongoose.models.Service || mongoose.model("Service", ServiceSchema);

export default Service;
