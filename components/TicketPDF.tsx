import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

interface TicketProps {
  ticketNumber: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  numberOfTickets: number;
  showDetails: {
    name: string;
    date: string;
    time: string;
    venue: string;
    category?: string;
    description?: string;
  };
  paymentId?: string;
  ticketPrice?: number;
  paymentTime?: string;
}

export const generateTicketPDF = async ({
  ticketNumber, 
  userEmail, 
  userName,
  userPhone,
  numberOfTickets, 
  showDetails,
  paymentId,
  ticketPrice = 149,
  paymentTime
}: TicketProps) => {
  // Use A4 with custom margins
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Color Palette
  const colors = {
    primary: '#6D28D9',     // Deep Purple
    secondary: '#F59E0B',   // Amber
    accent: '#10B981',      // Emerald
    background: {
      light: '#F8FAFC',    // Lighter Gray
      dark: '#1F2937'      // Dark Gray
    },
    text: {
      dark: '#0F172A',     // Almost Black
      light: '#64748B',    // Medium Gray
      white: '#FFFFFF'     // White
    }
  };

  // Page Dimensions
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;

  // Ticket Card Dimensions
  const cardWidth = pageWidth - (2 * margin);
  const cardHeight = 210;
  const cardX = margin;
  const cardY = 50;

  // Background with subtle gradient effect
  doc.setFillColor(colors.background.light);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative Header
  doc.setFillColor(colors.primary);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(colors.text.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('HUMORS HUB', pageWidth / 2, 20, { align: 'center' });

  // Ticket Card with Elevated Effect
  doc.setDrawColor(colors.text.light);
  doc.setLineWidth(0.5);
  doc.setFillColor(colors.text.white);
  doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 5, 5, 'FD');

  // Event Header
  doc.setFillColor(colors.primary);
  doc.roundedRect(cardX, cardY, cardWidth, 25, 5, 5, 'F');
  doc.setTextColor(colors.text.white);
  doc.setFontSize(16);
  doc.text('Event Ticket', pageWidth / 2, cardY + 16, { align: 'center' });

  // Ticket Details Setup
  doc.setTextColor(colors.text.dark);
  const leftColumnX = cardX + 15;
  const rightColumnX = cardX + (cardWidth / 2) + 10;

  // Left Column - Event Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Event Information', leftColumnX, cardY + 45);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Event: ${showDetails.name}`, leftColumnX, cardY + 55);
  doc.text(`Date: ${showDetails.date}`, leftColumnX, cardY + 62);
  doc.text(`Time: ${showDetails.time}`, leftColumnX, cardY + 69);
  doc.text(`Venue: ${showDetails.venue}`, leftColumnX, cardY + 76);
  
  if (showDetails.category) {
    doc.text(`Category: ${showDetails.category}`, leftColumnX, cardY + 83);
  }

  if (showDetails.description) {
    doc.setTextColor(colors.text.light);
    doc.text(`Description: ${showDetails.description}`, leftColumnX, cardY + 93, { maxWidth: cardWidth / 2 - 20 });
  }

  // Right Column - Ticket Details
  doc.setTextColor(colors.text.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Ticket Details', rightColumnX, cardY + 45);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Ticket Number: ${ticketNumber}`, rightColumnX, cardY + 55);
  doc.text(`Name: ${userName}`, rightColumnX, cardY + 62);
  doc.text(`Email: ${userEmail}`, rightColumnX, cardY + 69);
  doc.text(`Phone: ${userPhone}`, rightColumnX, cardY + 76);
  
  // Ticket Pricing
  doc.setFont('helvetica', 'bold');
  doc.text('Ticket Pricing', leftColumnX, cardY + 120);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Quantity: ${numberOfTickets}`, leftColumnX, cardY + 130);
  doc.text(`Price per Ticket: ${ticketPrice}`, leftColumnX, cardY + 137);
  doc.text(`Total Amount: ${numberOfTickets * ticketPrice}`, leftColumnX, cardY + 144);

  // QR Code Generation
  try {
    const qrCodeUrl = await QRCode.toDataURL(ticketNumber, { 
      color: { 
        dark: colors.primary, 
        light: colors.text.white 
      },
      width: 300
    });
    const qrCodeImg = await fetch(qrCodeUrl);
    const qrCodeBlob = await qrCodeImg.blob();
    const qrCodeBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(qrCodeBlob);
    });

    // QR Code Placement
    const qrSize = 40;
    doc.setDrawColor(colors.accent);
    doc.setLineWidth(1);
    doc.roundedRect(cardX + cardWidth - qrSize - 20, cardY + 120, qrSize, qrSize, 2, 2, 'S');
    doc.addImage(qrCodeBase64, 'PNG', cardX + cardWidth - qrSize - 18, cardY + 122, qrSize - 4, qrSize - 4);
    
    doc.setFontSize(8);
    doc.setTextColor(colors.text.light);
    doc.text('Scan for Verification', cardX + cardWidth - qrSize + 5, cardY + 165, { align: 'center' });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(colors.text.light);
  doc.text(`Payment ID: ${paymentId || 'N/A'}`, margin, pageHeight - 20);
  if (paymentTime) {
    doc.text(`Payment Time: ${paymentTime}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
  }

  return doc;
};

export const createAndSaveTicket = async (ticketProps: TicketProps) => {
  try {
    const doc = await generateTicketPDF(ticketProps);
    doc.save(`ticket-${ticketProps.ticketNumber}.pdf`);
  } catch (err) {
    console.error('Failed to generate ticket PDF:', err);
    throw err;
  }
};

export const DownloadTicketButton: React.FC<TicketProps & { className?: string }> = ({ 
  className = '', 
  ...ticketProps 
}) => {
  const handleDownload = async () => {
    try {
      const doc = await generateTicketPDF(ticketProps);
      doc.save(`ticket-${ticketProps.ticketNumber}.pdf`);
    } catch (err) {
      console.error('Failed to generate ticket PDF:', err);
    }
  };

  return (
    <button 
      onClick={handleDownload} 
      className={`inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${className}`}
    >
      Download Ticket
    </button>
  );
};