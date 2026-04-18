import { Timestamp } from 'firebase/firestore';

export type UserRole = 'owner' | 'worker' | 'mechanic' | 'auditor';
export type EquipmentStatus = 'active' | 'archived' | 'sold';
export type MaintenanceStatus = 'ok' | 'due_soon' | 'overdue' | 'broken';
export type ProjectStatus = 'active' | 'archived';
export type TaskStatus = 'pending' | 'completed';

// ─── User ──────────────────────────────────────────────────────────────────

export interface FarmMembership {
  farmId: string;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  farmMemberships: FarmMembership[];
  biometricEnabled: boolean;
  createdAt: Timestamp;
}

// ─── Farm ──────────────────────────────────────────────────────────────────

export interface Farm {
  id: string;
  name: string;
  createdAt: Timestamp;
  createdBy: string;
  // Optional detail fields
  ownerName?: string;
  address?: string;
  acreage?: number;
  purchaseDate?: string;
  notes?: string;
  locations?: string[];
}

// ─── Category ──────────────────────────────────────────────────────────────

export interface CategoryField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
}

export interface Category {
  id: string;
  farmId: string;
  name: string;
  builtIn: boolean;
  defaultFields: CategoryField[];
}

// ─── Equipment ─────────────────────────────────────────────────────────────

export interface EquipmentPhoto {
  url: string;
  label?: string;
  uploadedAt: Timestamp;
}

export interface Equipment {
  id: string;
  farmId: string;
  categoryId: string;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  description: string;
  purchaseLocation: string;
  location: string;
  totalHours: number;
  customFields: Record<string, string>;
  status: EquipmentStatus;
  broken?: boolean;
  breakReason?: string;
  manufacturerUrl?: string;
  primaryImageUrl?: string;
  photos: EquipmentPhoto[];
  createdAt: Timestamp;
  createdBy: string;
}

// ─── Maintenance ───────────────────────────────────────────────────────────

export interface MaintenanceTask {
  id: string;
  equipmentId: string;
  name: string;
  imported: boolean;
  intervalHours?: number;
  intervalDays?: number;
  lastCompletedAt?: Timestamp;
  lastCompletedHours?: number;
  nextDueAt?: Timestamp;
  nextDueHours?: number;
  archived?: boolean;
  createdAt: Timestamp;
}

export interface MaintenanceLog {
  id: string;
  maintenanceTaskId: string;
  equipmentId: string;
  completedAt: Timestamp;
  hoursAtCompletion: number;
  userId: string;
  notes: string;
  diagnosticNotes: string;
  partsUsed: PartUsed[];
  receiptUrls: string[];
  photoUrls: string[];
  signedBy: string;
  signedAt?: Timestamp;
}

export interface PartUsed {
  name: string;
  partNumber: string;
  quantity: number;
}

export interface MeterReading {
  id: string;
  equipmentId: string;
  hours: number;
  recordedAt: Timestamp;
  userId: string;
}

export interface DowntimeRecord {
  id: string;
  equipmentId: string;
  startedAt: Timestamp;
  resolvedAt?: Timestamp;
  reason: string;
  userId: string;
}

// ─── Inspection ────────────────────────────────────────────────────────────

export interface InspectionItem {
  id: string;
  label: string;
  required: boolean;
}

export interface InspectionChecklist {
  id: string;
  equipmentId: string;
  name: string;
  items: InspectionItem[];
  createdAt: Timestamp;
}

export interface InspectionLog {
  id: string;
  checklistId: string;
  equipmentId: string;
  completedAt: Timestamp;
  userId: string;
  results: Record<string, boolean | string>;
  notes: string;
  signedBy: string;
}

// ─── Projects ──────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  farmId: string;
  name: string;
  status: ProjectStatus;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  dueDate?: Timestamp;
  status: TaskStatus;
  completedAt?: Timestamp;
  completedBy?: string;
  createdAt: Timestamp;
}

export interface TaskEquipmentLog {
  id: string;
  taskId: string;
  projectId: string;
  equipmentId: string;
  equipmentFarmId: string;
  hours: number;
  loggedAt: Timestamp;
  userId: string;
}

// ─── Navigation ────────────────────────────────────────────────────────────

export interface ActiveFarm {
  farmId: string;
  farmName: string;
  role: UserRole;
}
