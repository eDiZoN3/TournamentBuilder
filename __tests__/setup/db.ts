import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo: MongoMemoryServer | undefined;
let mongoUri: string | undefined;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  mongoUri = mongo.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

export function getTestMongoUri(): string {
  if (!mongoUri) {
    throw new Error("Test MongoDB has not started");
  }

  return mongoUri;
}
