import mongoose from "mongoose";

const RuleSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    value: { type: String, required: true },
    description: { type: String, trim: true },
  },
  { timestamps: true },
);

const Rule = mongoose.models.Rule || mongoose.model("Rule", RuleSchema);

export default Rule;
