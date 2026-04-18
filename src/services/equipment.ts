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
  increment,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage, auth } from './firebase';
import {
  Equipment,
  EquipmentStatus,
  Category,
  MeterReading,
  DowntimeRecord,
  EquipmentPhoto,
} from '../types';

// ─── Categories ────────────────────────────────────────────────────────────

export const BUILT_IN_CATEGORIES: Omit<Category, 'id' | 'farmId'>[] = [
  {
    name: 'Tractors & Vehicles',
    builtIn: true,
    defaultFields: [
      { key: 'oilType', label: 'Oil Type', type: 'text' },
      { key: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Diesel', 'Gasoline', 'Electric'] },
      { key: 'horsepower', label: 'Horsepower', type: 'number' },
    ],
  },
  {
    name: 'Chainsaws & Cutting',
    builtIn: true,
    defaultFields: [
      { key: 'chainType', label: 'Chain Type', type: 'text' },
      { key: 'barLength', label: 'Bar Length (in)', type: 'number' },
      { key: 'oilType', label: 'Bar Oil Type', type: 'text' },
    ],
  },
  {
    name: 'Irrigation',
    builtIn: true,
    defaultFields: [
      { key: 'pumpType', label: 'Pump Type', type: 'text' },
      { key: 'flowRate', label: 'Flow Rate (GPM)', type: 'number' },
    ],
  },
  {
    name: 'Tillage & Planting',
    builtIn: true,
    defaultFields: [
      { key: 'workingWidth', label: 'Working Width (ft)', type: 'number' },
      { key: 'attachmentType', label: 'Attachment Type', type: 'text' },
    ],
  },
  {
    name: 'Harvesting',
    builtIn: true,
    defaultFields: [
      { key: 'cuttingWidth', label: 'Cutting Width (ft)', type: 'number' },
    ],
  },
  {
    name: 'Hand Tools',
    builtIn: true,
    defaultFields: [],
  },
  {
    name: 'Electrical & Power',
    builtIn: true,
    defaultFields: [
      { key: 'voltage', label: 'Voltage', type: 'text' },
      { key: 'wattage', label: 'Wattage', type: 'number' },
    ],
  },
  {
    name: 'Storage & Structures',
    builtIn: true,
    defaultFields: [
      { key: 'capacity', label: 'Capacity', type: 'text' },
      { key: 'material', label: 'Material', type: 'text' },
    ],
  },
];

export async function ensureBuiltInCategories(farmId: string): Promise<void> {
  const q = query(collection(db, 'categories'), where('farmId', '==', farmId), where('builtIn', '==', true));
  const snap = await getDocs(q);
  if (snap.size >= BUILT_IN_CATEGORIES.length) return;

  await Promise.all(
    BUILT_IN_CATEGORIES.map((cat) => {
      const ref = doc(collection(db, 'categories'));
      return setDoc(ref, { ...cat, farmId, id: ref.id });
    })
  );
}

export async function getCategories(farmId: string): Promise<Category[]> {
  const q = query(collection(db, 'categories'), where('farmId', '==', farmId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
}

export async function createCategory(farmId: string, name: string, defaultFields: Category['defaultFields'] = []): Promise<Category> {
  const ref = doc(collection(db, 'categories'));
  const cat: Category = { id: ref.id, farmId, name, builtIn: false, defaultFields };
  await setDoc(ref, cat);
  return cat;
}

export async function updateCategory(id: string, data: Partial<Pick<Category, 'name' | 'defaultFields'>>): Promise<void> {
  await updateDoc(doc(db, 'categories', id), data);
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', id));
}

// ─── Equipment ─────────────────────────────────────────────────────────────

export async function getEquipment(farmId: string): Promise<Equipment[]> {
  const q = query(collection(db, 'equipment'), where('farmId', '==', farmId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Equipment))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getEquipmentById(id: string): Promise<Equipment | null> {
  const snap = await getDoc(doc(db, 'equipment', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Equipment) : null;
}

export async function getEquipmentBySerial(serialNumber: string): Promise<Equipment | null> {
  const q = query(collection(db, 'equipment'), where('serialNumber', '==', serialNumber));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Equipment;
}

export async function createEquipment(data: Omit<Equipment, 'id' | 'createdAt' | 'createdBy'>): Promise<Equipment> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const ref = doc(collection(db, 'equipment'));
  const clean: any = { id: ref.id, createdAt: serverTimestamp(), createdBy: user.uid };
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) clean[k] = v;
  }
  await setDoc(ref, clean);
  return clean as Equipment;
}

export async function updateEquipment(id: string, data: Partial<Equipment>): Promise<void> {
  await updateDoc(doc(db, 'equipment', id), data);
}

export async function archiveEquipment(id: string, status: EquipmentStatus, breakReason?: string): Promise<void> {
  const update: Partial<Equipment> = { status };
  if (status === 'broken' && breakReason) update.breakReason = breakReason;
  await updateDoc(doc(db, 'equipment', id), update);
}

export async function deleteEquipment(id: string): Promise<void> {
  await deleteDoc(doc(db, 'equipment', id));
}

// ─── Images ────────────────────────────────────────────────────────────────

export async function uploadPrimaryImage(equipmentId: string, farmId: string, uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `farms/${farmId}/equipment/${equipmentId}/primary.jpg`);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  await updateDoc(doc(db, 'equipment', equipmentId), { primaryImageUrl: url });
  return url;
}

export async function uploadEquipmentPhoto(
  equipmentId: string,
  farmId: string,
  uri: string,
  label?: string
): Promise<EquipmentPhoto> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const photoId = Date.now().toString();
  const storageRef = ref(storage, `farms/${farmId}/equipment/${equipmentId}/photos/${photoId}.jpg`);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  const photo: EquipmentPhoto = { url, label, uploadedAt: Timestamp.now() };

  const snap = await getDoc(doc(db, 'equipment', equipmentId));
  const existing: EquipmentPhoto[] = snap.data()?.photos ?? [];
  await updateDoc(doc(db, 'equipment', equipmentId), { photos: [...existing, photo] });
  return photo;
}

// ─── Hours & Meter Readings ─────────────────────────────────────────────────

async function logMeterReading(equipmentId: string, totalHours: number): Promise<void> {
  const user = auth.currentUser!;
  const readingRef = doc(collection(db, 'meterReadings'));
  await setDoc(readingRef, {
    id: readingRef.id,
    equipmentId,
    hours: totalHours,
    recordedAt: serverTimestamp(),
    userId: user.uid,
  } as MeterReading);
}

export async function addHours(equipmentId: string, hours: number): Promise<void> {
  await updateDoc(doc(db, 'equipment', equipmentId), { totalHours: increment(hours) });
  const snap = await getDoc(doc(db, 'equipment', equipmentId));
  await logMeterReading(equipmentId, snap.data()?.totalHours ?? 0);
}

export async function setHours(equipmentId: string, hours: number): Promise<void> {
  await updateDoc(doc(db, 'equipment', equipmentId), { totalHours: hours });
  await logMeterReading(equipmentId, hours);
}

export async function getMeterReadings(equipmentId: string): Promise<MeterReading[]> {
  const q = query(collection(db, 'meterReadings'), where('equipmentId', '==', equipmentId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MeterReading))
    .sort((a, b) => b.recordedAt.toMillis() - a.recordedAt.toMillis());
}

// ─── Downtime ──────────────────────────────────────────────────────────────

export async function logDowntime(equipmentId: string, reason: string): Promise<DowntimeRecord> {
  const user = auth.currentUser!;
  const ref = doc(collection(db, 'downtimeRecords'));
  const record: DowntimeRecord = {
    id: ref.id,
    equipmentId,
    startedAt: serverTimestamp() as any,
    reason,
    userId: user.uid,
  };
  await setDoc(ref, record);
  return record;
}

export async function resolveDowntime(recordId: string): Promise<void> {
  await updateDoc(doc(db, 'downtimeRecords', recordId), { resolvedAt: serverTimestamp() });
}

export async function getDowntimeRecords(equipmentId: string): Promise<DowntimeRecord[]> {
  const q = query(collection(db, 'downtimeRecords'), where('equipmentId', '==', equipmentId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DowntimeRecord))
    .sort((a, b) => b.startedAt.toMillis() - a.startedAt.toMillis());
}
