/**
 * Migrate companies + customers (links) from old Atlas DB → new prod DB.
 * Preserves _id so companyId references on links stay valid.
 *
 * Usage: node scripts/migrate-companies-links.mjs
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });
config();

const OLD_URI = process.env.OLD_MONGODB_URI || "";
const NEW_URI =
  process.env.NEW_MONGODB_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "";
const DB_NAME = process.env.MONGODB_DB || "dsdf_fiber_ops";

async function main() {
  if (!OLD_URI) throw new Error("OLD_MONGODB_URI is required");
  if (!NEW_URI) throw new Error("NEW_MONGODB_URI / MONGODB_URI is required");

  console.log("Connecting to OLD database...");
  const oldConn = await mongoose.createConnection(OLD_URI, { dbName: DB_NAME }).asPromise();
  console.log("Connecting to NEW database...");
  const newConn = await mongoose.createConnection(NEW_URI, { dbName: DB_NAME }).asPromise();

  const oldCompanies = oldConn.collection("companies");
  const oldCustomers = oldConn.collection("customers");
  const newCompanies = newConn.collection("companies");
  const newCustomers = newConn.collection("customers");

  const companies = await oldCompanies.find({}).toArray();
  const customers = await oldCustomers.find({}).toArray();

  console.log(`Found in OLD: ${companies.length} companies, ${customers.length} links`);

  let companiesUpserted = 0;
  let companiesSkipped = 0;
  for (const doc of companies) {
    const existing = await newCompanies.findOne({
      $or: [{ _id: doc._id }, { name: doc.name }],
    });
    if (existing) {
      companiesSkipped += 1;
      continue;
    }
    await newCompanies.insertOne(doc);
    companiesUpserted += 1;
  }

  let linksUpserted = 0;
  let linksSkipped = 0;
  let linksFailed = 0;
  for (const doc of customers) {
    const existing = await newCustomers.findOne({
      $or: [{ _id: doc._id }, { linkId: doc.linkId }],
    });
    if (existing) {
      linksSkipped += 1;
      continue;
    }
    try {
      await newCustomers.insertOne(doc);
      linksUpserted += 1;
    } catch (error) {
      linksFailed += 1;
      console.error(`Failed link ${doc.linkId}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log("\nDone.");
  console.log(`Companies: ${companiesUpserted} inserted, ${companiesSkipped} already present`);
  console.log(`Links:     ${linksUpserted} inserted, ${linksSkipped} already present, ${linksFailed} failed`);

  const newCompanyCount = await newCompanies.countDocuments();
  const newLinkCount = await newCustomers.countDocuments();
  console.log(`NEW DB totals: ${newCompanyCount} companies, ${newLinkCount} links`);

  await oldConn.close();
  await newConn.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
