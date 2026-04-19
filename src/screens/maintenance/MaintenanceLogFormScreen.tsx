import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, Button, Divider, ActivityIndicator, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getEquipmentById } from '../../services/equipment';
import { getMaintenanceTasks, logMaintenance } from '../../services/maintenance';
import { Equipment, MaintenanceTask, PartUsed } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MaintenanceLogForm'>;

export default function MaintenanceLogFormScreen({ route, navigation }: Props) {
  const { taskId, equipmentId } = route.params;
  const { activeFarm } = useAuth();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [task, setTask] = useState<MaintenanceTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [diagnosticNotes, setDiagnosticNotes] = useState('');
  const [parts, setParts] = useState<PartUsed[]>([]);
  const [receiptUris, setReceiptUris] = useState<string[]>([]);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newPartQty, setNewPartQty] = useState('1');

  useEffect(() => {
    (async () => {
      const eq = await getEquipmentById(equipmentId);
      setEquipment(eq);
      if (eq) setHours(String(eq.totalHours));
      const tasks = await getMaintenanceTasks(equipmentId);
      setTask(tasks.find(t => t.id === taskId) ?? null);
      setLoading(false);
    })();
  }, []);

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Camera access is needed.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8, cameraType: 'back' });
    if (!result.canceled) setPhotoUris(prev => [...prev, result.assets[0].uri]);
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
    if (!result.canceled) setPhotoUris(prev => [...prev, result.assets[0].uri]);
  }

  async function pickReceipt() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (!result.canceled) setReceiptUris(prev => [...prev, result.assets[0].uri]);
  }

  function addPart() {
    if (!newPartName) return;
    setParts(prev => [...prev, { name: newPartName, partNumber: newPartNumber, quantity: parseInt(newPartQty) || 1 }]);
    setNewPartName('');
    setNewPartNumber('');
    setNewPartQty('1');
  }

  async function handleSave() {
    if (!task || !hours || !activeFarm) {
      Alert.alert('Please enter hours at completion');
      return;
    }
    setSaving(true);
    try {
      console.log('[MaintenanceLog] saving for task:', task.id, 'hours:', hours);
      await logMaintenance(
        task,
        parseFloat(hours),
        notes,
        diagnosticNotes,
        parts,
        receiptUris,
        photoUris,
        activeFarm.farmId
      );
      console.log('[MaintenanceLog] saved successfully');
      navigation.goBack();
    } catch (e: any) {
      console.error('[MaintenanceLog] save error:', e);
      Alert.alert('Error logging completion', e.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  const insets = useSafeAreaInsets();

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      <Text variant="titleMedium" style={styles.taskName}>{task?.name}</Text>
      <Text variant="bodySmall" style={styles.equipName}>{equipment?.name}</Text>

      <Divider style={styles.divider} />

      <TextInput
        label="Hours at Completion *"
        value={hours}
        onChangeText={setHours}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={3}
      />
      <TextInput
        label="Symptom / Diagnostic Notes"
        value={diagnosticNotes}
        onChangeText={setDiagnosticNotes}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={3}
        placeholder="Describe any symptoms or issues noticed"
      />

      <Divider style={styles.divider} />
      <Text variant="titleSmall" style={styles.sectionTitle}>Parts Used</Text>
      {parts.map((p, i) => (
        <View key={i} style={styles.partRow}>
          <Text style={styles.flex}>{p.name} ({p.partNumber || 'no P/N'}) × {p.quantity}</Text>
          <IconButton icon="close" size={16} onPress={() => setParts(prev => prev.filter((_, j) => j !== i))} />
        </View>
      ))}
      <TextInput label="Part Name" value={newPartName} onChangeText={setNewPartName} mode="outlined" style={styles.inputSmall} />
      <TextInput label="Part Number" value={newPartNumber} onChangeText={setNewPartNumber} mode="outlined" style={styles.inputSmall} />
      <TextInput label="Qty" value={newPartQty} onChangeText={setNewPartQty} keyboardType="numeric" mode="outlined" style={styles.inputSmall} />
      <Button mode="outlined" onPress={addPart} compact style={styles.addBtn}>Add Part</Button>

      <Divider style={styles.divider} />
      <Text variant="titleSmall" style={styles.sectionTitle}>Receipts & Photos</Text>

      <View style={styles.mediaRow}>
        <Button icon="receipt" mode="outlined" onPress={pickReceipt} compact style={styles.mediaBtn}>
          Receipt ({receiptUris.length})
        </Button>
        <Button icon="camera" mode="outlined" onPress={takePhoto} compact style={styles.mediaBtn}>
          Camera ({photoUris.length})
        </Button>
        <Button icon="image-plus" mode="outlined" onPress={pickPhoto} compact style={styles.mediaBtn}>
          Library
        </Button>
      </View>

      <View style={styles.photoGrid}>
        {photoUris.map((uri, i) => (
          <TouchableOpacity key={i} onPress={() => setPhotoUris(prev => prev.filter((_, j) => j !== i))}>
            <Image source={{ uri }} style={styles.thumb} />
            <View style={styles.thumbRemove}><Text style={styles.thumbRemoveText}>✕</Text></View>
          </TouchableOpacity>
        ))}
      </View>

      <Divider style={styles.divider} />

      <Button mode="contained" onPress={handleSave} loading={saving} style={styles.saveBtn} icon="check">
        Log Completion
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  taskName: { fontWeight: 'bold', color: '#2e7d32' },
  equipName: { color: '#888', marginBottom: 4 },
  divider: { marginVertical: 16 },
  input: { marginBottom: 12 },
  inputSmall: { marginBottom: 8 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8 },
  partRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  flex: { flex: 1 },
  addBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  mediaRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  mediaBtn: { flex: 1 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  thumb: { width: 72, height: 72, borderRadius: 4 },
  thumbRemove: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  thumbRemoveText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  saveBtn: { marginBottom: 32 },
});
