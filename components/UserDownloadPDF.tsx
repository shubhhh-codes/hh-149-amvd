import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Payment {
  _id: string;
  paymentId: string;
  amount: number;
  status: string;
  createdAt: string;
  bookingDetails?: {
    numberOfTickets: number;
    fullName: string;
  };
  user?: {
    email: string;
    username: string;
  };
}

interface DownloadPaymentsButtonProps {
  payments: Payment[];
  className?: string;
}

const generatePDF = (payments: Payment[]) => {
  const doc = new jsPDF();
  doc.setFont('Poppins');
  doc.setFontSize(16);
  doc.text('Payment Report', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Humors Hub - Stand Up Comedy Show', 105, 30, { align: 'center' });

  // Use autoTable for better formatting
  const tableColumn = ['Name', 'Email', 'Tickets', 'Payment ID', 'Amount', 'Date'];
  const tableRows: any[] = [];

  let totalAmount = 0;
  let successfulPayments = 0;

  payments.forEach((payment) => {
    const amount = payment.amount / 100;
    totalAmount += amount;
    if (payment.status === 'completed') successfulPayments++;

    const paymentData = [
      payment.bookingDetails?.fullName || 'N/A',
      payment.user?.email || 'N/A',
      (payment.bookingDetails?.numberOfTickets || 0).toString(),
      payment.paymentId,
      `${amount.toFixed(2)}`,
      new Date(payment.createdAt).toLocaleDateString()
    ];

    tableRows.push(paymentData);
  });

  (doc as any).autoTable(tableColumn, tableRows, {
    startY: 40,
    headStyles: { fillColor: '#793de6' }
  });

  // Summary Section
  doc.setFillColor(243, 244, 246);
  const finalY = (doc as any).lastAutoTable.finalY || 40;
  doc.rect(10, finalY + 10, 190, 30, 'F');
  doc.text(`Total Transactions: ${payments.length}`, 15, finalY + 20);
  doc.text(`Successful Payments: ${successfulPayments}`, 15, finalY + 30);
  doc.text(`Total Revenue: ${totalAmount.toFixed(2)}`, 15, finalY + 40);

  doc.save('UserPaymentsReport.pdf');
};

const DownloadPaymentsButton = ({ payments, className = '' }: DownloadPaymentsButtonProps) => {
  return (
    <button
      className={`inline-flex items-center justify-center px-4 py-2 bg-[#793de6] text-white rounded-lg hover:bg-[#5e2bbd] transition-colors shadow-md hover:shadow-lg ${className}`}
      onClick={() => generatePDF(payments)}
    >
      Download Payments PDF
    </button>
  );
};

export default DownloadPaymentsButton;
