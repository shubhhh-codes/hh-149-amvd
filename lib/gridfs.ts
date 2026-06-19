import { GridFSBucket, Db } from 'mongodb';
import clientPromise from './mongodb';

let bucket: GridFSBucket | null = null;

export async function getGridFSBucket(): Promise<GridFSBucket> {
  if (bucket) return bucket;

  const client = await clientPromise;
  const db: Db = client.db();
  
  bucket = new GridFSBucket(db, {
    bucketName: 'images'
  });

  return bucket;
}
