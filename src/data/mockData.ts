
// Fix for the TaskStatus in mockData.ts
import { Equipment, LubricationRecord, Machine, ServiceRecord, Task, User, Document, OilType, UserRole, Location } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Anders Jensen',
    role: 'driver',
    email: 'anders@example.com',
    profileImage: null,
  },
  {
    id: '2',
    name: 'Mette Nielsen',
    role: 'mechanic',
    email: 'mette@example.com',
    profileImage: null,
  },
  {
    id: '3',
    name: 'Lars Petersen',
    role: 'admin',
    email: 'lars@example.com',
    profileImage: null,
  },
  {
    id: '4',
    name: 'Peter Hansen',
    role: 'technician',
    email: 'peter@example.com',
    profileImage: null,
  },
  {
    id: '5',
    name: 'Søren Madsen',
    role: 'blacksmith',
    email: 'soren@example.com',
    profileImage: null,
  },
  {
    id: '6',
    name: 'Gæst Bruger',
    role: 'guest', // Changed from 'viewer' to 'guest' to match UserRole
    email: 'guest@example.com',
    profileImage: null,
  },
];

export const mockEquipment: Equipment[] = [
  {
    id: 'truck-1',
    type: 'truck',
    model: 'Scania P380',
    specifications: {
      'Motor': '380 hk',
      'Akselkonfiguration': '6x2',
      'Vægt': '26.000 kg',
      'Årgang': '2018',
      'Registreringsnummer': 'AB 12 345',
    },
    images: ['/lovable-uploads/ef73a6ff-978f-4316-8d62-9c0fc5c5ef09.png'],
  },
  {
    id: 'crane-1',
    type: 'crane',
    model: 'Palfinger PK 36.002',
    specifications: {
      'Løftekapacitet': '36 tm',
      'Rækkevidde': '21.3 m',
      'Hydraulisk kapacitet': '2x70 l/min',
      'Svingvinkel': '420°',
    },
    images: ['/placeholder.svg'],
  },
  {
    id: 'winch-1',
    type: 'winch',
    model: '20T Spil',
    specifications: {
      'Trækkraft': '20 ton',
      'Wirelængde': '50 m',
      'Hastighed': '0-5 m/min',
      'Hydraulik': 'Proportional',
    },
    images: ['/placeholder.svg'],
  },
  {
    id: 'hooklift-1',
    type: 'hooklift',
    model: 'Multilift XR21',
    specifications: {
      'Løftekapacitet': '21 ton',
      'Type': 'Hook',
      'Hydraulisk kapacitet': '80 l/min',
      'Kontrolsystem': 'Digital',
    },
    images: ['/placeholder.svg'],
  },
];

export const mockServiceRecords: ServiceRecord[] = [
  {
    id: 'service-1',
    date: '2023-05-15',
    performedBy: 'Mette Nielsen',
    equipmentType: 'truck',
    description: '10.000 km service. Olieskift, filterskift, bremsecheck.',
  },
  {
    id: 'service-2',
    date: '2023-06-20',
    performedBy: 'Lars Petersen',
    equipmentType: 'crane',
    description: 'Årlig inspektion og certificering, hydraulikolie skiftet.',
    issues: 'Mindre lækage ved cylinder 2, skal observeres.',
  },
  {
    id: 'service-3',
    date: '2023-07-10',
    performedBy: 'Mette Nielsen',
    equipmentType: 'winch',
    description: 'Wire inspektion og smøring, hydraulikfilter skiftet.',
  },
  {
    id: 'service-4',
    date: '2023-09-05',
    performedBy: 'Mette Nielsen',
    equipmentType: 'truck',
    description: '20.000 km service. Komplet gennemgang.',
  },
];

export const mockLubricationRecords: LubricationRecord[] = [
  {
    id: 'lub-1',
    date: '2023-08-01',
    performedBy: 'Anders Jensen',
    equipmentType: 'crane',
    notes: 'Alle smørepunkter gennemgået.',
  },
  {
    id: 'lub-2',
    date: '2023-08-15',
    performedBy: 'Anders Jensen',
    equipmentType: 'winch',
    notes: 'Wire smurt og inspiceret.',
  },
  {
    id: 'lub-3',
    date: '2023-09-01',
    performedBy: 'Anders Jensen',
    equipmentType: 'crane',
    notes: '',
  },
  {
    id: 'lub-4',
    date: '2023-09-15',
    performedBy: 'Anders Jensen',
    equipmentType: 'winch',
    notes: '',
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Udskift bremser',
    description: 'Udskift bremseklodser og kontroller skiver på alle aksler',
    dueDate: '2023-10-15',
    status: 'pending',
    assignedTo: '2',
    equipmentType: 'truck',
  },
  {
    id: 'task-2',
    title: 'Hydraulikslangeinspektion',
    description: 'Kontroller alle hydraulikslanger for slid og lækage',
    dueDate: '2023-10-10',
    status: 'in-progress', // Fixed from 'in progress' to 'in-progress'
    assignedTo: '2',
    equipmentType: 'crane',
  },
  {
    id: 'task-3',
    title: 'Årlig certificering',
    description: 'Booking af årlig inspektion og certificering af kran og spil',
    dueDate: '2023-11-01',
    status: 'pending',
    assignedTo: '3',
    equipmentType: 'crane',
  },
];

export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'Brugsanvisning Scania P380',
    url: '/documents/brugermanual-scania.pdf',
    fileUrl: '/documents/brugermanual-scania.pdf',
    type: 'manual',
    uploadDate: '2022-01-15',
    uploadedAt: '2022-01-15', // Added to match the type
    fileName: 'brugermanual-scania.pdf',
    description: 'Officiel brugsanvisning fra Scania med komplet instruktion om brug af køretøjet.',
    accessPermissions: ['admin', 'mechanic', 'technician', 'driver'],
    uploadedBy: 'Lars Petersen',
  },
  {
    id: 'doc-2',
    title: 'Servicehåndbog Palfinger PK 36.002',
    url: '/documents/service-palfinger.pdf',
    fileUrl: '/documents/service-palfinger.pdf',
    type: 'service',
    uploadDate: '2022-02-20',
    uploadedAt: '2022-02-20', // Added to match the type
    fileName: 'service-palfinger.pdf',
    description: 'Komplet servicehåndbog med vedligeholdelsesinstruktioner for kranen.',
    accessPermissions: ['admin', 'mechanic', 'technician'],
    uploadedBy: 'Lars Petersen',
  },
  {
    id: 'doc-3',
    title: 'Certifikat for Hovedeftersyn',
    url: '/documents/certifikat-2023.pdf',
    fileUrl: '/documents/certifikat-2023.pdf',
    type: 'certification',
    uploadDate: '2023-03-10',
    uploadedAt: '2023-03-10', // Added to match the type
    fileName: 'certifikat-2023.pdf',
    description: 'Årligt certifikat efter hovedeftersyn af kran og spil.',
    accessPermissions: ['admin', 'mechanic'],
    uploadedBy: 'Lars Petersen',
  },
  {
    id: 'doc-4',
    title: 'Reservedelskatalog',
    url: '/documents/reservedele.pdf',
    fileUrl: '/documents/reservedele.pdf',
    type: 'other',
    uploadDate: '2022-05-05',
    uploadedAt: '2022-05-05', // Added to match the type
    fileName: 'reservedele.pdf',
    accessPermissions: ['admin', 'mechanic', 'technician'],
    uploadedBy: 'Lars Petersen',
  },
];

export const mockOils: OilType[] = [
  {
    id: 'oil-1',
    name: 'Shell Rimula R6 LM 10W-40',
    viscosity: '10W-40',
    specifications: { 'API': 'CI-4', 'ACEA': 'E6/E7' },
    specification: 'ACEA E6/E7, API CI-4',
    type: 'motor',
    quantity: '32 liter',
    lastChanged: '2023-05-15',
    nextChange: '2023-11-15',
    nextChangeDate: '2023-11-15',
    notes: 'Skift ved 30.000 km eller 6 måneder',
  },
  {
    id: 'oil-2',
    name: 'Mobil Delvac Synthetic Gear Oil 75W-90',
    viscosity: '75W-90',
    specifications: { 'API': 'GL-5' },
    specification: 'API GL-5',
    type: 'gear',
    quantity: '12 liter',
    lastChanged: '2023-01-10',
    nextChange: '2024-01-10',
    nextChangeDate: '2024-01-10',
  },
  {
    id: 'oil-3',
    name: 'Shell Tellus S2 V 46',
    viscosity: '46',
    specifications: { 'ISO': '11158 HV', 'DIN': '51524-3 HVLP' },
    specification: 'ISO 11158 HV, DIN 51524-3 HVLP',
    type: 'hydraulic',
    quantity: '120 liter',
    lastChanged: '2022-11-20',
    nextChange: '2023-11-20',
    nextChangeDate: '2023-11-20',
    notes: 'Skift hydraulikfilter ved olieskift',
  },
  {
    id: 'oil-4',
    name: 'Shell Gadus S2 V220 2',
    viscosity: 'NLGI 2',
    specifications: { 'NLGI': '2' },
    specification: 'NLGI 2',
    type: 'grease',
    quantity: '20 kg',
    lastChanged: '2023-05-15',
    notes: 'Anvendes til alle smørepunkter',
  },
];

export const mockMachines: Machine[] = [
  {
    id: 'machine-1',
    name: 'Heidi',
    model: 'Scania P380',
    equipment: mockEquipment,
    serviceHistory: mockServiceRecords,
    lubricationHistory: mockLubricationRecords,
    tasks: mockTasks,
    qrCode: 'machine-1',
    location: {
      name: 'Aarhus Havn',
      address: 'Aarhus Havn'
    },
    coordinates: {
      lat: 56.1568,
      lng: 10.2127
    },
    status: 'active',
    documents: mockDocuments,
    oils: mockOils,
    editPermissions: ['admin', 'mechanic', 'technician'],
    images: ['/placeholder.svg']
  },
  {
    id: 'machine-2',
    name: 'Thor',
    model: 'Volvo FH16',
    equipment: [
      {
        id: 'truck-2',
        type: 'truck',
        model: 'Volvo FH16',
        specifications: {
          'Motor': '600 hk',
          'Akselkonfiguration': '6x4',
          'Vægt': '32.000 kg',
          'Årgang': '2020',
          'Registreringsnummer': 'CD 34 567',
        },
        images: ['/placeholder.svg'],
      },
      {
        id: 'crane-2',
        type: 'crane',
        model: 'HMF 5020',
        specifications: {
          'Løftekapacitet': '50 tm',
          'Rækkevidde': '24 m',
          'Hydraulisk kapacitet': '90 l/min',
          'Svingvinkel': '400°',
        },
        images: ['/placeholder.svg'],
      }
    ],
    serviceHistory: [
      {
        id: 'service-5',
        date: '2023-08-10',
        performedBy: 'Mette Nielsen',
        equipmentType: 'truck',
        description: 'Årlig service og bremsecheck.'
      }
    ],
    lubricationHistory: [
      {
        id: 'lub-5',
        date: '2023-09-20',
        performedBy: 'Anders Jensen',
        equipmentType: 'crane',
        notes: ''
      }
    ],
    tasks: [
      {
        id: 'task-4',
        title: 'Eftersyn af hydraulikpumpe',
        description: 'Eftersyn og evt. udskiftning af hydraulikpumpe på kran',
        dueDate: '2023-11-15',
        status: 'pending',
        assignedTo: '2',
        equipmentType: 'crane',
      }
    ],
    qrCode: 'machine-2',
    location: {
      name: 'Aalborg Havn',
      address: 'Aalborg Havn'
    },
    coordinates: {
      lat: 57.0488,
      lng: 9.9217
    },
    status: 'maintenance',
    editPermissions: ['admin', 'mechanic'],
    images: ['/placeholder.svg']
  },
  {
    id: 'machine-3',
    name: 'Odin',
    model: 'MAN TGX',
    equipment: [
      {
        id: 'truck-3',
        type: 'truck',
        model: 'MAN TGX',
        specifications: {
          'Motor': '500 hk',
          'Akselkonfiguration': '8x4',
          'Vægt': '35.000 kg',
          'Årgang': '2021',
          'Registreringsnummer': 'EF 56 789',
        },
        images: ['/placeholder.svg'],
      },
      {
        id: 'winch-2',
        type: 'winch',
        model: '30T Spil',
        specifications: {
          'Trækkraft': '30 ton',
          'Wirelængde': '60 m',
          'Hastighed': '0-8 m/min',
          'Hydraulik': 'Proportional med fjernbetjening',
        },
        images: ['/placeholder.svg'],
      }
    ],
    serviceHistory: [],
    lubricationHistory: [],
    tasks: [],
    qrCode: 'machine-3',
    location: {
      name: 'Esbjerg Havn',
      address: 'Esbjerg Havn'
    },
    coordinates: {
      lat: 55.4678,
      lng: 8.4464
    },
    status: 'active',
    editPermissions: ['admin'],
    images: ['/placeholder.svg']
  }
];

export const getMachineById = (id: string): Machine | undefined => {
  return mockMachines.find(machine => machine.id === id);
};

export const getEquipmentByMachineAndType = (
  machineId: string,
  type: string
): Equipment | undefined => {
  const machine = getMachineById(machineId);
  return machine?.equipment.find(eq => eq.type === type);
};

export const getServiceHistoryByMachineAndType = (
  machineId: string,
  type: string
): ServiceRecord[] => {
  const machine = getMachineById(machineId);
  return machine?.serviceHistory.filter(record => record.equipmentType === type) || [];
};

export const getLubricationHistoryByMachineAndType = (
  machineId: string,
  type: string
): LubricationRecord[] => {
  const machine = getMachineById(machineId);
  return machine?.lubricationHistory.filter(record => record.equipmentType === type) || [];
};

export const getTasksByMachineAndType = (
  machineId: string,
  type: string
): Task[] => {
  const machine = getMachineById(machineId);
  return machine?.tasks.filter(task => task.equipmentType === type) || [];
};

export const getDocumentsByMachineId = (
  machineId: string
): Document[] => {
  const machine = getMachineById(machineId);
  return machine?.documents || [];
};

export const getOilsByMachineId = (
  machineId: string
): OilType[] => {
  const machine = getMachineById(machineId);
  return machine?.oils || [];
};
