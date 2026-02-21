import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import PDFDocument from 'pdfkit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // BUG 9 FIX: Require authentication before generating any ticket PDF
    const token = await getToken({ req });
    if (!token?.email) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { ticketNumber, name, phone, email, event, date, venue, tickets, totalAmount } = req.query;

    // Validate required fields
    if (!ticketNumber || !name || !email || !event) {
        return res.status(400).json({ message: 'Missing required ticket fields' });
    }

    // Security: only allow users to generate their own tickets
    if (email !== token.email) {
        return res.status(403).json({ message: 'Forbidden: you can only download your own tickets' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=ticket.pdf');

    doc.pipe(res);

    doc.fontSize(20).text('Event Ticket', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Ticket Number: ${ticketNumber}`);
    doc.text(`Name: ${name}`);
    doc.text(`Phone: ${phone || 'N/A'}`);
    doc.text(`Email: ${email}`);
    doc.text(`Event: ${event}`);
    doc.text(`Date & Time: ${date}, 7:00 PM`);
    doc.text(`Venue: ${venue || 'N/A'}`);
    doc.text(`Tickets: ${tickets || 'N/A'}`);
    doc.text(`Total Amount: ${totalAmount || 'N/A'}`);

    doc.end();
}
