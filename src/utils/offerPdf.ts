import { jsPDF } from 'jspdf';
import { Offer, OfferItem, OfferPart } from '@/types';
import { formatDate } from './dateUtils';
import { formatCurrency } from './currencyUtils';

export const generateOfferPdf = (offer: Offer, companyName = 'Maskine QR System'): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(22);
  doc.text(companyName, 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Tilbud', 20, y);
  y += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text('Til:', 20, y);
  doc.text(offer.customerName, 20, y + 7);
  y += 20;

  doc.setFontSize(10);
  doc.text(`Tilbudsnr: ${offer.offerNumber || offer.id}`, pageWidth - 20, y, { align: 'right' });
  doc.text(`Oprettet: ${formatDate(offer.createdAt)}`, pageWidth - 20, y + 6, { align: 'right' });
  doc.text(`Gyldig til: ${formatDate(offer.validUntil)}`, pageWidth - 20, y + 12, { align: 'right' });
  if (offer.machineName) {
    doc.text(`Maskine: ${offer.machineName}`, pageWidth - 20, y + 18, { align: 'right' });
    y += 6;
  }
  y += 25;

  doc.setFontSize(14);
  doc.text(offer.title, 20, y);
  y += 12;

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

  const items = offer.items || [];
  items.filter((i: OfferItem) => i.description?.trim()).forEach((item: OfferItem) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    x = 20;
    doc.text(item.description.substring(0, 50), x, y);
    x += colWidths[0];
    doc.text(String(item.quantity ?? 1), x, y);
    x += colWidths[1];
    doc.text(formatCurrency(item.unitPrice ?? 0), x, y);
    x += colWidths[2];
    doc.text(formatCurrency(item.totalPrice ?? item.quantity * item.unitPrice ?? 0), x, y);
    y += 7;
  });

  const parts = offer.parts || [];
  parts.filter((p: OfferPart) => p.name?.trim()).forEach((part: OfferPart) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    x = 20;
    doc.text(`${part.name} (${part.partNumber || '-'})`, x, y);
    x += colWidths[0];
    doc.text(String(part.quantity ?? 1), x, y);
    x += colWidths[1];
    doc.text(formatCurrency(part.unitPrice ?? 0), x, y);
    x += colWidths[2];
    doc.text(formatCurrency(part.totalPrice ?? part.quantity * part.unitPrice ?? 0), x, y);
    y += 7;
  });

  y += 5;
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Total:', pageWidth - 80, y);
  doc.text(formatCurrency(offer.amount), pageWidth - 20, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  if (offer.notes) {
    y += 15;
    doc.text('Noter:', 20, y);
    y += 6;
    doc.text(offer.notes.substring(0, 150), 20, y);
  }

  const filename = `Tilbud-${(offer.offerNumber || offer.id).replace(/\s/g, '-')}-${offer.customerName.replace(/\s/g, '-')}.pdf`;
  doc.save(filename);
};
