import { Offer } from '@/types';
import { formatCurrency } from './currencyUtils';

export function printOffer(offer: Offer): boolean {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;

  const items = offer.items || [];
  const parts = offer.parts || [];
  const validItems = items.filter(i => i.description?.trim());
  const validParts = parts.filter(p => p.name?.trim());

  let rowsHtml = '';
  validItems.forEach(item => {
    const total = item.totalPrice ?? item.quantity * item.unitPrice ?? 0;
    rowsHtml += `<tr><td>${item.description}</td><td>${item.quantity}</td><td>${formatCurrency(item.unitPrice ?? 0)}</td><td>${formatCurrency(total)}</td></tr>`;
  });
  validParts.forEach(p => {
    const total = p.totalPrice ?? p.quantity * p.unitPrice ?? 0;
    rowsHtml += `<tr><td>${p.name} (${p.partNumber || '-'})</td><td>${p.quantity}</td><td>${formatCurrency(p.unitPrice ?? 0)}</td><td>${formatCurrency(total)}</td></tr>`;
  });

  const html = `
    <html>
      <head>
        <title>Tilbud ${offer.offerNumber || offer.id} - ${offer.customerName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; font-size: 14px; }
          h1 { font-size: 1.5em; margin: 0 0 8px 0; }
          .meta { color: #666; font-size: 0.9em; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
          th { background: #f5f5f5; }
          .total { font-weight: bold; font-size: 1.1em; margin-top: 16px; }
          .notes { margin-top: 16px; padding: 12px; background: #f9f9f9; border-radius: 4px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Tilbud</h1>
        <div class="meta">
          Tilbudsnr: ${offer.offerNumber || offer.id} · 
          Oprettet: ${new Date(offer.createdAt).toLocaleDateString('da-DK')} · 
          Gyldig til: ${new Date(offer.validUntil).toLocaleDateString('da-DK')}
          ${offer.machineName ? ` · Maskine: ${offer.machineName}` : ''}
        </div>
        <p><strong>Til:</strong> ${offer.customerName}</p>
        <p><strong>${offer.title}</strong></p>
        <table>
          <thead><tr><th>Beskrivelse</th><th>Antal</th><th>Pris</th><th>Beløb</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="total">Total: ${formatCurrency(offer.amount)}</div>
        ${offer.notes ? `<div class="notes"><strong>Noter:</strong> ${offer.notes}</div>` : ''}
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
  return true;
}
