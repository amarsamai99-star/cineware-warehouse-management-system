import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';

interface PDFData {
  reportId: string;
  projectName: string;
  customerName: string;
  staffName: string;
  technicianName: string;
  notes?: string;
  items: Array<{
    name: string;
    brand: string;
    model: string;
    barcode: string;
    condition: string;
  }>;
  signatureData?: string;
  settings: {
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    company_website: string;
    company_logo?: string;
  };
}

export const generateCheckoutPDF = (data: PDFData) => {
  const doc = new jsPDF();
  const { reportId, projectName, customerName, staffName, technicianName, notes, items, signatureData, settings } = data;
  const date = new Date().toLocaleString();

  // Header Background (Subtle)
  doc.setFillColor(248, 248, 248);
  doc.rect(0, 0, 210, 45, 'F');

  // Company Logo
  if (settings.company_logo) {
    try {
      doc.addImage(settings.company_logo, 'PNG', 14, 10, 30, 30, undefined, 'FAST');
    } catch (e) {
      console.error('Failed to add logo to PDF:', e);
    }
  }

  // Company Info (Right Aligned)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(settings.company_name || 'CineWare Pro', 200, 18, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(settings.company_address || '', 200, 24, { align: 'right' });
  doc.text(`${settings.company_phone || ''} | ${settings.company_email || ''}`, 200, 28, { align: 'right' });
  doc.text(settings.company_website || '', 200, 32, { align: 'right' });

  // Report Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('EQUIPMENT CHECK-OUT REPORT', 14, 60);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Report ID: ${reportId}`, 14, 68);
  doc.text(`Date: ${date}`, 14, 73);

  // Barcode (Top Right of Content)
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, reportId, { format: 'CODE128', width: 2, height: 40, displayValue: false });
  const barcodeData = canvas.toDataURL('image/png');
  doc.addImage(barcodeData, 'PNG', 150, 55, 45, 15);
  doc.setFontSize(8);
  doc.text(reportId, 172, 73, { align: 'center' });

  // Project Info Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('PROJECT DETAILS', 14, 88);
  doc.setLineWidth(0.5);
  doc.setDrawColor(230, 230, 230);
  doc.line(14, 90, 196, 90);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Left Column
  doc.text('Project Name:', 14, 100);
  doc.setFont('helvetica', 'bold');
  doc.text(projectName, 45, 100);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Customer:', 14, 106);
  doc.setFont('helvetica', 'bold');
  doc.text(customerName, 45, 106);

  // Right Column
  doc.setFont('helvetica', 'normal');
  doc.text('Warehouse Staff:', 110, 100);
  doc.setFont('helvetica', 'bold');
  doc.text(staffName, 145, 100);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Technician:', 110, 106);
  doc.setFont('helvetica', 'bold');
  doc.text(technicianName, 145, 106);

  if (notes) {
    doc.setFont('helvetica', 'normal');
    doc.text('Notes:', 14, 116);
    doc.setFont('helvetica', 'italic');
    doc.text(notes, 45, 116, { maxWidth: 150 });
  }

  // Equipment Table
  const tableData = items.map((item, index) => [
    index + 1,
    item.name,
    item.brand,
    item.model,
    item.barcode,
    item.condition
  ]);

  autoTable(doc, {
    startY: notes ? 125 : 120,
    head: [['#', 'Item Name', 'Brand', 'Model', 'Barcode', 'Condition']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [250, 250, 250] }
  });

  // Signature Section
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  if (finalY > 240) {
    doc.addPage();
    doc.setFontSize(12);
    doc.text('SIGNATURE', 14, 20);
    doc.line(14, 22, 80, 22);
    if (signatureData) {
      doc.addImage(signatureData, 'PNG', 14, 25, 60, 30);
    }
  } else {
    doc.setFontSize(12);
    doc.text('SIGNATURE', 14, finalY);
    doc.line(14, finalY + 2, 80, finalY + 2);
    if (signatureData) {
      doc.addImage(signatureData, 'PNG', 14, finalY + 5, 60, 30);
    }
  }

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    doc.text('This document confirms that the equipment listed above has been received in the stated condition.', 14, 280);
  }

  doc.save(`Checkout_Report_${reportId}.pdf`);
};
