import mongoose from "mongoose";

const ShiftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

ShiftSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

ShiftSchema.set("toJSON", { virtuals: true });
ShiftSchema.set("toObject", { virtuals: true });

const Shift = mongoose.models.Shift || mongoose.model("Shift", ShiftSchema);

export default Shift;
