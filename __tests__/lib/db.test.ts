import mongoose from "mongoose";
import { getTestMongoUri } from "@/__tests__/setup/db";
import { connectDB } from "@/lib/db";

describe("connectDB", () => {
  it("reuses the active mongoose connection", async () => {
    const firstConnection = await connectDB();
    const secondConnection = await connectDB();

    expect(firstConnection).toBe(mongoose);
    expect(secondConnection).toBe(firstConnection);
    expect(mongoose.connection.readyState).toBe(1);
  });

  it("reconnects after mongoose has disconnected", async () => {
    process.env.MONGODB_URI = getTestMongoUri();
    await mongoose.disconnect();

    const connection = await connectDB();

    expect(connection).toBe(mongoose);
    expect(mongoose.connection.readyState).toBe(1);
  });

  it("rejects a missing MongoDB URI while disconnected", async () => {
    await mongoose.disconnect();
    delete process.env.MONGODB_URI;

    await expect(connectDB()).rejects.toThrow("MONGODB_URI is not configured");

    process.env.MONGODB_URI = getTestMongoUri();
    await connectDB();
  });

  it("can retry after a MongoDB connection attempt fails", async () => {
    await mongoose.disconnect();
    process.env.MONGODB_URI = "not-a-mongodb-uri";

    await expect(connectDB()).rejects.toThrow();

    process.env.MONGODB_URI = getTestMongoUri();
    await expect(connectDB()).resolves.toBe(mongoose);
  });
});
