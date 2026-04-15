import { jsPDF } from 'jspdf';
import { Invoice } from '@/types';
const BLUE: [number, number, number] = [43, 69, 160];
const LEFT_X = 16;

const dmy = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
};

const dkk = (n: number) => `DKK ${n.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const qty = (n: number) => n.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const dottedLabel = (doc: jsPDF, label: string, x: number, y: number) => doc.text(`${label} . . . . . . . . . . . .`, x, y);

const drawLogo = (doc: jsPDF) => {
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(3.6);
  doc.ellipse(70, 18, 38, 15, 'S');
  doc.setLineWidth(2.1);
  doc.ellipse(70, 18, 23, 9, 'S');
  doc.setTextColor(...BLUE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('SAFFIORFIK A/S', 43, 35);
  doc.setTextColor(0, 0, 0);
};

const paymentIdFromInvoice = (id: string) => {
  const numeric = id.replace(/\D/g, '').padStart(15, '0').slice(-15);
  return `+71<00000099${numeric}+88675223<`;
};

export const generateInvoicePdf = (invoice: Invoice): void => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightInfoX = 128;
  const total = invoice.subtotal;

  drawLogo(doc);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  dottedLabel(doc, 'Side', rightInfoX, 12);
  dottedLabel(doc, 'Dato', rightInfoX, 17);
  dottedLabel(doc, 'Konto', rightInfoX, 22);
  dottedLabel(doc, 'Betaling', rightInfoX, 27);
  dottedLabel(doc, 'Betaling før', rightInfoX, 32);
  dottedLabel(doc, 'Deres ref', rightInfoX, 37);
  dottedLabel(doc, 'Nummer', rightInfoX, 42);

  doc.setFontSize(10);
  doc.text('1', pageWidth - 12, 12, { align: 'right' });
  doc.text(dmy(invoice.date), pageWidth - 12, 17, { align: 'right' });
  doc.text('99', pageWidth - 12, 22, { align: 'right' });
  doc.text('Net 14', pageWidth - 12, 27, { align: 'right' });
  doc.text(dmy(invoice.dueDate), pageWidth - 12, 32, { align: 'right' });
  doc.text('Att:', pageWidth - 12, 37, { align: 'right' });
  doc.text(invoice.id, pageWidth - 12, 42, { align: 'right' });

  doc.setFontSize(11);
  doc.text(invoice.customerName || 'Kunde', LEFT_X, 52);
  doc.setFontSize(9);
  doc.text('Qasapi 2A, Boks 104', LEFT_X, 57);
  doc.text('Nuuk, GL 3900', LEFT_X, 62);
  doc.text('Greenland', LEFT_X, 67);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Faktura', LEFT_X, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  dottedLabel(doc, 'Rekvisition', LEFT_X, 86);
  doc.text(invoice.notes?.slice(0, 28) || '', 54, 86);
  doc.text('Udl. fra lager / Vareforbrug', LEFT_X, 92);

  // Table header
  doc.setFont('helvetica', 'bold');
  doc.text('Varenr.', LEFT_X, 100);
  doc.text('Beskrivelse', 38, 100);
  doc.text('Antal', 130, 100);
  doc.text('Enh.', 147, 100);
  doc.text('Pris', 163, 100);
  doc.text('Total', pageWidth - 14, 100, { align: 'right' });
  doc.setLineWidth(0.2);
  doc.line(LEFT_X, 102, pageWidth - 12, 102);

  // Parts section
  let y = 108;
  doc.setFont('helvetica', 'bold');
  doc.text('Dele :', LEFT_X, y);
  y += 6;
  doc.setFont('helvetica', 'normal');

  invoice.items.forEach((item, idx) => {
    const partNo = item.partId || `000${String(idx + 1).padStart(4, '0')}`;
    doc.text(partNo, LEFT_X, y);
    doc.text((item.description || '').slice(0, 54), 38, y);
    doc.text(qty(item.quantity), 134, y, { align: 'right' });
    doc.text('Styk', 149, y, { align: 'right' });
    doc.text(dkk(item.unitPrice), 170, y, { align: 'right' });
    doc.text(dkk(item.totalPrice), pageWidth - 14, y, { align: 'right' });
    y += 6;
  });

  doc.setFont('helvetica', 'bold');
  doc.text(`Total, Dele ${dkk(total)}`, LEFT_X, y + 2);
  y += 10;
  doc.text('Arbejde :', LEFT_X, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Timer', LEFT_X + 4, y);
  y += 6;
  doc.text('Total, Arbejde', LEFT_X, y);

  // Bottom totals/terms
  y = 255;
  doc.setFontSize(9);
  dottedLabel(doc, 'BetalingID', LEFT_X, y);
  doc.text(paymentIdFromInvoice(invoice.id), pageWidth - 12, y, { align: 'right' });
  y += 6;
  doc.text('Efter forfald beregnes 1,5% pr. påbegyndt måned', LEFT_X, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total beløb', LEFT_X, y);
  doc.text(dkk(total), pageWidth - 12, y, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    'Qasapi 2A - P.O. Box 104 - 3900 Nuuk - Greenland - Phone +299 34 24 89 - E-mail: saffiorfik@saffiorfik.gl -',
    LEFT_X,
    284
  );
  doc.text(
    'GrønlandsBanken 6471-2057708 - IBAN:GL6764710002057708 SWIFT:GRENGLGX - CVR nr. 42791482',
    LEFT_X,
    288
  );

  doc.save(`Faktura-${invoice.id}-${invoice.customerName.replace(/\s/g, '-')}.pdf`);
};
