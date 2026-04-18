import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, Button, Divider, Dialog, Portal } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../hooks/useAuth';
import { inviteUserToFarm, createQRInvite } from '../../services/farms';
import { UserRole } from '../../types';
import { signOut } from '../../services/auth';

const ROLES: UserRole[] = ['owner', 'worker', 'mechanic', 'auditor'];

export default function FarmSettingsScreen() {
  const { activeFarm, setActiveFarm } = useAuth();
  const insets = useSafeAreaInsets();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('worker');
  const [loading, setLoading] = useState(false);
  const [qrRole, setQrRole] = useState<UserRole>('worker');
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  async function handleInvite() {
    if (!inviteEmail.trim() || !activeFarm) return;
    setLoading(true);
    try {
      await inviteUserToFarm(inviteEmail.trim(), activeFarm.farmId, inviteRole);
      Alert.alert('Invite sent', `${inviteEmail} will be added as ${inviteRole} when they next log in.`);
      setInviteEmail('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleShowQR() {
    if (!activeFarm) return;
    setQrLoading(true);
    try {
      const token = await createQRInvite(activeFarm.farmId, qrRole);
      setQrToken(token);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setQrLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      <Text variant="titleLarge" style={styles.section}>Farm: {activeFarm?.farmName}</Text>

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.section}>Invite by Email</Text>
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
          <Button key={r} mode={inviteRole === r ? 'contained' : 'outlined'} onPress={() => setInviteRole(r)} compact style={styles.roleButton}>{r}</Button>
        ))}
      </View>
      <Button mode="contained" onPress={handleInvite} loading={loading} style={styles.button}>
        Send Invite
      </Button>

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.section}>Invite by QR Code</Text>
      <Text variant="bodySmall" style={styles.qrNote}>Generate a QR code to share. Valid for 7 days.</Text>
      <Text variant="labelLarge" style={styles.roleLabel}>Role</Text>
      <View style={styles.roleRow}>
        {ROLES.map((r) => (
          <Button key={r} mode={qrRole === r ? 'contained' : 'outlined'} onPress={() => setQrRole(r)} compact style={styles.roleButton}>{r}</Button>
        ))}
      </View>
      <Button mode="outlined" icon="qrcode" onPress={handleShowQR} loading={qrLoading} style={styles.button}>
        Generate QR Code
      </Button>

      <Divider style={styles.divider} />

      <Button mode="outlined" onPress={() => setActiveFarm(null)} style={styles.button}>Switch Farm</Button>
      <Button onPress={() => signOut()}>Sign Out</Button>

      <Portal>
        <Dialog visible={!!qrToken} onDismiss={() => setQrToken(null)}>
          <Dialog.Title>Scan to Join — {qrRole}</Dialog.Title>
          <Dialog.Content style={styles.qrContainer}>
            <Text variant="bodySmall" style={styles.qrNote}>{activeFarm?.farmName}</Text>
            {qrToken && <QRCode value={qrToken} size={220} />}
            <Text variant="bodySmall" style={styles.qrExpiry}>Expires in 7 days</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setQrToken(null)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  qrNote: { color: '#666', marginBottom: 12 },
  qrContainer: { alignItems: 'center' },
  qrExpiry: { color: '#999', marginTop: 12 },
});
