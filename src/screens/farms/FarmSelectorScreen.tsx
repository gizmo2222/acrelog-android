import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getUserFarms, redeemQRInvite } from '../../services/farms';
import { Farm, UserRole } from '../../types';
import { signOut } from '../../services/auth';
import { errorMessage } from '../../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'FarmSelector'>;

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  worker: 'Worker',
  mechanic: 'Mechanic',
  auditor: 'Auditor (Read-only)',
};

export default function FarmSelectorScreen({ navigation }: Props) {
  const { user, setActiveFarm } = useAuth();
  const [farms, setFarms] = useState<{ farm: Farm; role: UserRole }[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getUserFarms(user.uid)
      .then((f) => setFarms(f))
      .catch((e) => Alert.alert('Could not load farms', errorMessage(e)))
      .finally(() => setLoading(false));
  }, [user]);

  function selectFarm(farm: Farm, role: UserRole) {
    setActiveFarm({ farmId: farm.id, farmName: farm.name, role });
  }

  async function startScan() {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) { Alert.alert('Permission required', 'Camera access is needed to scan QR codes.'); return; }
    }
    setScanned(false);
    setScanning(true);
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || !user) return;
    setScanned(true);
    setScanning(false);
    try {
      const farmName = await redeemQRInvite(data, user.uid);
      Alert.alert('Joined!', `You're now a member of ${farmName}.`);
      const updated = await getUserFarms(user.uid);
      setFarms(updated);
    } catch (e: any) {
      Alert.alert('Could not join farm', errorMessage(e));
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;
  }

  if (scanning) {
    return (
      <View style={styles.scanContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Point at the QR code from Farm Settings</Text>
          <Button mode="contained" onPress={() => setScanning(false)} style={styles.cancelBtn}>Cancel</Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Select a Farm</Text>

      {farms.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyLarge" style={styles.emptyText}>You're not a member of any farm yet.</Text>
          <Button mode="contained" onPress={() => navigation.navigate('CreateFarm')} style={styles.button}>
            Create Your Farm
          </Button>
          <Button mode="outlined" icon="qrcode-scan" onPress={startScan} style={styles.button}>
            Scan QR Code to Join
          </Button>
        </View>
      ) : (
        <>
          <FlatList
            data={farms}
            keyExtractor={(item) => item.farm.id}
            renderItem={({ item }) => (
              <Card style={styles.card} onPress={() => selectFarm(item.farm, item.role)}>
                <Card.Content>
                  <Text variant="titleLarge">{item.farm.name}</Text>
                  <Chip style={styles.roleChip} compact>{ROLE_LABELS[item.role]}</Chip>
                </Card.Content>
              </Card>
            )}
            contentContainerStyle={{ paddingBottom: 160 }}
          />
          <Button mode="outlined" icon="qrcode-scan" onPress={startScan} style={styles.scanBtn}>
            Scan QR Code to Join Another Farm
          </Button>
        </>
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('CreateFarm')} label="New Farm" />
      <Button onPress={() => signOut()} style={styles.signOut}>Sign Out</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ee', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: 'bold', color: '#2e7d32', marginTop: 48, marginBottom: 24 },
  subtitle: { color: '#6b6b6b', marginBottom: 24 },
  card: { marginBottom: 12, borderRadius: 8 },
  roleChip: { marginTop: 8, alignSelf: 'flex-start' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6b6b6b', textAlign: 'center', marginBottom: 24 },
  button: { marginTop: 8, width: '100%' },
  fab: { position: 'absolute', right: 16, bottom: 80, backgroundColor: '#2e7d32' },
  signOut: { marginBottom: 16 },
  scanBtn: { marginBottom: 8 },
  scanContainer: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 80 },
  scanFrame: { width: 240, height: 240, borderWidth: 2, borderColor: 'white', borderRadius: 12 },
  scanHint: { color: 'white', fontSize: 14, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 },
  cancelBtn: { backgroundColor: '#2e7d32' },
});
