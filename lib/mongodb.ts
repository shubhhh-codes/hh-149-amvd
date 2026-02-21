import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;

// BUG 7 FIX: Add global connection caching to prevent connection exhaustion on
// serverless platforms (Vercel). Without caching, each invocation opens a new
// connection causing MongoDB Atlas to hit the connection limit.
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // Allow global caching in development to survive HMR
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise!;
} else {
  // In production, always create a new client instance per function instance,
  // but the instance itself is reused across invocations via module caching.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;