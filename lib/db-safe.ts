/**
 * Safe server-side DB helper for getStaticProps / getServerSideProps.
 * Returns null if MONGODB_URI is not available (e.g. during build preview).
 */
import { MongoClient, Db } from 'mongodb';

let cachedDb: Db | null = null;

export async function getDbSafe(): Promise<Db | null> {
  if (!process.env.MONGODB_URI) return null;

  const uri = process.env.MONGODB_URI;
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    return null;
  }

  if (cachedDb) return cachedDb;

  try {
    const client = new MongoClient(uri);
    await client.connect();
    cachedDb = client.db();
    return cachedDb;
  } catch (e) {
    console.error('DB connection error in getDbSafe:', e);
    return null;
  }
}
