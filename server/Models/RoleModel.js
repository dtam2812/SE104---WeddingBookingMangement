import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true, default: "" },
    permissions: [{ type: String }],
  },
  { timestamps: true },
);

RoleSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

RoleSchema.set("toJSON", { virtuals: true });
RoleSchema.set("toObject", { virtuals: true });

const Role = mongoose.models.Role || mongoose.model("Role", RoleSchema);

export default Role;
