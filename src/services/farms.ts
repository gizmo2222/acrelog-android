import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Farm, FarmMembership, FarmMember, UserRole } from '../types';

async function syncFarmMember(farmId: string, userId: string, role: UserRole, displayName: string): Promise<void> {
  await setDoc(doc(db, 'farmMembers', `${farmId}_${userId}`), { farmId, userId, role, displayName });
}

export async function getFarmMembers(farmId: string): Promise<FarmMember[]> {
  const q = query(collection(db, 'farmMembers'), where('farmId', '==', farmId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FarmMember));
}

export async function createFarm(name: string): Promise<Farm> {
  const user = auth.currentUser!;
  const ref = doc(collection(db, 'farms'));
  const farm: Omit<Farm, 'id'> = {
    name,
    createdAt: serverTimestamp() as any,
    createdBy: user.uid,
  };
  await setDoc(ref, farm);

  const userSnap = await getDoc(doc(db, 'users', user.uid));
  const displayName = userSnap.data()?.displayName || user.email || user.uid;

  await Promise.all([
    updateDoc(doc(db, 'users', user.uid), {
      farmMemberships: arrayUnion({ farmId: ref.id, role: 'owner' } as FarmMembership),
    }),
    syncFarmMember(ref.id, user.uid, 'owner', displayName),
  ]);

  return { id: ref.id, ...farm } as Farm;
}

export async function getUserFarms(uid: string): Promise<{ farm: Farm; role: UserRole }[]> {
  const userSnap = await getDoc(doc(db, 'users', uid));
  if (!userSnap.exists()) return [];

  const memberships: FarmMembership[] = userSnap.data().farmMemberships ?? [];
  const results = await Promise.all(
    memberships.map(async (m) => {
      const farmSnap = await getDoc(doc(db, 'farms', m.farmId));
      if (!farmSnap.exists()) return null;
      return { farm: { id: farmSnap.id, ...farmSnap.data() } as Farm, role: m.role };
    })
  );
  return results.filter(Boolean) as { farm: Farm; role: UserRole }[];
}

export async function inviteUserToFarm(
  email: string,
  farmId: string,
  role: UserRole
): Promise<void> {
  const user = auth.currentUser!;
  const inviteRef = doc(collection(db, 'farmInvites'));
  await setDoc(inviteRef, {
    id: inviteRef.id,
    email: email.toLowerCase().trim(),
    farmId,
    role,
    invitedBy: user.uid,
    invitedAt: serverTimestamp(),
  });
}

export async function applyPendingInvites(uid: string, email: string): Promise<void> {
  const q = query(collection(db, 'farmInvites'), where('email', '==', email.toLowerCase().trim()));
  const snap = await getDocs(q);
  if (snap.empty) return;

  const userSnap = await getDoc(doc(db, 'users', uid));
  const displayName = userSnap.data()?.displayName || email;

  await Promise.all(
    snap.docs.map(async (inviteDoc) => {
      const { farmId, role } = inviteDoc.data();
      await updateDoc(doc(db, 'users', uid), {
        farmMemberships: arrayUnion({ farmId, role } as FarmMembership),
      });
      await syncFarmMember(farmId, uid, role, displayName);
      await deleteDoc(inviteDoc.ref);
    })
  );
}

export async function createQRInvite(farmId: string, role: UserRole): Promise<string> {
  const user = auth.currentUser!;
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const ref = doc(collection(db, 'farmQRInvites'));
  await setDoc(ref, {
    id: ref.id,
    token,
    farmId,
    role,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    // expires 7 days from now
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  });
  return token;
}

export async function redeemQRInvite(token: string, uid: string): Promise<string> {
  const q = query(collection(db, 'farmQRInvites'), where('token', '==', token));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Invalid or expired QR code');

  const data = snap.docs[0].data();
  if (data.expiresAt.toMillis() < Date.now()) throw new Error('This QR code has expired');

  const farmSnap = await getDoc(doc(db, 'farms', data.farmId));
  const farmName = farmSnap.exists() ? farmSnap.data().name : 'Unknown Farm';

  const userSnap = await getDoc(doc(db, 'users', uid));
  const displayName = userSnap.data()?.displayName || uid;

  await Promise.all([
    updateDoc(doc(db, 'users', uid), {
      farmMemberships: arrayUnion({ farmId: data.farmId, role: data.role } as FarmMembership),
    }),
    syncFarmMember(data.farmId, uid, data.role, displayName),
  ]);

  return farmName;
}

export async function updateFarm(farmId: string, data: Partial<Pick<Farm, 'name' | 'ownerName' | 'address' | 'acreage' | 'purchaseDate' | 'notes'>>): Promise<void> {
  await updateDoc(doc(db, 'farms', farmId), data);
}

export async function addFarmLocation(farmId: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'farms', farmId), { locations: arrayUnion(name.trim()) });
}

export async function removeFarmLocation(farmId: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'farms', farmId), { locations: arrayRemove(name) });
}

export async function leaveFarm(farmId: string): Promise<void> {
  const user = auth.currentUser!;
  const userSnap = await getDoc(doc(db, 'users', user.uid));
  const memberships: FarmMembership[] = userSnap.data()?.farmMemberships ?? [];
  const membership = memberships.find(m => m.farmId === farmId);
  if (membership) {
    await Promise.all([
      updateDoc(doc(db, 'users', user.uid), { farmMemberships: arrayRemove(membership) }),
      deleteDoc(doc(db, 'farmMembers', `${farmId}_${user.uid}`)).catch(() => {}),
    ]);
  }
}

export async function deleteFarm(farmId: string): Promise<void> {
  const user = auth.currentUser!;
  await deleteDoc(doc(db, 'farms', farmId));
  const userSnap = await getDoc(doc(db, 'users', user.uid));
  const memberships: FarmMembership[] = userSnap.data()?.farmMemberships ?? [];
  const membership = memberships.find(m => m.farmId === farmId);
  if (membership) {
    await updateDoc(doc(db, 'users', user.uid), { farmMemberships: arrayRemove(membership) });
  }
}

export async function getFarm(farmId: string): Promise<Farm | null> {
  const snap = await getDoc(doc(db, 'farms', farmId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Farm) : null;
}

export async function updateFarmMemberRole(
  targetUid: string,
  farmId: string,
  newRole: UserRole
): Promise<void> {
  const userSnap = await getDoc(doc(db, 'users', targetUid));
  if (!userSnap.exists()) return;

  const memberships: FarmMembership[] = userSnap.data().farmMemberships ?? [];
  const updated = memberships.map((m) =>
    m.farmId === farmId ? { ...m, role: newRole } : m
  );
  await updateDoc(doc(db, 'users', targetUid), { farmMemberships: updated });
  await updateDoc(doc(db, 'farmMembers', `${farmId}_${targetUid}`), { role: newRole }).catch(() => {});
}
