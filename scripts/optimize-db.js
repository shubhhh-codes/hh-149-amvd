const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function createIndexes() {
  if (!process.env.MONGODB_URI) {
    console.error('No MONGODB_URI found');
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to DB');
    const db = client.db('humourshub');

    // Create index on eventId
    await db.collection('distributions').createIndex({ eventId: 1 });
    console.log('Created index on eventId');

    // Create index on showDate (descending)
    await db.collection('distributions').createIndex({ showDate: -1 });
    console.log('Created index on showDate');

    console.log('Optimization complete!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

createIndexes();
