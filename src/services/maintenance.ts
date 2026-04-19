import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadString,
  getDownloadURL,
} from 'firebase/storage';
import * as FileSystem from 'expo-file-system/legacy';
import { db, storage, auth } from './firebase';
import {
  MaintenanceTask,
  MaintenanceLog,
  MaintenanceStatus,
  PartUsed,
  InspectionChecklist,
  InspectionLog,
} from '../types';

// ─── Maintenance Tasks ──────────────────────────────────────────────────────

function computeNextDue(task: MaintenanceTask, completedAt: Timestamp, completedHours: number) {
  const nextDueHours = task.intervalHours ? completedHours + task.intervalHours : undefined;
  const nextDueAt = task.intervalDays
    ? Timestamp.fromDate(new Date(completedAt.toDate().getTime() + task.intervalDays * 86400000))
    : undefined;
  return { nextDueHours, nextDueAt };
}

export function getMaintenanceStatus(task: MaintenanceTask, currentHours: number): MaintenanceStatus {
  const now = Date.now();
  const soonWindow = 7 * 24 * 60 * 60 * 1000; // 7 days
  const hoursSoonWindow = 10;

  // If never completed, first due point is the interval itself from 0 hrs / task creation
  const effectiveNextDueHours = task.nextDueHours ?? (task.intervalHours != null ? task.intervalHours : null);
  const effectiveNextDueAt = task.nextDueAt
    ?? (task.intervalDays != null && task.createdAt
      ? Timestamp.fromMillis(task.createdAt.toMillis() + task.intervalDays * 86400000)
      : null);

  let hoursDue = false;
  let datesDue = false;
  let hoursOverdue = false;
  let datesOverdue = false;

  if (effectiveNextDueHours != null) {
    if (currentHours >= effectiveNextDueHours) hoursOverdue = true;
    else if (currentHours >= effectiveNextDueHours - hoursSoonWindow) hoursDue = true;
  }

  if (effectiveNextDueAt) {
    const dueMs = effectiveNextDueAt.toMillis();
    if (now >= dueMs) datesOverdue = true;
    else if (now >= dueMs - soonWindow) datesDue = true;
  }

  if (hoursOverdue || datesOverdue) return 'overdue';
  if (hoursDue || datesDue) return 'due_soon';
  return 'ok';
}

export async function getMaintenanceTasks(equipmentId: string): Promise<MaintenanceTask[]> {
  const q = query(collection(db, 'maintenanceTasks'), where('equipmentId', '==', equipmentId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MaintenanceTask))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createMaintenanceTask(
  data: Omit<MaintenanceTask, 'id' | 'createdAt'>
): Promise<MaintenanceTask> {
  const ref = doc(collection(db, 'maintenanceTasks'));
  // Strip undefined fields — Firestore rejects them
  const clean: any = { id: ref.id, createdAt: serverTimestamp() };
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) clean[k] = v;
  }
  await setDoc(ref, clean);
  return clean as MaintenanceTask;
}

export async function updateMaintenanceTask(id: string, data: Partial<MaintenanceTask>): Promise<void> {
  await updateDoc(doc(db, 'maintenanceTasks', id), data);
}

export async function deleteMaintenanceTask(id: string): Promise<void> {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'maintenanceTasks', id));
}

// ─── Maintenance Logs ───────────────────────────────────────────────────────

export async function logMaintenance(
  task: MaintenanceTask,
  hoursAtCompletion: number,
  notes: string,
  diagnosticNotes: string,
  partsUsed: PartUsed[],
  receiptUris: string[],
  photoUris: string[],
  equipmentFarmId: string
): Promise<MaintenanceLog> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const completedAt = Timestamp.now();

  // Upload receipts and photos
  const receiptUrls = await Promise.all(
    receiptUris.map((uri) => uploadMaintenanceFile(task.equipmentId, equipmentFarmId, uri, 'receipts'))
  );
  const photoUrls = await Promise.all(
    photoUris.map((uri) => uploadMaintenanceFile(task.equipmentId, equipmentFarmId, uri, 'photos'))
  );

  const logRef = doc(collection(db, 'maintenanceLogs'));
  const log: any = {
    id: logRef.id,
    maintenanceTaskId: task.id,
    equipmentId: task.equipmentId,
    completedAt,
    hoursAtCompletion,
    userId: user.uid,
    notes: notes || '',
    diagnosticNotes: diagnosticNotes || '',
    partsUsed: partsUsed ?? [],
    receiptUrls: receiptUrls ?? [],
    photoUrls: photoUrls ?? [],
    signedBy: user.uid,
    signedAt: completedAt,
  };
  await setDoc(logRef, log);

  // Update task's last completed, next due, and auto-archive one-time tasks
  const { nextDueHours, nextDueAt } = computeNextDue(task, completedAt, hoursAtCompletion);
  const isOneTime = !task.intervalHours && !task.intervalDays;
  await updateDoc(doc(db, 'maintenanceTasks', task.id), {
    lastCompletedAt: completedAt,
    lastCompletedHours: hoursAtCompletion,
    nextDueHours: nextDueHours ?? null,
    nextDueAt: nextDueAt ?? null,
    ...(isOneTime ? { archived: true } : {}),
  });

  return log;
}

export async function archiveMaintenanceTask(id: string, archived: boolean): Promise<void> {
  await updateDoc(doc(db, 'maintenanceTasks', id), { archived });
}

async function uriToBase64(uri: string): Promise<string> {
  const local = `${FileSystem.cacheDirectory}upload_${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: uri, to: local });
  const base64 = await FileSystem.readAsStringAsync(local, { encoding: FileSystem.EncodingType.Base64 });
  FileSystem.deleteAsync(local, { idempotent: true });
  return base64;
}

export async function uploadTaskPhoto(equipmentId: string, farmId: string, taskId: string, uri: string): Promise<string> {
  const base64 = await uriToBase64(uri);
  const fileId = Date.now().toString();
  const storageRef = ref(storage, `farms/${farmId}/equipment/${equipmentId}/tasks/${taskId}/${fileId}`);
  await uploadString(storageRef, base64, 'base64');
  return getDownloadURL(storageRef);
}

async function uploadMaintenanceFile(
  equipmentId: string,
  farmId: string,
  uri: string,
  folder: string
): Promise<string> {
  const base64 = await uriToBase64(uri);
  const fileId = Date.now().toString();
  const storageRef = ref(storage, `farms/${farmId}/equipment/${equipmentId}/maintenance/${folder}/${fileId}`);
  await uploadString(storageRef, base64, 'base64');
  return getDownloadURL(storageRef);
}

export async function updateMaintenanceLog(id: string, data: Partial<MaintenanceLog>): Promise<void> {
  await updateDoc(doc(db, 'maintenanceLogs', id), data);
}

export async function deleteMaintenanceLog(id: string): Promise<void> {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'maintenanceLogs', id));
}

export async function getMaintenanceLogs(equipmentId: string): Promise<MaintenanceLog[]> {
  const q = query(collection(db, 'maintenanceLogs'), where('equipmentId', '==', equipmentId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MaintenanceLog))
    .sort((a, b) => b.completedAt.toMillis() - a.completedAt.toMillis());
}

// ─── Import from URL ────────────────────────────────────────────────────────

export async function scrapeMaintenanceSchedule(
  url: string
): Promise<Omit<MaintenanceTask, 'id' | 'equipmentId' | 'createdAt'>[]> {
  // Best-effort scrape via a simple fetch + text extraction
  // Results are always user-reviewed before saving
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Strip tags and look for maintenance-like patterns
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const tasks: Omit<MaintenanceTask, 'id' | 'equipmentId' | 'createdAt'>[] = [];

    // Match patterns like "every X hours" or "every X months/days"
    const hourPattern = /([^.]{0,60})\bevery\s+(\d+)\s+hours?/gi;
    const dayPattern = /([^.]{0,60})\bevery\s+(\d+)\s+(days?|months?|weeks?)/gi;

    let match;
    while ((match = hourPattern.exec(text)) !== null) {
      const name = match[1].trim().slice(-60) || 'Maintenance task';
      tasks.push({ name, intervalHours: parseInt(match[2]), imported: true });
    }
    while ((match = dayPattern.exec(text)) !== null) {
      const name = match[1].trim().slice(-60) || 'Maintenance task';
      const unit = match[3].toLowerCase();
      let days = parseInt(match[2]);
      if (unit.startsWith('week')) days *= 7;
      if (unit.startsWith('month')) days *= 30;
      tasks.push({ name, intervalDays: days, imported: true });
    }

    return tasks.slice(0, 20); // cap at 20 suggestions
  } catch {
    return [];
  }
}

// ─── Inspections ────────────────────────────────────────────────────────────

export async function getInspectionChecklists(equipmentId: string): Promise<InspectionChecklist[]> {
  const q = query(collection(db, 'inspectionChecklists'), where('equipmentId', '==', equipmentId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InspectionChecklist));
}

export async function createInspectionChecklist(
  data: Omit<InspectionChecklist, 'id' | 'createdAt'>
): Promise<InspectionChecklist> {
  const ref = doc(collection(db, 'inspectionChecklists'));
  const checklist: InspectionChecklist = { ...data, id: ref.id, createdAt: serverTimestamp() as any };
  await setDoc(ref, checklist);
  return checklist;
}

export async function logInspection(data: Omit<InspectionLog, 'id'>): Promise<InspectionLog> {
  const ref = doc(collection(db, 'inspectionLogs'));
  const log: InspectionLog = { ...data, id: ref.id };
  await setDoc(ref, log);
  return log;
}
