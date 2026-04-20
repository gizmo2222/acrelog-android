import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Project, Task, TaskEquipmentLog, ProjectStatus, TaskStatus } from '../types';
import { addHours } from './equipment';
import { getMaintenanceTasks, updateMaintenanceTask } from './maintenance';

// ─── Projects ──────────────────────────────────────────────────────────────

export async function getProjects(farmId: string): Promise<Project[]> {
  const q = query(collection(db, 'projects'), where('farmId', '==', farmId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project))
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function createProject(farmId: string, name: string, dueDate?: Date): Promise<Project> {
  const user = auth.currentUser!;
  const ref = doc(collection(db, 'projects'));
  const project: Project = {
    id: ref.id,
    farmId,
    name,
    status: 'active',
    ...(dueDate ? { dueDate: Timestamp.fromDate(dueDate) } : {}),
    createdAt: serverTimestamp() as any,
    createdBy: user.uid,
  };
  await setDoc(ref, project);
  return project;
}

export async function updateProject(id: string, data: Partial<Pick<Project, 'name' | 'dueDate'>>): Promise<void> {
  await updateDoc(doc(db, 'projects', id), data);
}

export async function getTask(taskId: string): Promise<Task | null> {
  const snap = await getDoc(doc(db, 'tasks', taskId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Task;
}

export async function deleteTaskEquipmentLog(logId: string): Promise<void> {
  await deleteDoc(doc(db, 'taskEquipmentLogs', logId));
}

export async function getProject(projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, 'projects', projectId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Project;
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<void> {
  await updateDoc(doc(db, 'projects', id), { status });
}

export async function renameProject(id: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'projects', id), { name });
}

export async function deleteProject(projectId: string): Promise<void> {
  const tasks = await getTasks(projectId);
  await Promise.all(tasks.map(t => deleteDoc(doc(db, 'tasks', t.id))));
  await deleteDoc(doc(db, 'projects', projectId));
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, 'tasks', taskId));
}

// ─── Tasks ─────────────────────────────────────────────────────────────────

export async function getTasks(projectId: string): Promise<Task[]> {
  const q = query(collection(db, 'tasks'), where('projectId', '==', projectId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task))
    .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
}

export async function createTask(
  projectId: string,
  name: string,
  dueDate?: Date
): Promise<Task> {
  const user = auth.currentUser!;
  const ref = doc(collection(db, 'tasks'));
  const task: Task = {
    id: ref.id,
    projectId,
    name,
    ...(dueDate ? { dueDate: Timestamp.fromDate(dueDate) } : {}),
    status: 'pending',
    createdAt: serverTimestamp() as any,
  };
  await setDoc(ref, task);
  return task;
}

export async function completeTask(id: string): Promise<void> {
  const user = auth.currentUser!;
  await updateDoc(doc(db, 'tasks', id), {
    status: 'completed' as TaskStatus,
    completedAt: serverTimestamp(),
    completedBy: user.uid,
  });
}

export async function startTask(id: string): Promise<void> {
  await updateDoc(doc(db, 'tasks', id), { status: 'in_progress' as TaskStatus });
}

export async function reopenTask(id: string): Promise<void> {
  await updateDoc(doc(db, 'tasks', id), {
    status: 'pending' as TaskStatus,
    completedAt: null,
    completedBy: null,
  });
}

export async function updateTask(id: string, data: Partial<Task>): Promise<void> {
  await updateDoc(doc(db, 'tasks', id), data);
}

// ─── Equipment Logs ────────────────────────────────────────────────────────

export async function logEquipmentUsage(
  taskId: string,
  projectId: string,
  equipmentId: string,
  equipmentFarmId: string,
  hours: number
): Promise<TaskEquipmentLog> {
  const user = auth.currentUser!;
  const ref = doc(collection(db, 'taskEquipmentLogs'));
  const log: TaskEquipmentLog = {
    id: ref.id,
    taskId,
    projectId,
    equipmentId,
    equipmentFarmId,
    hours,
    loggedAt: serverTimestamp() as any,
    userId: user.uid,
  };
  await setDoc(ref, log);

  // Update equipment total hours and recalculate maintenance
  await addHours(equipmentId, hours);
  await recalculateMaintenanceForEquipment(equipmentId);

  return log;
}

export async function getTaskEquipmentLogs(taskId: string): Promise<TaskEquipmentLog[]> {
  const q = query(collection(db, 'taskEquipmentLogs'), where('taskId', '==', taskId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskEquipmentLog));
}

async function recalculateMaintenanceForEquipment(equipmentId: string): Promise<void> {
  const { getEquipmentById } = await import('./equipment');
  const equipment = await getEquipmentById(equipmentId);
  if (!equipment) return;

  const tasks = await getMaintenanceTasks(equipmentId);
  await Promise.all(
    tasks.map((task) => {
      if (!task.intervalHours || !task.lastCompletedHours) return;
      const nextDueHours = task.lastCompletedHours + task.intervalHours;
      return updateMaintenanceTask(task.id, { nextDueHours });
    })
  );
}
