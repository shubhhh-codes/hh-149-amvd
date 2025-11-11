import { MongoClient, Db } from 'mongodb';
import { parse } from 'url';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || extractDatabaseName(uri);

function extractDatabaseName(connectionString?: string): string {
  if (!connectionString) {
    throw new Error('MongoDB connection string is not defined');
  }

  try {
    const parsedUrl = parse(connectionString);
    // Extract database name from the path, removing leading '/'
    const pathParts = parsedUrl.pathname?.split('/').filter(Boolean);
    
    if (pathParts && pathParts.length > 0) {
      // Take the last part of the path as the database name
      return pathParts[pathParts.length - 1];
    }

    // Fallback to a default database name
    return 'humours-hub';
  } catch (error) {
    console.error('Failed to extract database name:', error);
    return 'humours-hub';
  }
}

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    if (!uri) {
      throw new Error('MongoDB URI is undefined. Please check your environment variables.');
    }
    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectFromDatabase() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}
