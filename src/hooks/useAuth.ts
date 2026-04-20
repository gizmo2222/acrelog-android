import { useState, useEffect, createContext, useContext } from 'react';
import { User } from 'firebase/auth';
import { onAuthChanged, getUserProfile, isBiometricEnabled, authenticateWithBiometrics } from '../services/auth';
import { applyPendingInvites } from '../services/farms';
import { scheduleMaintenenanceNotifications } from '../services/notifications';
import { UserProfile, ActiveFarm } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  activeFarm: ActiveFarm | null;
  setActiveFarm: (farm: ActiveFarm | null) => void;
  loading: boolean;
}

import React from 'react';

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  activeFarm: null,
  setActiveFarm: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeFarm, setActiveFarm] = useState<ActiveFarm | null>(null);

  function setActiveFarmAndNotify(farm: ActiveFarm | null) {
    setActiveFarm(farm);
    if (farm) {
      scheduleMaintenenanceNotifications(farm.farmId).catch(() => {});
    }
  }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] subscribing to auth state');
    return onAuthChanged(async (u) => {
      console.log('[Auth] state changed, user:', u?.uid ?? 'null');
      setUser(u);
      if (u) {
        if (u.email) await applyPendingInvites(u.uid, u.email);
        const p = await getUserProfile(u.uid);
        setProfile(p);
      } else {
        setProfile(null);
        setActiveFarm(null);
      }
      setLoading(false);
    });
  }, []);

  return React.createElement(
    AuthContext.Provider,
    { value: { user, profile, activeFarm, setActiveFarm: setActiveFarmAndNotify, loading } },
    children
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
