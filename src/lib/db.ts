import mongoose from "mongoose";

type MongoCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongo = globalThis as typeof globalThis & { __fomMongo?: MongoCache };

function cache(): MongoCache {
  if (!globalForMongo.__fomMongo) {
    globalForMongo.__fomMongo = { conn: null, promise: null };
  }
  return globalForMongo.__fomMongo;
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  const state = cache();
  if (state.conn) return state.conn;

  if (!state.promise) {
    state.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || "dsdf_fiber_ops",
      bufferCommands: false,
    });
  }

  state.conn = await state.promise;
  return state.conn;
}
