import { ServiceRecord, LubricationRecord, Task, Machine } from '@/types';

export type PrintHistoryType = 'service' | 'tasks' | 'combined';

/** Udskriv hele siden (browser standard) */
export function printFullPage(): void {
  window.print();
}

/** Udskriv hele maskindata som separat dokument */
export function printFullMachineData(machine: Machine): boolean {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;

  const getEquipmentTypeName = (type: string): string => {
    switch (type) {
      case 'truck': return 'Lastbil';
      case 'crane': return 'Kran';
      case 'winch': return 'Spil';
      case 'hooklift': return 'Kroghejs';
      default: return type;
    }
  };

  const getTaskStatusName = (status: string): string => {
    switch (status) {
      case 'awaiting-parts': return 'Afventer reservedele';
      case 'ready-for-repair': return 'Klar til reparation';
      case 'pending': return 'Afventer';
      case 'in-progress': return 'I gang';
      case 'completed': return 'Færdig';
      case 'approved': return 'Godkendt';
      case 'invoiced': return 'Faktureret';
      case 'canceled': return 'Annulleret';
      default: return status;
    }
  };

  const serviceRecords = machine.serviceHistory || [];
  const lubricationRecords = machine.lubricationHistory || [];
  const tasks = machine.tasks || [];
  const sortedService = [...serviceRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sortedLubrication = [...lubricationRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sortedTasks = [...tasks].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const locationStr = typeof machine.location === 'object' && machine.location?.name
    ? machine.location.name
    : (machine.location as string) || '';

  let html = `
    <h1>Maskindata - ${machine.name}</h1>
    <div class="info-section">
      <h2>Generel information</h2>
      <table class="info-table">
        <tr><td><strong>Navn</strong></td><td>${machine.name}</td></tr>
        <tr><td><strong>Model</strong></td><td>${machine.model}</td></tr>
        ${machine.brand ? `<tr><td><strong>Mærke</strong></td><td>${machine.brand}</td></tr>` : ''}
        ${machine.year ? `<tr><td><strong>Årgang</strong></td><td>${machine.year}</td></tr>` : ''}
        ${machine.serialNumber ? `<tr><td><strong>Serienummer</strong></td><td>${machine.serialNumber}</td></tr>` : ''}
        ${machine.status ? `<tr><td><strong>Status</strong></td><td>${machine.status}</td></tr>` : ''}
        ${locationStr ? `<tr><td><strong>Lokation</strong></td><td>${locationStr}</td></tr>` : ''}
        ${machine.description ? `<tr><td><strong>Beskrivelse</strong></td><td>${machine.description}</td></tr>` : ''}
      </table>
    </div>
  `;

  if (machine.equipment && machine.equipment.length > 0) {
    html += `<h2>Udstyr</h2><div class="info-section">`;
    machine.equipment.forEach((eq, i) => {
      const specs = eq.specifications ? Object.entries(eq.specifications).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
      html += `<div class="record"><div class="record-header"><span class="record-type">${getEquipmentTypeName(eq.type)}</span></div><div class="record-description">${eq.model}</div>${specs ? `<div class="record-performer">${specs}</div>` : ''}</div>`;
    });
    html += `</div>`;
  }

  html += `<h2>Service</h2>`;
  if (sortedService.length === 0) html += `<div class="empty-message">Ingen serviceposter</div>`;
  else html += sortedService.map(r => `<div class="record"><div class="record-header"><span class="record-type">${getEquipmentTypeName(r.equipmentType)}</span><span class="record-date">${new Date(r.date).toLocaleDateString('da-DK')}</span></div><div class="record-description">${r.description}</div>${r.issues ? `<div class="record-issues">Problem: ${r.issues}</div>` : ''}<div class="record-performer">Udført af: ${r.performedBy}</div></div>`).join('');

  html += `<h2>Smøring</h2>`;
  if (sortedLubrication.length === 0) html += `<div class="empty-message">Ingen smøringsposter</div>`;
  else html += sortedLubrication.map(r => `<div class="record"><div class="record-header"><span class="record-type">${getEquipmentTypeName(r.equipmentType)}</span><span class="record-date">${new Date(r.date).toLocaleDateString('da-DK')}</span></div>${r.notes ? `<div class="record-description">${r.notes}</div>` : ''}<div class="record-performer">Udført af: ${r.performedBy}</div></div>`).join('');

  html += `<h2>Opgaver</h2>`;
  if (sortedTasks.length === 0) html += `<div class="empty-message">Ingen opgaver</div>`;
  else html += sortedTasks.map(t => `<div class="record"><div class="record-header"><span class="record-type">${t.title}</span><span class="record-date">${new Date(t.dueDate).toLocaleDateString('da-DK')} · ${getTaskStatusName(t.status || '')}</span></div><div class="record-description">${t.description}</div>${t.customerName ? `<div class="record-performer">Kunde: ${t.customerName}</div>` : ''}</div>`).join('');

  const fullStyles = baseStyles + `
    .info-section { margin-bottom: 20px; }
    .info-table { border-collapse: collapse; width: 100%; max-width: 400px; }
    .info-table td { padding: 6px 12px; border: 1px solid #eee; }
    .info-table td:first-child { width: 140px; color: #555; }
  `;

  printWindow.document.write(`
    <html>
      <head>
        <title>Maskindata - ${machine.name}</title>
        <style>${fullStyles}</style>
      </head>
      <body>${html}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
  return true;
}

const getEquipmentTypeName = (type: string): string => {
  switch (type) {
    case 'truck': return 'Lastbil';
    case 'crane': return 'Kran';
    case 'winch': return 'Spil';
    case 'hooklift': return 'Kroghejs';
    default: return type;
  }
};

const getTaskStatusName = (status: string): string => {
  switch (status) {
    case 'awaiting-parts': return 'Afventer reservedele';
    case 'ready-for-repair': return 'Klar til reparation';
    case 'pending': return 'Afventer';
    case 'in-progress': return 'I gang';
    case 'completed': return 'Færdig';
    case 'approved': return 'Godkendt';
    case 'invoiced': return 'Faktureret';
    case 'canceled': return 'Annulleret';
    default: return status;
  }
};

const baseStyles = `
  body { font-family: Arial, sans-serif; padding: 20px; font-size: 14px; }
  h1 { color: #333; font-size: 1.5em; margin-top: 0; }
  h2 { color: #555; font-size: 1.2em; margin-top: 24px; margin-bottom: 12px; }
  .record { border: 1px solid #ddd; padding: 12px 15px; margin-bottom: 12px; border-radius: 5px; }
  .record-header { display: flex; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 8px; }
  .record-type { font-weight: bold; color: #555; }
  .record-date { color: #777; font-size: 0.9em; }
  .record-description { margin-bottom: 6px; }
  .record-issues { background-color: #fff4f4; padding: 8px; border-radius: 4px; color: #c41e3a; margin-top: 6px; }
  .record-performer { font-size: 0.85em; color: #777; margin-top: 6px; }
  .empty-message { color: #888; font-style: italic; padding: 20px; }
  @media print {
    body { padding: 0; }
    h1, h2 { margin-top: 0; page-break-after: avoid; }
    .record { page-break-inside: avoid; }
  }
`;

function buildServiceHtml(
  serviceRecords: ServiceRecord[],
  lubricationRecords: LubricationRecord[],
  machineName: string
): string {
  const sortedService = [...serviceRecords].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const sortedLubrication = [...lubricationRecords].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let html = `<h1>Servicehistorik - ${machineName}</h1>`;

  html += `<h2>Service</h2>`;
  if (sortedService.length === 0) {
    html += `<div class="empty-message">Ingen serviceposter</div>`;
  } else {
    html += sortedService.map(record => `
      <div class="record">
        <div class="record-header">
          <span class="record-type">${getEquipmentTypeName(record.equipmentType)}</span>
          <span class="record-date">${new Date(record.date).toLocaleDateString('da-DK')}</span>
        </div>
        <div class="record-description">${record.description}</div>
        ${record.issues ? `<div class="record-issues">Problem: ${record.issues}</div>` : ''}
        <div class="record-performer">Udført af: ${record.performedBy}</div>
      </div>
    `).join('');
  }

  html += `<h2>Smøring</h2>`;
  if (sortedLubrication.length === 0) {
    html += `<div class="empty-message">Ingen smøringsposter</div>`;
  } else {
    html += sortedLubrication.map(record => `
      <div class="record">
        <div class="record-header">
          <span class="record-type">${getEquipmentTypeName(record.equipmentType)}</span>
          <span class="record-date">${new Date(record.date).toLocaleDateString('da-DK')}</span>
        </div>
        ${record.notes ? `<div class="record-description">${record.notes}</div>` : ''}
        <div class="record-performer">Udført af: ${record.performedBy}</div>
      </div>
    `).join('');
  }

  return html;
}

function buildTasksHtml(tasks: Task[], machineName: string): string {
  const completedTasks = tasks.filter(t =>
    ['completed', 'approved', 'invoiced'].includes(t.status || '')
  );
  const sortedTasks = [...completedTasks].sort((a, b) =>
    new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
  );

  let html = `<h1>Opgavehistorik - ${machineName}</h1>`;
  html += `<p class="record-performer">Udførte opgaver (afsluttet, godkendt eller faktureret)</p>`;

  if (sortedTasks.length === 0) {
    html += `<div class="empty-message">Ingen udførte opgaver</div>`;
  } else {
    html += sortedTasks.map(task => `
      <div class="record">
        <div class="record-header">
          <span class="record-type">${task.title}</span>
          <span class="record-date">${new Date(task.dueDate).toLocaleDateString('da-DK')} · ${getTaskStatusName(task.status || '')}</span>
        </div>
        <div class="record-description">${task.description}</div>
        ${task.customerName ? `<div class="record-performer">Kunde: ${task.customerName}</div>` : ''}
      </div>
    `).join('');
  }

  return html;
}

export interface PrintHistoryOptions {
  machineName: string;
  serviceRecords: ServiceRecord[];
  lubricationRecords: LubricationRecord[];
  tasks: Task[];
  printType: PrintHistoryType;
}

export function printHistory(options: PrintHistoryOptions): boolean {
  const {
    machineName,
    serviceRecords,
    lubricationRecords,
    tasks,
    printType
  } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;

  let title = 'Historik';
  let bodyHtml = '';

  switch (printType) {
    case 'service':
      title = 'Servicehistorik';
      bodyHtml = buildServiceHtml(serviceRecords, lubricationRecords, machineName);
      break;
    case 'tasks':
      title = 'Opgavehistorik';
      bodyHtml = buildTasksHtml(tasks, machineName);
      break;
    case 'combined':
      title = 'Service- og opgavehistorik';
      bodyHtml = buildServiceHtml(serviceRecords, lubricationRecords, machineName);
      bodyHtml += buildTasksHtml(tasks, machineName);
      break;
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${title} - ${machineName}</title>
        <style>${baseStyles}</style>
      </head>
      <body>${bodyHtml}</body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);

  return true;
}
