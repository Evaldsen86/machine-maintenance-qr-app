export type UserRole = 'admin' | 'leader' | 'lagermand' | 'mechanic' | 'technician' | 'driver' | 'blacksmith' | 'guest' | 'viewer' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  profileImage?: string | null;
  phone?: string;
  certificates?: string[];
  skills?: string[];
  notes?: string;
  passcode?: string;
  canRegisterService?: boolean;
  canRegisterLubrication?: boolean;
}

export interface Location {
  id?: string;
  name: string;
  address?: string;
  postalCode?: string;
  country?: string;
  lat?: number;
  lon?: number;
}

export interface Equipment {
  id: string;
  type: EquipmentType;
  brand?: string;
  model: string;
  serialNumber?: string;
  year?: string;
  nextServiceDate?: string;
  lastServiceDate?: string;
  images?: string[];
  models3D?: Model3D[];
  manuals?: string[];
  specifications?: Record<string, string>;
}

export interface Machine {
  /**
   * NOTE: id is a string in the frontend, but must be converted to a number
   * when calling backend or Supabase functions, as the database expects a number.
   */
  id: string;
  name: string;
  description?: string;
  status: MachineStatus;
  location?: string | Location;
  coordinates?: { lat: number; lng: number };
  serialNumber?: string;
  model: string;
  brand?: string;
  year?: string;
  equipment: Equipment[];
  serviceHistory?: ServiceRecord[];
  lubricationHistory?: LubricationRecord[];
  maintenanceSchedules?: MaintenanceSchedule[];
  tasks?: Task[];
  documents?: Document[];
  oils?: OilType[];
  images?: string[];
  models3D?: Model3D[];
  qrCode?: string;
  qr_data?: {
    width: number;
    margin: number;
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
    color: {
      dark: string;
      light: string;
    };
    format: 'png' | 'svg' | 'pdf';
    includeLogo: boolean;
    logoSize: number;
    logoUrl?: string;
  };
  editPermissions?: UserRole[];
  createdAt?: string;
}

export type MachineStatus = 'active' | 'inactive' | 'maintenance' | 'repair';

export type EquipmentType = 'truck' | 'crane' | 'winch' | 'hooklift';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'canceled' | 'approved' | 'invoiced';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  equipmentType: EquipmentType;
  timeEntryId?: string;
  approvedBy?: string;
  approvedAt?: string;
  hourlyRate?: number;
  estimatedHours?: number;
  customerId?: string;
  customerName?: string;
  invoiceId?: string;
  /** Link til tilbud når opgaven er oprettet fra et accepteret tilbud */
  offerId?: string;
}

export interface ServiceRecord {
  id: string;
  date: string;
  performedBy: string;
  equipmentType: EquipmentType;
  description: string;
  issues?: string;
  odometerReading?: number;
}

export interface LubricationRecord {
  id: string;
  date: string;
  performedBy: string;
  equipmentType: EquipmentType;
  notes?: string;
}

export interface MaintenanceSchedule {
  id: string;
  equipmentType: EquipmentType;
  taskDescription: string;
  interval: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  intervalUnit?: string;
  customInterval?: number;
  nextDue?: string;
  lastPerformed?: string;
  intervalKm?: number;
}

export interface OilType {
  id: string;
  name: string;
  type: string;
  viscosity: string;
  specifications?: string | Record<string, string>;
  specification?: string;
  applicableEquipment?: EquipmentType[];
  lastChanged?: string;
  nextChange?: string;
  nextChangeDate?: string;
  quantity?: string;
  notes?: string;
}

export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  uploadedAt: string;
  uploadedBy?: string;
  size?: string;
  accessLevel?: 'public' | 'private' | 'restricted';
  authorizedRoles?: UserRole[];
  allowedRoles?: UserRole[];
  allowedUsers?: string[];
  url?: string;
  type?: 'manual' | 'service' | 'certification' | 'other';
  description?: string;
  uploadDate?: string;
  accessPermissions?: UserRole[];
  viewRoles?: UserRole[];
  downloadRoles?: UserRole[];
  viewUsers?: string[];
  downloadUsers?: string[];
}

export interface Model3D {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType: '3d-glb' | '3d-usdz';
  thumbnail?: string;
  thumbnailUrl?: string;
  type?: 'glb' | 'usdz'; // Legacy support
  file?: File; // Legacy support - File objects can't be serialized
}

// Legacy function - use createModel3DFromFile from utils/model3DUtils.ts instead
export const createModel3DFromFile = (file: File, thumbnailUrl?: string): Model3D => {
  const fileUrl = URL.createObjectURL(file);
  const fileName = file.name.toLowerCase();
  const fileType = fileName.endsWith('.glb') ? '3d-glb' : '3d-usdz';
  
  return {
    id: crypto.randomUUID(),
    fileUrl,
    fileName: file.name,
    fileType,
    thumbnail: thumbnailUrl,
    thumbnailUrl,
    type: fileName.endsWith('.glb') ? 'glb' : 'usdz',
    file
  };
};

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  description?: string;
}

export interface SiteConfig {
  mainNav: NavItem[];
  sidebarNav: NavItem[];
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface EquipmentSpecificInterval {
  equipmentType: EquipmentType;
  interval: number;
  unit: 'days' | 'weeks' | 'months';
  enabled?: boolean;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  advanceNotice: number;
  advanceUnit: 'hours' | 'days' | 'weeks';
  emailNotifications?: boolean;
  serviceRemindersEnabled?: boolean;
  serviceReminderInterval?: string;
  serviceCustomInterval?: number;
  serviceIntervalUnit?: string;
  lubricationRemindersEnabled?: boolean;
  lubricationReminderInterval?: string;
  lubricationCustomInterval?: number;
  lubricationIntervalUnit?: string;
  daysBeforeDeadline?: number;
  serviceRecipients?: string[];
  lubricationRecipients?: string[];
  taskAssignments?: boolean;
  systemUpdates?: boolean;
  documentUploads?: boolean;
  equipmentSpecificIntervals?: EquipmentSpecificInterval[];
  maintenance?: boolean;
  tasks?: boolean;
  documents?: boolean;
}

export interface TimeEntry {
  id: string;
  machineId: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  description: string;
  status: 'active' | 'completed' | 'approved' | 'rejected';
  equipmentType: EquipmentType;
  partsUsed?: Part[];
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export interface Part {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
  subtotal: number;
  vat: number;
  total: number;
  notes?: string;
  offerId?: string;
  taskId?: string;
  machineId?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  type: 'time' | 'part' | 'service';
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  timeEntryId?: string;
  partId?: string;
}

export interface PayrollEntry {
  id: string;
  userId: string;
  userName: string;
  period: string; // YYYY-MM
  regularHours: number;
  overtimeHours: number;
  status: 'draft' | 'approved' | 'exported';
  approvedBy?: string;
  approvedAt?: string;
  exportedAt?: string;
  notes?: string;
}

export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface OfferItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OfferPart {
  id: string;
  inventoryPartId?: string;
  name: string;
  partNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Offer {
  id: string;
  title: string;
  customerName: string;
  amount: number; // total, calculated from items + parts
  status: OfferStatus;
  validUntil: string; // ISO date string
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  machineId?: string;
  machineName?: string;
  items: OfferItem[];
  parts?: OfferPart[];
  invoiceId?: string;
  /** Link til igangværende projekt/opgave når tilbud er accepteret */
  taskId?: string;
}

export interface InventoryPart {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  unitPrice: number;
  location?: string;
  machineIds: string[];
  notes?: string;
}

// E-Learning Types
export type TruckBrand = 'Scania' | 'Volvo' | 'Mercedes' | 'Other';
export type TruckType = 'tractor' | 'crane_with_lad' | 'hooklift' | 'zepro_lift' | 'garbage_truck' | 'water_truck' | 'sludge_sucker' | 'other';
export type EquipmentAttachment = 'crane' | 'winch' | 'boat_supports' | 'load_extender' | 'outriggers' | 'other';
export type ChecklistFrequency = 'daily' | 'weekly' | 'monthly';

export interface Video {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number; // in seconds
  category: string; // e.g., 'crane', 'sideloader', 'truck_checks'
  subCategory?: string; // e.g., 'unpacking', 'packing', 'outriggers', 'winch'
  equipmentAttachment?: EquipmentAttachment[];
  truckBrands?: TruckBrand[];
  truckTypes?: TruckType[];
  machineIds?: string[]; // Linked to specific machines
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  order?: number; // For ordering videos in a course
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  videos: Video[];
  category: string;
  machineIds?: string[]; // Linked to specific machines
  equipmentAttachments?: EquipmentAttachment[];
  truckBrands?: TruckBrand[];
  truckTypes?: TruckType[];
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  frequency: ChecklistFrequency;
  order: number;
}

export interface MachineChecklist {
  id: string;
  machineId: string;
  machineName: string;
  dailyChecks: ChecklistItem[];
  weeklyChecks: ChecklistItem[];
  monthlyChecks: ChecklistItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface VideoProgress {
  id: string;
  userId: string;
  userName: string;
  videoId: string;
  videoTitle: string;
  watchedAt: string;
  progress: number; // 0-100 percentage
  completed: boolean;
  lastPosition?: number; // Last watched position in seconds
}

export interface Approval {
  id: string;
  userId: string; // The driver being approved
  userName: string;
  machineId: string;
  machineName: string;
  approvedBy: string; // Admin/manager/colleague who approved
  approvedByName: string;
  approvedAt: string;
  notes?: string;
  videoIds?: string[]; // Videos that were required for approval
  status: 'pending' | 'approved' | 'rejected';
}
