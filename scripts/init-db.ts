/**
 * @copyright (c) 2024 - Present
 * @author github.com/KunalG932
 * @license MIT
 */
import { MongoClient } from 'mongodb';
require('dotenv').config();

async function initializeDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined');
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    // Create collections with validation
    await db.createCollection('bookings', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['userId', 'fullName', 'email', 'status', 'createdAt', 'updatedAt'],
          properties: {
            userId: { bsonType: 'string' },
            fullName: { bsonType: 'string' },
            email: { bsonType: 'string' },
            phone: { bsonType: 'string' },
            numberOfTickets: { bsonType: 'int', minimum: 1, maximum: 50 },
            status: { enum: ['pending', 'approved', 'declined'] },
            isComedianBooking: { bsonType: 'bool' },
            comedianProfile: {
              bsonType: 'object',
              properties: {
                comedianType: { bsonType: 'string' },
                bio: { bsonType: 'string' },
                speciality: { bsonType: 'string' },
                videoUrl: { bsonType: 'string' },
                experience: { bsonType: 'string' }
              }
            },
            createdAt: { bsonType: 'date' },
            updatedAt: { bsonType: 'date' }
          }
        }
      }
    });

    // Create indexes
    await db.collection('bookings').createIndexes([
      { key: { email: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } },
      { key: { userId: 1 } }
    ]);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    await client.close();
  }
}

initializeDatabase().catch(console.error); 