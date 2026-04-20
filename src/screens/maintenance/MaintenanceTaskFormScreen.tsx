import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, Button, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { Timestamp } from 'firebase/firestore';
import { getMaintenanceTasks, createMaintenanceTask, updateMaintenanceTask, uploadTaskPhoto } from '../../services/maintenance';
import { errorMessage } from '../../utils/errorMessage';
import DatePickerField from '../../components/DatePickerField';

type Props = NativeStackScreenProps<RootStackParamList, 'MaintenanceTaskForm'>;

export default function MaintenanceTaskFormScreen({ route, navigation }: Props) {
  const { equipmentId, taskId } = route.params;
  const { activeFarm } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(!!taskId);
  const [saving, setSaving] = useState(false);

  const [taskName, setTaskName] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskType, setTaskType] = useState<'recurring' | 'oneoff'>('recurring');
  const [intervalHours, setIntervalHours] = useState('');
  const [intervalDays, setIntervalDays] = useState('');
  const [dueHours, setDueHours] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lastDoneDate, setLastDoneDate] = useState('');
  const [lastDoneHours, setLastDoneHours] = useState('');
  const [taskPhotoUris, setTaskPhotoUris] = useState<string[]>([]);
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    navigation.setOptions({ title: taskId ? 'Edit Task' : 'Add Task' });
    if (!taskId) return;
    (async () => {
      const tasks = await getMaintenanceTasks(equipmentId);
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setTaskName(task.name);
        setTaskNotes(task.notes ?? '');
        const isOneOff = !task.intervalHours && !task.intervalDays;
        setTaskType(isOneOff ? 'oneoff' : 'recurring');
        setIntervalHours(task.intervalHours ? String(task.intervalHours) : '');
        setIntervalDays(task.intervalDays ? String(task.intervalDays) : '');
        setDueHours(task.nextDueHours ? String(task.nextDueHours) : '');
        setDueDate(task.nextDueAt ? task.nextDueAt.toDate().toISOString().split('T')[0] : '');
        setLastDoneHours(task.lastCompletedHours ? String(task.lastCompletedHours) : '');
        setLastDoneDate(task.lastCompletedAt ? task.lastCompletedAt.toDate().toISOString().split('T')[0] : '');
        setExistingPhotoUrls(task.photoUrls ?? []);
      }
      setLoading(false);
    })();
  }, [taskId]);

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Camera access is needed.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 });
    if (!result.canceled) setTaskPhotoUris(prev => [...prev, result.assets[0].uri]);
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8, allowsMultipleSelection: true });
    if (!result.canceled) setTaskPhotoUris(prev => [...prev, ...result.assets.map(a => a.uri)]);
  }

  async function handleSave() {
    if (!taskName.trim()) {
      Alert.alert('Task name required', 'Enter a name for this maintenance task.');
      return;
    }
    setSaving(true);
    try {
      const updates: any = {
        name: taskName.trim(),
        notes: taskNotes.trim() || undefined,
        intervalHours: taskType === 'recurring' && intervalHours ? parseInt(intervalHours) : null,
        intervalDays: taskType === 'recurring' && intervalDays ? parseInt(intervalDays) : null,
      };

      if (taskType === 'oneoff') {
        updates.nextDueHours = dueHours ? parseFloat(dueHours) : null;
        updates.nextDueAt = dueDate ? Timestamp.fromDate(new Date(dueDate)) : null;
      }

      if (lastDoneDate || lastDoneHours) {
        updates.lastCompletedAt = lastDoneDate ? Timestamp.fromDate(new Date(lastDoneDate)) : null;
        updates.lastCompletedHours = lastDoneHours ? parseFloat(lastDoneHours) : null;
      }

      let savedId: string;
      if (taskId) {
        await updateMaintenanceTask(taskId, updates);
        savedId = taskId;
      } else {
        const created = await createMaintenanceTask({ equipmentId, imported: false, ...updates });
        savedId = created.id;
      }

      if (taskPhotoUris.length > 0 && activeFarm) {
        const uploaded = await Promise.all(
          taskPhotoUris.map(uri => uploadTaskPhoto(equipmentId, activeFarm.farmId, savedId, uri))
        );
        await updateMaintenanceTask(savedId, { photoUrls: [...existingPhotoUrls, ...uploaded] });
      }

      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Couldn't save task", errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.kavWrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} keyboardShouldPersistTaps="handled">
        <TextInput label="Task name *" value={taskName} onChangeText={setTaskName} mode="outlined" style={styles.input} autoFocus={!taskId} />
        <TextInput
          label="Notes / Instructions"
          value={taskNotes}
          onChangeText={setTaskNotes}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={2}
          placeholder="What needs to be done, parts required, etc."
        />

        <SegmentedButtons
          value={taskType}
          onValueChange={v => setTaskType(v as 'recurring' | 'oneoff')}
          buttons={[
            { value: 'recurring', label: 'Recurring' },
            { value: 'oneoff', label: 'One-off' },
          ]}
          style={styles.segmented}
        />

        {taskType === 'recurring' && (
          <>
            <TextInput label="Every X hours" value={intervalHours} onChangeText={setIntervalHours} mode="outlined" keyboardType="numeric" style={styles.input} />
            <TextInput label="Every X days" value={intervalDays} onChangeText={setIntervalDays} mode="outlined" keyboardType="numeric" style={styles.input} />
            <Text variant="labelSmall" style={styles.fieldHint}>Last completed — optional, helps calculate when this is next due</Text>
            <View style={styles.twoCol}>
              <DatePickerField label="Date" value={lastDoneDate} onChange={setLastDoneDate} style={styles.colInput} optional />
              <TextInput label="At hours" value={lastDoneHours} onChangeText={setLastDoneHours} mode="outlined" keyboardType="numeric" style={styles.colInput} />
            </View>
          </>
        )}

        {taskType === 'oneoff' && (
          <>
            <Text variant="labelSmall" style={styles.fieldHint}>When is this due? Set at least one.</Text>
            <View style={styles.twoCol}>
              <DatePickerField label="By date" value={dueDate} onChange={setDueDate} style={styles.colInput} optional />
              <TextInput label="By hours" value={dueHours} onChangeText={setDueHours} mode="outlined" keyboardType="numeric" style={styles.colInput} />
            </View>
          </>
        )}

        <Text variant="labelSmall" style={styles.fieldHint}>Reference photos — parts, part numbers, location on machine</Text>
        <View style={styles.twoCol}>
          <Button icon="camera" mode="outlined" compact style={styles.colInput} onPress={takePhoto}>Camera</Button>
          <Button icon="image-plus" mode="outlined" compact style={styles.colInput} onPress={pickPhoto}>Library</Button>
        </View>

        {(existingPhotoUrls.length > 0 || taskPhotoUris.length > 0) && (
          <View style={styles.photoGrid}>
            {taskPhotoUris.map((uri, i) => (
              <TouchableOpacity key={`new-${i}`} onPress={() => setTaskPhotoUris(prev => prev.filter((_, j) => j !== i))}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <View style={styles.thumbRemove}><Text style={styles.thumbRemoveText}>✕</Text></View>
              </TouchableOpacity>
            ))}
            {existingPhotoUrls.map((url, i) => (
              <Image key={`existing-${i}`} source={{ uri: url }} style={styles.photoThumb} />
            ))}
          </View>
        )}

        <Button mode="contained" onPress={handleSave} loading={saving} style={styles.saveBtn}>
          {taskId ? 'Save Changes' : 'Add Task'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kavWrapper: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f5f2ee', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  input: { marginBottom: 12 },
  segmented: { marginBottom: 12 },
  fieldHint: { color: '#6b6b6b', marginBottom: 6, marginTop: 4 },
  twoCol: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  colInput: { flex: 1 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  photoThumb: { width: 64, height: 64, borderRadius: 4 },
  thumbRemove: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  thumbRemoveText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  saveBtn: { marginTop: 8 },
});
