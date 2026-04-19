import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, Button, Divider, Dialog, Portal, SegmentedButtons } from 'react-native-paper';
import DatePickerField from '../../components/DatePickerField';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../hooks/useAuth';
import { inviteUserToFarm, createQRInvite, getFarm, updateFarm, addFarmLocation, removeFarmLocation, leaveFarm, deleteFarm } from '../../services/farms';
import { Farm, UserRole } from '../../types';
import { signOut } from '../../services/auth';
import { errorMessage } from '../../utils/errorMessage';

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

  // Farm details state
  const [farm, setFarm] = useState<Farm | null>(null);
  const [detailsEditing, setDetailsEditing] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [acreage, setAcreage] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [detailsSaving, setDetailsSaving] = useState(false);

  // Locations state
  const [newLocation, setNewLocation] = useState('');
  const [locationSaving, setLocationSaving] = useState(false);

  React.useEffect(() => {
    if (activeFarm) {
      getFarm(activeFarm.farmId).then(f => {
        if (f) {
          setFarm(f);
          setFarmName(f.name);
          setOwnerName(f.ownerName ?? '');
          setAddress(f.address ?? '');
          setAcreage(f.acreage != null ? String(f.acreage) : '');
          setPurchaseDate(f.purchaseDate ?? '');
          setNotes(f.notes ?? '');
        }
      });
    }
  }, [activeFarm?.farmId]);

  async function handleAddLocation() {
    if (!newLocation.trim() || !activeFarm) return;
    setLocationSaving(true);
    try {
      await addFarmLocation(activeFarm.farmId, newLocation.trim());
      setFarm(prev => prev ? { ...prev, locations: [...(prev.locations ?? []), newLocation.trim()].sort() } : prev);
      setNewLocation('');
    } catch (e: any) {
      Alert.alert('Error', errorMessage(e));
    } finally {
      setLocationSaving(false);
    }
  }

  async function handleRemoveLocation(name: string) {
    if (!activeFarm) return;
    Alert.alert('Remove Location', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await removeFarmLocation(activeFarm.farmId, name);
          setFarm(prev => prev ? { ...prev, locations: (prev.locations ?? []).filter(l => l !== name) } : prev);
        },
      },
    ]);
  }

  async function saveDetails() {
    if (!activeFarm || !farmName.trim()) return;
    setDetailsSaving(true);
    try {
      const data: Parameters<typeof updateFarm>[1] = {
        name: farmName.trim(),
        ownerName: ownerName.trim() || undefined,
        address: address.trim() || undefined,
        acreage: acreage ? parseFloat(acreage) : undefined,
        purchaseDate: purchaseDate.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      await updateFarm(activeFarm.farmId, data);
      setDetailsEditing(false);
    } catch (e: any) {
      Alert.alert('Error', errorMessage(e));
    } finally {
      setDetailsSaving(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !activeFarm) return;
    setLoading(true);
    try {
      await inviteUserToFarm(inviteEmail.trim(), activeFarm.farmId, inviteRole);
      Alert.alert('Invite sent', `${inviteEmail} will be added as ${inviteRole} when they next log in.`);
      setInviteEmail('');
    } catch (e: any) {
      Alert.alert('Error', errorMessage(e));
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
      Alert.alert('Error', errorMessage(e));
    } finally {
      setQrLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }} keyboardShouldPersistTaps="handled">
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
            <Text variant="titleSmall" style={styles.sectionTitle}>Farm Details</Text>
            {!detailsEditing ? (
              <>
                <DetailRow label="Farm Name" value={farm?.name ?? activeFarm?.farmName ?? ''} />
                <DetailRow label="Owner" value={farm?.ownerName} />
                <DetailRow label="Address" value={farm?.address} />
                <DetailRow label="Acreage" value={farm?.acreage != null ? `${farm.acreage} acres` : undefined} />
                <DetailRow label="Purchase Date" value={farm?.purchaseDate} />
                <DetailRow label="Notes" value={farm?.notes} />
                {activeFarm?.role === 'owner' && (
                  <Button mode="outlined" icon="pencil-outline" onPress={() => setDetailsEditing(true)} style={styles.button}>
                    Edit Details
                  </Button>
                )}
              </>
            ) : (
              <>
                <TextInput label="Farm Name *" value={farmName} onChangeText={setFarmName} mode="outlined" style={styles.input} />
                <TextInput label="Owner / Operator" value={ownerName} onChangeText={setOwnerName} mode="outlined" style={styles.input} />
                <TextInput label="Address" value={address} onChangeText={setAddress} mode="outlined" style={styles.input} />
                <TextInput label="Acreage" value={acreage} onChangeText={setAcreage} mode="outlined" keyboardType="decimal-pad" style={styles.input} />
                <DatePickerField label="Purchase Date" value={purchaseDate} onChange={setPurchaseDate} style={styles.input} optional />
                <TextInput label="Notes" value={notes} onChangeText={setNotes} mode="outlined" multiline numberOfLines={3} style={styles.input} />
                <View style={styles.detailsRow}>
                  <Button onPress={() => setDetailsEditing(false)}>Cancel</Button>
                  <Button mode="contained" onPress={saveDetails} loading={detailsSaving} disabled={!farmName.trim()}>Save</Button>
                </View>
              </>
            )}

            <Divider style={styles.divider} />

            <Text variant="titleSmall" style={styles.sectionTitle}>Equipment</Text>
            <Button mode="outlined" icon="tag-multiple-outline" onPress={() => navigation.navigate('CategorySettings')} style={styles.button}>
              Manage Categories
            </Button>

            <Divider style={styles.divider} />

            <Text variant="titleSmall" style={styles.sectionTitle}>Locations</Text>
            <Text variant="bodySmall" style={styles.hint}>Storage locations available when adding equipment.</Text>
            {(farm?.locations ?? []).map(loc => (
              <View key={loc} style={styles.locationRow}>
                <Text variant="bodyMedium" style={styles.locationName}>{loc}</Text>
                {activeFarm?.role === 'owner' && (
                  <Button compact onPress={() => handleRemoveLocation(loc)} textColor="#c62828">Remove</Button>
                )}
              </View>
            ))}
            {(farm?.locations ?? []).length === 0 && (
              <Text variant="bodySmall" style={styles.emptyHint}>No locations added yet.</Text>
            )}
            {activeFarm?.role === 'owner' && (
              <View style={styles.addLocationRow}>
                <TextInput
                  label="New location"
                  value={newLocation}
                  onChangeText={setNewLocation}
                  mode="outlined"
                  style={styles.locationInput}
                  onSubmitEditing={handleAddLocation}
                />
                <Button
                  mode="contained"
                  onPress={handleAddLocation}
                  loading={locationSaving}
                  disabled={!newLocation.trim()}
                  style={styles.addLocationBtn}
                >
                  Add
                </Button>
              </View>
            )}

            <Divider style={styles.divider} />

            <Text variant="titleSmall" style={styles.sectionTitle}>Account</Text>
            <Button mode="outlined" onPress={() => setActiveFarm(null)} style={styles.button}>
              Switch Farm
            </Button>
            {activeFarm?.role !== 'owner' && (
              <Button
                mode="outlined"
                textColor="#c62828"
                style={styles.button}
                onPress={() => Alert.alert(
                  'Leave Farm',
                  `Leave "${activeFarm?.farmName}"? You will need a new invite to rejoin.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Leave', style: 'destructive', onPress: async () => {
                      await leaveFarm(activeFarm!.farmId);
                      setActiveFarm(null);
                    }},
                  ]
                )}
              >
                Leave Farm
              </Button>
            )}
            {activeFarm?.role === 'owner' && (
              <Button
                mode="outlined"
                textColor="#c62828"
                style={styles.button}
                onPress={() => Alert.alert(
                  'Delete Farm',
                  `Permanently delete "${activeFarm?.farmName}"? This cannot be undone. Equipment and maintenance records will remain but be orphaned.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: async () => {
                      await deleteFarm(activeFarm!.farmId);
                      setActiveFarm(null);
                    }},
                  ]
                )}
              >
                Delete Farm
              </Button>
            )}
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
    </KeyboardAvoidingView>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.detailRowContainer}>
      <Text variant="labelMedium" style={styles.detailLabel}>{label}</Text>
      <Text variant="bodyMedium" style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f5f2ee' },
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
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  locationName: { flex: 1 },
  emptyHint: { color: '#999', marginBottom: 8 },
  addLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  locationInput: { flex: 1 },
  addLocationBtn: { marginTop: 6 },
  qrExpiry: { color: '#999', marginTop: 12 },
  detailRowContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { color: '#666', flex: 1 },
  detailValue: { flex: 2, textAlign: 'right', color: '#333' },
  detailsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 12 },
});
