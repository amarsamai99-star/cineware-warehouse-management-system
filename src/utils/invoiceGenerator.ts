import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  reportId: string;
  projectName: string;
  customerName: string;
  date: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  settings: {
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_website: string;
    company_logo?: string;
  };
}

export const generateInvoicePDF = (data: InvoiceData) => {
  const doc = new jsPDF();
  const { reportId, projectName, customerName, date, items, settings } = data;

  // Header
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('INVOICE / QUOTE', 14, 25);

  // Company Info
  doc.setFontSize(10);
  doc.text(settings.company_name, 200, 15, { align: 'right' });
  doc.setFontSize(8);
  doc.text(settings.company_address, 200, 20, { align: 'right' });
  doc.text(settings.company_email, 200, 24, { align: 'right' });
  doc.text(settings.company_phone, 200, 28, { align: 'right' });

  // Invoice Details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 14, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(customerName, 14, 60);
  doc.text(`Project: ${projectName}`, 14, 65);

  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE INFO:', 140, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: INV-${reportId.split('-')[1]}`, 140, 60);
  doc.text(`Date: ${date}`, 140, 65);
  doc.text(`Reference: ${reportId}`, 140, 70);

  // Table
  const tableData = items.map(item => [
    item.name,
    1, // Days
    `$${item.price.toFixed(2)}`,
    `$${item.price.toFixed(2)}`
  ]);

  const total = items.reduce((sum, item) => sum + item.price, 0);

  autoTable(doc, {
    startY: 80,
    head: [['Description', 'Days', 'Rate', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [30, 30, 30] },
    foot: [['', '', 'TOTAL:', `$${total.toFixed(2)}`]],
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions', 14, finalY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('1. Payment is due within 30 days of invoice date.', 14, finalY + 6);
  doc.text('2. Late payments are subject to a 5% monthly fee.', 14, finalY + 10);
  doc.text('3. Equipment must be returned in the same condition as received.', 14, finalY + 14);

  doc.save(`Invoice_${reportId}.pdf`);
};
