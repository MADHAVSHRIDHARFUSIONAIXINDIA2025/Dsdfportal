import { Schema, model, models } from "mongoose";

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    companyName: String,
    companyContact: String,
    companyEmail: String,
    companyAddress: String,
    linkId: { type: String, required: true, unique: true },
    city: { type: String, required: true },
    linkType: { type: String, default: "Linear" },
    pathName: { type: String, default: "Main Path" },
    fiberCore: { type: String, default: "Single Core" },
    customerCategory: { type: String, default: "Enterprise" },
    manageBy: { type: String, default: "Manage By Own" },
    vendorName: String,
    vendorContact: String,
    serviceType: String,
    bandwidth: String,
    aEnd: String,
    bEnd: String,
    aEndLatitude: String,
    aEndLongitude: String,
    bEndLatitude: String,
    bEndLongitude: String,
    implementationDate: String,
    contact: String,
    slaHours: { type: Number, default: 4 },
    status: { type: String, default: "Active" },
    remarks: String,
  },
  { timestamps: true }
);

CustomerSchema.index({ name: 1, city: 1 });

export const Customer = models.Customer || model("Customer", CustomerSchema);
