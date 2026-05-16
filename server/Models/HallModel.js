import mongoose from "mongoose";

const HallSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HallType",
      required: true,
    },
    max_tables: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },
  },
  { timestamps: true },
);

const Hall = mongoose.models.Hall || mongoose.model("Hall", HallSchema);

export default Hall;
