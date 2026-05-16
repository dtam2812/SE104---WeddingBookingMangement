import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema(
  {
    wedding_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wedding",
      required: true,
    },

    groom_name: { type: String, required: true },
    bride_name: { type: String, required: true },
    wedding_date: { type: Date, required: true },
    hall_name: { type: String, required: true },
    table_count: { type: Number, required: true },

    total_amount: { type: Number, required: true, min: 0 },
    deposit: { type: Number, required: true, min: 0 },
    remaining_amount: { type: Number, required: true, min: 0 },

    payment_date: { type: Date },

    late_days: { type: Number, default: 0, min: 0 },
    penalty_amount: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
  },
  { timestamps: true },
);

InvoiceSchema.virtual("amount_due").get(function () {
  return this.remaining_amount + this.penalty_amount;
});

const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);

export default Invoice;
