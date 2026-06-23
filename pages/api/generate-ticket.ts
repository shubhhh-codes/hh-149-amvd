import type { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';
import clientPromise from '../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { bookingId } = req.query;

    if (!bookingId || typeof bookingId !== 'string') {
        return res.status(400).json({ message: 'Booking ID is required' });
    }

    try {
        const client = await clientPromise;
        const db = client.db();

        // Look up the booking by human-friendly ID
        const booking = await db.collection('bookings').findOne({ bookingId });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ticket-${bookingId}.pdf`);

        doc.pipe(res);

        doc.fontSize(20).text('Event Ticket', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Booking ID: ${booking.bookingId}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Name: ${booking.fullName}`);
        doc.text(`Phone: ${booking.phone || 'N/A'}`);
        doc.text(`Email: ${booking.email}`);
        doc.text(`Tickets: ${booking.numberOfTickets}`);
        doc.text(`Status: ${booking.status}`);
        doc.text(`Type: ${booking.bookingType || 'paid'}`);
        doc.text(`Booked On: ${new Date(booking.createdAt).toLocaleDateString('en-IN')}`);
        doc.text(`Total Amount: ₹${(booking.numberOfTickets || 0) * 149}`);
        doc.moveDown();
        doc.fontSize(10).text('This ticket is for informational purposes only.', { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Ticket generation error:', error);
        res.status(500).json({ message: 'Failed to generate ticket' });
    }
}
