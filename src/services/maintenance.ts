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
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
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

  let hoursDue = false;
  let datesDue = false;
  let hoursOverdue = false;
  let datesOverdue = false;

  if (task.nextDueHours !== undefined) {
    if (currentHours >= task.nextDueHours) hoursOverdue = true;
    else if (currentHours >= task.nextDueHours - hoursSoonWindow) hoursDue = true;
  }

  if (task.nextDueAt) {
    const dueMs = task.nextDueAt.toMillis();
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
  const task: MaintenanceTask = { ...data, id: ref.id, createdAt: serverTimestamp() as any };
  await setDoc(ref, task);
  return task;
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
  const user = auth.currentUser!;
  const completedAt = Timestamp.now();

  // Upload receipts and photos
  const receiptUrls = await Promise.all(
    receiptUris.map((uri) => uploadMaintenanceFile(task.equipmentId, equipmentFarmId, uri, 'receipts'))
  );
  const photoUrls = await Promise.all(
    photoUris.map((uri) => uploadMaintenanceFile(task.equipmentId, equipmentFarmId, uri, 'photos'))
  );

  const logRef = doc(collection(db, 'maintenanceLogs'));
  const log: MaintenanceLog = {
    id: logRef.id,
    maintenanceTaskId: task.id,
    equipmentId: task.equipmentId,
    completedAt,
    hoursAtCompletion,
    userId: user.uid,
    notes,
    diagnosticNotes,
    partsUsed,
    receiptUrls,
    photoUrls,
    signedBy: user.uid,
    signedAt: completedAt,
  };
  await setDoc(logRef, log);

  // Update task's last completed and next due
  const { nextDueHours, nextDueAt } = computeNextDue(task, completedAt, hoursAtCompletion);
  await updateDoc(doc(db, 'maintenanceTasks', task.id), {
    lastCompletedAt: completedAt,
    lastCompletedHours: hoursAtCompletion,
    nextDueHours: nextDueHours ?? null,
    nextDueAt: nextDueAt ?? null,
  });

  return log;
}

async function uploadMaintenanceFile(
  equipmentId: string,
  farmId: string,
  uri: string,
  folder: string
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const fileId = Date.now().toString();
  const storageRef = ref(storage, `farms/${farmId}/equipment/${equipmentId}/maintenance/${folder}/${fileId}`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
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
