import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, Button, Divider, Dialog, Portal, SegmentedButtons } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../hooks/useAuth';
import { inviteUserToFarm, createQRInvite } from '../../services/farms';
import { UserRole } from '../../types';
import { signOut } from '../../services/auth';

const ROLES: UserRole[] = ['owner', 'worker', 'mechanic', 'auditor'];

export default function FarmSettingsScreen() {
  const { activeFarm, setActiveFarm } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'invites' | 'general'>('invites');

  // Invite state
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
    <View style={styles.wrapper}>
      <Text variant="titleMedium" style={styles.farmName}>{activeFarm?.farmName}</Text>

      <SegmentedButtons
        value={tab}
        onValueChange={v => setTab(v as 'invites' | 'general')}
        buttons={[
          { value: 'invites', label: 'Invites', icon: 'account-plus-outline' },
          { value: 'general', label: 'General', icon: 'cog-outline' },
        ]}
        style={styles.tabs}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
        {tab === 'invites' && (
          <>
            <Text variant="titleSmall" style={styles.sectionTitle}>Invite by Email</Text>
            <Text variant="bodySmall" style={styles.hint}>They'll be added when they next log in.</Text>
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
              {ROLES.map(r => (
                <Button key={r} mode={inviteRole === r ? 'contained' : 'outlined'} onPress={() => setInviteRole(r)} compact style={styles.roleButton}>{r}</Button>
              ))}
            </View>
            <Button mode="contained" onPress={handleInvite} loading={loading} style={styles.button}>
              Send Invite
            </Button>

            <Divider style={styles.divider} />

            <Text variant="titleSmall" style={styles.sectionTitle}>Invite by QR Code</Text>
            <Text variant="bodySmall" style={styles.hint}>Generate a scannable code. Valid for 7 days.</Text>
            <Text variant="labelLarge" style={styles.roleLabel}>Role</Text>
            <View style={styles.roleRow}>
              {ROLES.map(r => (
                <Button key={r} mode={qrRole === r ? 'contained' : 'outlined'} onPress={() => setQrRole(r)} compact style={styles.roleButton}>{r}</Button>
              ))}
            </View>
            <Button mode="outlined" icon="qrcode" onPress={handleShowQR} loading={qrLoading} style={styles.button}>
              Generate QR Code
            </Button>
          </>
        )}

        {tab === 'general' && (
          <>
            <Text variant="titleSmall" style={styles.sectionTitle}>Equipment</Text>
            <Button mode="outlined" icon="tag-multiple-outline" onPress={() => navigation.navigate('CategorySettings')} style={styles.button}>
              Manage Categories
            </Button>

            <Divider style={styles.divider} />

            <Text variant="titleSmall" style={styles.sectionTitle}>Account</Text>
            <Button mode="outlined" onPress={() => setActiveFarm(null)} style={styles.button}>
              Switch Farm
            </Button>
            <Button onPress={() => signOut()} textColor="#c62828">
              Sign Out
            </Button>
          </>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={!!qrToken} onDismiss={() => setQrToken(null)}>
          <Dialog.Title>Scan to Join — {qrRole}</Dialog.Title>
          <Dialog.Content style={styles.qrContainer}>
            <Text variant="bodySmall" style={styles.hint}>{activeFarm?.farmName}</Text>
            {qrToken && <QRCode value={qrToken} size={220} />}
            <Text variant="bodySmall" style={styles.qrExpiry}>Expires in 7 days</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setQrToken(null)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f5f5f5' },
  farmName: { paddingHorizontal: 16, paddingTop: 12, fontWeight: 'bold', color: '#2e7d32' },
  tabs: { margin: 16, marginBottom: 0 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 4, color: '#333' },
  hint: { color: '#666', marginBottom: 12 },
  divider: { marginVertical: 20 },
  input: { marginBottom: 12 },
  roleLabel: { marginBottom: 8, color: '#666' },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleButton: { marginRight: 4 },
  button: { marginBottom: 12 },
  qrContainer: { alignItems: 'center' },
  qrExpiry: { color: '#999', marginTop: 12 },
});
