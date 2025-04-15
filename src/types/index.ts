
export type UserRole = 'admin' | 'mechanic' | 'technician' | 'driver' | 'blacksmith' | 'guest' | 'viewer' | 'customer';

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
}

export interface Location {
  id?: string;
  name: string;
  address: string;
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
  editPermissions?: UserRole[];
  createdAt?: string;
}

export type MachineStatus = 'active' | 'inactive' | 'maintenance' | 'repair';

export type EquipmentType = 'truck' | 'crane' | 'winch' | 'hooklift';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'canceled';

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
}

export interface Model3D {
  id?: string; // Add optional id property
  fileUrl: string;
  fileType: '3d-glb' | '3d-usdz' | '3d-obj';
  fileName?: string;
  thumbnail?: string;
}

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
