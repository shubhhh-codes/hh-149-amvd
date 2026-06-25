import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const client = new MongoClient(uri);

const faqs = [
  {
    type: 'support_faq',
    title: "Where exactly is the venue in Ahmedabad?",
    content: "We primarily host shows at The Hub Attic in Navrangpura. The exact Google Maps location is sent in your booking confirmation email and is also visible on your digital ticket.",
    displayOrder: 1,
    isVisible: true,
    createdAt: new Date().toISOString()
  },
  {
    type: 'support_faq',
    title: "Do you allow 'on-the-spot' registrations for open mics?",
    content: "To maintain show quality, we don't take walk-in performers. Please apply through our [Perform With Us](/perform-with-us) page at least 3 days before a show. Our creative team reviews all clips before shortlisting.",
    displayOrder: 2,
    isVisible: true,
    createdAt: new Date().toISOString()
  },
  {
    type: 'support_faq',
    title: "Is there an age restriction for the shows?",
    content: "Most of our shows are 18+ due to the nature of the content. For specific family-friendly events, we explicitly mention 'All Ages' on the event poster and booking page.",
    displayOrder: 3,
    isVisible: true,
    createdAt: new Date().toISOString()
  },
  {
    type: 'support_faq',
    title: "Can I bring my own food or drinks?",
    content: "Outside food and drinks aren't allowed inside the auditorium. However, the venue has a cafe area where you can grab snacks and chai before the show or during the intermission.",
    displayOrder: 4,
    isVisible: true,
    createdAt: new Date().toISOString()
  },
  {
    type: 'support_faq',
    title: "What time should I reach the venue?",
    content: "Gates open 30 minutes before the show start time. We follow a strict 'No Entry' policy once the first act begins to ensure zero disturbance for the performers and audience.",
    displayOrder: 5,
    isVisible: true,
    createdAt: new Date().toISOString()
  },
  {
    type: 'support_faq',
    title: "I missed the show, can I use my ticket for the next one?",
    content: "Tickets are only valid for the specific date and time booked. Since we have limited seating (150 capacity), we cannot carry forward missed tickets to future shows.",
    displayOrder: 6,
    isVisible: true,
    createdAt: new Date().toISOString()
  },
  {
    type: 'support_faq',
    title: "Is there parking available at the venue?",
    content: "Yes, there is limited two-wheeler and four-wheeler parking available on a first-come, first-served basis. We recommend reaching 20 minutes early if you're bringing a car.",
    displayOrder: 7,
    isVisible: true,
    createdAt: new Date().toISOString()
  },
  {
    type: 'support_faq',
    title: "Do you offer group discounts for college students?",
    content: "We love the student energy! For groups of 10 or more, reach out to us directly on WhatsApp with your student IDs for a special community discount code.",
    displayOrder: 8,
    isVisible: true,
    createdAt: new Date().toISOString()
  }
];

async function run() {
  try {
    await client.connect();
    const db = client.db();
    
    console.log('Connected correctly to server');
    
    const collection = db.collection('homepage_content');
    
    // First, delete any existing support_faqs to avoid duplicates
    const deleteResult = await collection.deleteMany({ type: 'support_faq' });
    console.log(`Deleted ${deleteResult.deletedCount} existing FAQs`);
    
    // Insert new faqs
    const result = await collection.insertMany(faqs);
    console.log(`${result.insertedCount} FAQs were inserted`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
