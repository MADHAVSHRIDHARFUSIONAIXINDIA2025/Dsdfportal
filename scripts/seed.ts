import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config();
import { hash } from "bcryptjs";
import mongoose from "mongoose";
import { Company, User } from "../src/models";

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error("MONGODB_URI is required");
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "dsdf_fiber_ops" });

  const email = process.env.ADMIN_EMAIL || "admin@dsdf.local";
  const password = process.env.ADMIN_PASSWORD || "Admin@12345";

  if (!(await User.findOne({ email }))) {
    await User.create({
      name: "DSDF Admin",
      email,
      passwordHash: await hash(password, 12),
      role: "admin",
      status: "active",
    });
    console.log(`Admin created: ${email} / ${password}`);
  } else {
    console.log("Admin already exists");
  }

  if (!(await Company.findOne({ name: "Vodafone Idea Limited" }))) {
    await Company.create({ name: "Vodafone Idea Limited", status: "Active" });
    console.log("Seeded Vodafone Idea Limited company");
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
