import { jsPDF } from 'jspdf';
import { Invoice, InvoiceItem } from '@/types';
import { formatDate } from './dateUtils';
import { formatCurrency } from './currencyUtils';

export const generateInvoicePdf = (invoice: Invoice, companyName = 'Maskine QR System'): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(22);
  doc.text(companyName, 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Faktura', 20, y);
  y += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text('Til:', 20, y);
  doc.text(invoice.customerName, 20, y + 7);
  y += 20;

  doc.setFontSize(10);
  doc.text(`Fakturadato: ${formatDate(invoice.date)}`, pageWidth - 20, y, { align: 'right' });
  doc.text(`Forfaldsdato: ${formatDate(invoice.dueDate)}`, pageWidth - 20, y + 6, { align: 'right' });
  doc.text(`Fakturanr: ${invoice.id}`, pageWidth - 20, y + 12, { align: 'right' });
  y += 25;

  doc.setFontSize(10);
  const headers = ['Beskrivelse', 'Antal', 'Pris', 'Beløb'];
  const colWidths = [100, 25, 35, 35];
  let x = 20;
  headers.forEach((h, i) => {
    doc.text(h, x, y);
    x += colWidths[i];
  });
  y += 8;

  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  invoice.items.forEach(item => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    x = 20;
    doc.text(item.description.substring(0, 50), x, y);
    x += colWidths[0];
    doc.text(item.quantity.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 2 }), x, y);
    x += colWidths[1];
    doc.text(formatCurrency(item.unitPrice), x, y);
    x += colWidths[2];
    doc.text(formatCurrency(item.totalPrice), x, y);
    y += 7;
  });

  y += 5;
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  doc.text('Subtotal:', pageWidth - 80, y);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - 20, y, { align: 'right' });
  y += 6;
  doc.text('Moms:', pageWidth - 80, y);
  doc.text(formatCurrency(invoice.vat), pageWidth - 20, y, { align: 'right' });
  y += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', pageWidth - 80, y);
  doc.text(formatCurrency(invoice.total), pageWidth - 20, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  if (invoice.notes) {
    y += 15;
    doc.text('Noter:', 20, y);
    y += 6;
    doc.text(invoice.notes.substring(0, 100), 20, y);
  }

  doc.save(`Faktura-${invoice.id}-${invoice.customerName.replace(/\s/g, '-')}.pdf`);
};
