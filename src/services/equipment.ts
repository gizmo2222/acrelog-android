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
    name: 'Electrical & Power',
    builtIn: true,
    defaultFields: [
      { key: 'powerType', label: 'Power Type', type: 'select', options: ['Generator', 'Solar Panel', 'Wind Turbine', 'Transfer Switch', 'Panel', 'Motor', 'Battery Bank'] },
      { key: 'voltage', label: 'Voltage', type: 'select', options: ['12V', '24V', '120V', '240V', '480V'] },
      { key: 'wattage', label: 'Wattage / KW', type: 'number' },
    ],
  },
  {
    name: 'Hand Tools',
    builtIn: true,
    defaultFields: [],
  },
  {
    name: 'Harvesting',
    builtIn: true,
    defaultFields: [
      { key: 'equipmentType', label: 'Equipment Type', type: 'select', options: ['Combine', 'Baler', 'Mower-Conditioner', 'Swather', 'Forage Harvester', 'Grain Cart', 'Header'] },
      { key: 'cuttingWidth', label: 'Cutting / Header Width (ft)', type: 'number' },
      { key: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Diesel', 'Gasoline'] },
    ],
  },
  {
    name: 'Irrigation',
    builtIn: true,
    defaultFields: [
      { key: 'systemType', label: 'System Type', type: 'select', options: ['Center Pivot', 'Drip / Micro', 'Flood', 'Sprinkler', 'Pump Station', 'Traveling Gun'] },
      { key: 'powerSource', label: 'Power Source', type: 'select', options: ['Electric', 'Diesel', 'Gasoline', 'Solar'] },
      { key: 'flowRate', label: 'Flow Rate (GPM)', type: 'number' },
      { key: 'pressure', label: 'Operating Pressure (PSI)', type: 'number' },
    ],
  },
  {
    name: 'Livestock Equipment',
    builtIn: true,
    defaultFields: [
      { key: 'equipmentType', label: 'Equipment Type', type: 'select', options: ['Feeder', 'Waterer', 'Squeeze Chute', 'Headgate', 'Scale', 'Corral Panel', 'Bunk', 'Other'] },
      { key: 'capacity', label: 'Capacity', type: 'text' },
    ],
  },
  {
    name: 'Loaders & Skid Steers',
    builtIn: true,
    defaultFields: [
      { key: 'equipmentType', label: 'Equipment Type', type: 'select', options: ['Skid Steer', 'Track Loader', 'Telehandler', 'Wheel Loader', 'Forklift'] },
      { key: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Diesel', 'Gasoline', 'Electric', 'Propane'] },
      { key: 'horsepower', label: 'Horsepower', type: 'number' },
      { key: 'liftCapacity', label: 'Rated Lift Capacity (lbs)', type: 'number' },
    ],
  },
  {
    name: 'Power Tools',
    builtIn: true,
    defaultFields: [
      { key: 'toolType', label: 'Tool Type', type: 'select', options: ['Chainsaw', 'Pressure Washer', 'Generator', 'Welder', 'Auger', 'Tiller', 'Leaf Blower', 'Pump', 'Other'] },
      { key: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Gasoline', 'Diesel', 'Electric', 'Battery'] },
      { key: 'engineSize', label: 'Engine Size (cc)', type: 'number' },
    ],
  },
  {
    name: 'Sprayers',
    builtIn: true,
    defaultFields: [
      { key: 'mountType', label: 'Mount Type', type: 'select', options: ['Self-Propelled', 'Pull-Type', 'ATV/UTV', '3-Point Hitch'] },
      { key: 'tankCapacity', label: 'Tank Capacity (gal)', type: 'number' },
      { key: 'boomWidth', label: 'Boom Width (ft)', type: 'number' },
      { key: 'nozzleType', label: 'Nozzle Type', type: 'text' },
    ],
  },
  {
    name: 'Storage & Structures',
    builtIn: true,
    defaultFields: [
      { key: 'structureType', label: 'Structure Type', type: 'select', options: ['Grain Bin', 'Fuel Tank', 'Water Tank', 'Propane Tank', 'Silo', 'Barn', 'Shop', 'Greenhouse', 'Bunker'] },
      { key: 'capacity', label: 'Capacity (gal or bu)', type: 'text' },
      { key: 'material', label: 'Material', type: 'select', options: ['Steel', 'Fiberglass', 'Poly', 'Concrete', 'Wood'] },
    ],
  },
  {
    name: 'Tillage & Planting',
    builtIn: true,
    defaultFields: [
      { key: 'equipmentType', label: 'Equipment Type', type: 'select', options: ['Plow', 'Disc', 'Field Cultivator', 'Chisel Plow', 'Subsoiler', 'Planter', 'Drill', 'Strip-Till'] },
      { key: 'workingWidth', label: 'Working Width (ft)', type: 'number' },
      { key: 'hitchType', label: 'Hitch Type', type: 'select', options: ['3-Point Cat I', '3-Point Cat II', '3-Point Cat III', 'Pull-Type', 'Toolbar'] },
    ],
  },
  {
    name: 'Tractors & Vehicles',
    builtIn: true,
    defaultFields: [
      { key: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Diesel', 'Gasoline', 'Propane', 'Electric'] },
      { key: 'horsepower', label: 'Horsepower', type: 'number' },
      { key: 'driveType', label: 'Drive Type', type: 'select', options: ['2WD', '4WD', 'MFWD', 'AWD'] },
      { key: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Powershift', 'CVT', 'Hydrostatic', 'Synchro'] },
      { key: 'engineOilType', label: 'Engine Oil Type', type: 'text' },
    ],
  },
  {
    name: 'Trailers',
    builtIn: true,
    defaultFields: [
      { key: 'trailerType', label: 'Trailer Type', type: 'select', options: ['Flatbed', 'Grain', 'Livestock', 'Utility', 'Equipment', 'Dump', 'Tanker'] },
      { key: 'gvwr', label: 'GVWR (lbs)', type: 'number' },
      { key: 'length', label: 'Length (ft)', type: 'number' },
      { key: 'hitchType', label: 'Hitch Type', type: 'select', options: ['2" Ball', '2-5/16" Ball', 'Pintle', 'Gooseneck', '5th Wheel'] },
    ],
  },
  {
    name: 'Trucks & UTVs',
    builtIn: true,
    defaultFields: [
      { key: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Diesel', 'Gasoline', 'Electric', 'Hybrid'] },
      { key: 'driveType', label: 'Drive Type', type: 'select', options: ['2WD', '4WD', 'AWD'] },
      { key: 'payload', label: 'Payload Capacity (lbs)', type: 'number' },
      { key: 'towCapacity', label: 'Tow Capacity (lbs)', type: 'number' },
    ],
  },
];

const _ensuringFarms = new Set<string>();

export async function ensureBuiltInCategories(farmId: string): Promise<void> {
  if (_ensuringFarms.has(farmId)) return;
  _ensuringFarms.add(farmId);
  try {
    const q = query(collection(db, 'categories'), where('farmId', '==', farmId), where('builtIn', '==', true));
    const snap = await getDocs(q);
    const existingNames = new Set(snap.docs.map(d => d.data().name as string));
    const missing = BUILT_IN_CATEGORIES.filter(cat => !existingNames.has(cat.name));
    if (missing.length === 0) return;

    await Promise.all(
      missing.map((cat) => {
        const ref = doc(collection(db, 'categories'));
        return setDoc(ref, { ...cat, farmId, id: ref.id });
      })
    );
  } finally {
    _ensuringFarms.delete(farmId);
  }
}

export async function getCategories(farmId: string): Promise<Category[]> {
  const q = query(collection(db, 'categories'), where('farmId', '==', farmId));
  const snap = await getDocs(q);
  const seen = new Set<string>();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Category))
    .filter((cat) => {
      if (seen.has(cat.name)) return false;
      seen.add(cat.name);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
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

export async function archiveEquipment(id: string, status: EquipmentStatus): Promise<void> {
  const snap = await getDoc(doc(db, 'equipment', id));
  const eq = snap.data();

  if (eq?.broken) {
    // Preserve the break record in downtime history before clearing
    const user = auth.currentUser!;
    const openQ = query(collection(db, 'downtimeRecords'), where('equipmentId', '==', id));
    const dtSnap = await getDocs(openQ);
    const openRecords = dtSnap.docs.filter(d => !d.data().resolvedAt);
    if (openRecords.length > 0) {
      await Promise.all(openRecords.map(d => updateDoc(d.ref, { resolvedAt: serverTimestamp() })));
    } else {
      const dtRef = doc(collection(db, 'downtimeRecords'));
      await setDoc(dtRef, {
        id: dtRef.id, equipmentId: id,
        startedAt: serverTimestamp(), resolvedAt: serverTimestamp(),
        reason: eq.breakReason ?? 'Unknown', userId: user.uid,
      });
    }
  }

  await updateDoc(doc(db, 'equipment', id), { status, broken: false, breakReason: null });
}

export async function markBroken(id: string, reason: string): Promise<void> {
  await updateDoc(doc(db, 'equipment', id), { broken: true, breakReason: reason });
}

export async function clearBroken(id: string): Promise<void> {
  await updateDoc(doc(db, 'equipment', id), { broken: false, breakReason: null });
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
