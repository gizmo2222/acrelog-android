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
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Farm, FarmMembership, UserRole } from '../types';

export async function createFarm(name: string): Promise<Farm> {
  const user = auth.currentUser!;
  const ref = doc(collection(db, 'farms'));
  const farm: Omit<Farm, 'id'> = {
    name,
    createdAt: serverTimestamp() as any,
    createdBy: user.uid,
  };
  await setDoc(ref, farm);

  // Add membership to user profile
  await updateDoc(doc(db, 'users', user.uid), {
    farmMemberships: arrayUnion({ farmId: ref.id, role: 'owner' } as FarmMembership),
  });

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

  const { deleteDoc } = await import('firebase/firestore');
  await Promise.all(
    snap.docs.map(async (inviteDoc) => {
      const { farmId, role } = inviteDoc.data();
      await updateDoc(doc(db, 'users', uid), {
        farmMemberships: arrayUnion({ farmId, role } as FarmMembership),
      });
      await deleteDoc(inviteDoc.ref);
    })
  );
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
}
