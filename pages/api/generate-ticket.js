import PDFDocument from 'pdfkit';

export default function handler(req, res) {
  const { ticketNumber, name, phone, email, event, date, venue, tickets, totalAmount } = req.query;

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=ticket.pdf');

  doc.pipe(res);

  doc.fontSize(20).text('Event Ticket', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Ticket Number: ${ticketNumber}`);
  doc.text(`Name: ${name}`);
  doc.text(`Phone: ${phone}`);
  doc.text(`Email: ${email}`);
  doc.text(`Event: ${event}`);
  doc.text(`Date & Time: ${date}, 7:00 PM`);
  doc.text(`Venue: ${venue}`);
  doc.text(`Tickets: ${tickets}`);
  doc.text(`Total Amount: ${totalAmount}`);

  doc.end();
}
