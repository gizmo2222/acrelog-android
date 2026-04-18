import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, Button, Divider } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { inviteUserToFarm } from '../../services/farms';
import { UserRole } from '../../types';
import { signOut } from '../../services/auth';

const ROLES: UserRole[] = ['owner', 'worker', 'mechanic', 'auditor'];

export default function FarmSettingsScreen() {
  const { activeFarm, setActiveFarm } = useAuth();
  const insets = useSafeAreaInsets();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('worker');
  const [loading, setLoading] = useState(false);

  async function handleInvite() {
    if (!inviteEmail.trim() || !activeFarm) return;
    setLoading(true);
    try {
      await inviteUserToFarm(inviteEmail.trim(), activeFarm.farmId, inviteRole);
      Alert.alert('Success', `${inviteEmail} has been added as ${inviteRole}`);
      setInviteEmail('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      <Text variant="titleLarge" style={styles.section}>Farm: {activeFarm?.farmName}</Text>

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.section}>Invite User</Text>
      <TextInput
        label="Email address"
        value={inviteEmail}
        onChangeText={setInviteEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        mode="outlined"
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.roleLabel}>Role</Text>
      <View style={styles.roleRow}>
        {ROLES.map((r) => (
          <Button
            key={r}
            mode={inviteRole === r ? 'contained' : 'outlined'}
            onPress={() => setInviteRole(r)}
            compact
            style={styles.roleButton}
          >
            {r}
          </Button>
        ))}
      </View>

      <Button mode="contained" onPress={handleInvite} loading={loading} style={styles.button}>
        Send Invite
      </Button>

      <Divider style={styles.divider} />

      <Button
        mode="outlined"
        onPress={() => setActiveFarm(null)}
        style={styles.button}
      >
        Switch Farm
      </Button>
      <Button onPress={() => signOut()}>Sign Out</Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  section: { marginVertical: 12, fontWeight: 'bold' },
  divider: { marginVertical: 16 },
  input: { marginBottom: 12 },
  roleLabel: { marginBottom: 8, color: '#666' },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleButton: { marginRight: 4 },
  button: { marginBottom: 12 },
});
