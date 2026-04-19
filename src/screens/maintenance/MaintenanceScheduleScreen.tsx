import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Card, Chip, Button, FAB, IconButton, TextInput, ActivityIndicator, Divider, SegmentedButtons } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getEquipmentById } from '../../services/equipment';
import * as ImagePicker from 'expo-image-picker';
import {
  getMaintenanceTasks, createMaintenanceTask, updateMaintenanceTask, deleteMaintenanceTask,
  archiveMaintenanceTask, getMaintenanceStatus, scrapeMaintenanceSchedule, uploadTaskPhoto,
} from '../../services/maintenance';
import { Timestamp } from 'firebase/firestore';
import { Equipment, MaintenanceTask } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MaintenanceSchedule'>;

const STATUS_COLORS: Record<string, string> = {
  ok: '#2e7d32',
  due_soon: '#f57c00',
  overdue: '#c62828',
};

export default function MaintenanceScheduleScreen({ route, navigation }: Props) {
  const { equipmentId } = route.params;
  const { activeFarm } = useAuth();
  const insets = useSafeAreaInsets();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importedTasks, setImportedTasks] = useState<Omit<MaintenanceTask, 'id' | 'equipmentId' | 'createdAt'>[]>([]);

  // Add/edit task form state
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
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, [equipmentId]));

  async function load() {
    setLoading(true);
    const [eq, t] = await Promise.all([getEquipmentById(equipmentId), getMaintenanceTasks(equipmentId)]);
    setEquipment(eq);
    setTasks(t);
    setLoading(false);
  }

  function startEdit(task: MaintenanceTask) {
    setEditingTask(task);
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
    setTaskPhotoUris([]);
    setShowAddForm(true);
  }

  function cancelForm() {
    setEditingTask(null);
    setTaskName('');
    setTaskNotes('');
    setTaskType('recurring');
    setIntervalHours('');
    setIntervalDays('');
    setDueHours('');
    setDueDate('');
    setLastDoneDate('');
    setLastDoneHours('');
    setTaskPhotoUris([]);
    setShowAddForm(false);
  }

  async function takeTaskPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Camera access is needed.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 });
    if (!result.canceled) setTaskPhotoUris(prev => [...prev, result.assets[0].uri]);
  }

  async function pickTaskPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
    if (!result.canceled) setTaskPhotoUris(prev => [...prev, result.assets[0].uri]);
  }

  async function handleSaveTask() {
    if (!taskName) return;
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
      if (editingTask) {
        await updateMaintenanceTask(editingTask.id, updates);
        savedId = editingTask.id;
      } else {
        const created = await createMaintenanceTask({ equipmentId, imported: false, ...updates });
        savedId = created.id;
      }

      if (taskPhotoUris.length > 0 && activeFarm) {
        const uploaded = await Promise.all(
          taskPhotoUris.map(uri => uploadTaskPhoto(equipmentId, activeFarm.farmId, savedId, uri))
        );
        const existing = editingTask?.photoUrls ?? [];
        await updateMaintenanceTask(savedId, { photoUrls: [...existing, ...uploaded] });
      }

      cancelForm();
      load();
    } catch (e: any) {
      Alert.alert('Error saving task', e.message ?? 'Unknown error');
    }
  }

  async function handleImport() {
    if (!importUrl) return;
    setImportLoading(true);
    const results = await scrapeMaintenanceSchedule(importUrl);
    setImportedTasks(results);
    setImportLoading(false);
    if (results.length === 0) {
      Alert.alert('No tasks found', 'Could not extract maintenance tasks from that URL. Try a different page or add tasks manually.');
    }
  }

  async function saveImportedTask(task: Omit<MaintenanceTask, 'id' | 'equipmentId' | 'createdAt'>) {
    await createMaintenanceTask({ ...task, equipmentId });
    setImportedTasks(prev => prev.filter(t => t.name !== task.name));
    load();
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteMaintenanceTask(id); load(); } },
    ]);
  }

  const canEdit = activeFarm?.role === 'owner';
  const canLog = activeFarm?.role !== 'auditor';
  const activeTasks = tasks.filter(t => !t.archived);
  const recurringTasks = activeTasks.filter(t => t.intervalHours || t.intervalDays);
  const oneOffTasks = activeTasks.filter(t => !t.intervalHours && !t.intervalDays);
  const archivedTasks = tasks.filter(t => t.archived);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.equipName}>{equipment?.name} — {equipment?.totalHours} hrs</Text>

      <FlatList
        data={recurringTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
        ListHeaderComponent={
          <>
            {/* Import section */}
            {canEdit && (
              <View style={styles.importRow}>
                <Button icon="download" mode="outlined" onPress={() => setShowImport(!showImport)} compact>
                  Import Schedule
                </Button>
              </View>
            )}
            {showImport && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="labelMedium" style={styles.importNote}>
                    Paste the manufacturer's maintenance page URL. Results need review before saving.
                  </Text>
                  <TextInput
                    label="Manufacturer URL"
                    value={importUrl}
                    onChangeText={setImportUrl}
                    mode="outlined"
                    keyboardType="url"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                  <Button mode="contained" onPress={handleImport} loading={importLoading}>
                    Fetch Schedule
                  </Button>
                  {importedTasks.map((task, i) => (
                    <View key={i} style={styles.importedTask}>
                      <Text variant="bodyMedium" style={styles.flex}>{task.name}</Text>
                      {task.intervalHours && <Text variant="bodySmall">Every {task.intervalHours} hrs</Text>}
                      {task.intervalDays && <Text variant="bodySmall">Every {task.intervalDays} days</Text>}
                      <Button compact onPress={() => saveImportedTask(task)}>Add</Button>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}

            {/* Add / edit task form */}
            {canEdit && showAddForm && (
              <Card style={styles.card}>
                <Card.Content>
                  <Text variant="titleSmall" style={styles.sectionTitle}>{editingTask ? 'Edit Task' : 'New Task'}</Text>
                  <TextInput label="Task name *" value={taskName} onChangeText={setTaskName} mode="outlined" style={styles.input} />
                  <TextInput label="Notes / Instructions" value={taskNotes} onChangeText={setTaskNotes} mode="outlined" style={styles.input} multiline numberOfLines={2} placeholder="What needs to be done, parts required, etc." />
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
                      <Text variant="labelSmall" style={styles.fieldHint}>Last completed (optional — seeds next due calculation)</Text>
                      <View style={styles.twoCol}>
                        <TextInput label="Date (YYYY-MM-DD)" value={lastDoneDate} onChangeText={setLastDoneDate} mode="outlined" style={styles.colInput} placeholder="2024-01-15" />
                        <TextInput label="At hours" value={lastDoneHours} onChangeText={setLastDoneHours} mode="outlined" keyboardType="numeric" style={styles.colInput} />
                      </View>
                    </>
                  )}
                  {taskType === 'oneoff' && (
                    <>
                      <Text variant="labelSmall" style={styles.fieldHint}>Due (set at least one)</Text>
                      <View style={styles.twoCol}>
                        <TextInput label="By date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} mode="outlined" style={styles.colInput} placeholder="2024-06-01" />
                        <TextInput label="By hours" value={dueHours} onChangeText={setDueHours} mode="outlined" keyboardType="numeric" style={styles.colInput} />
                      </View>
                    </>
                  )}
                  <Text variant="labelSmall" style={styles.fieldHint}>Reference photos (parts, part numbers, location)</Text>
                  <View style={styles.twoCol}>
                    <Button icon="camera" mode="outlined" compact style={styles.colInput} onPress={takeTaskPhoto}>Camera</Button>
                    <Button icon="image-plus" mode="outlined" compact style={styles.colInput} onPress={pickTaskPhoto}>Library</Button>
                  </View>
                  {taskPhotoUris.length > 0 && (
                    <View style={styles.photoGrid}>
                      {taskPhotoUris.map((uri, i) => (
                        <TouchableOpacity key={i} onPress={() => setTaskPhotoUris(prev => prev.filter((_, j) => j !== i))}>
                          <Image source={{ uri }} style={styles.photoThumb} />
                          <View style={styles.thumbRemove}><Text style={styles.thumbRemoveText}>✕</Text></View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <View style={styles.formRow}>
                    <Button onPress={cancelForm}>Cancel</Button>
                    <Button mode="contained" onPress={handleSaveTask}>Save</Button>
                  </View>
                </Card.Content>
              </Card>
            )}

            {recurringTasks.length > 0 && <Text variant="labelLarge" style={styles.listHeader}>Recurring ({recurringTasks.length})</Text>}
            {recurringTasks.length === 0 && oneOffTasks.length === 0 && <Text style={styles.empty}>No maintenance tasks. Add one or import from the manufacturer's site.</Text>}
          </>
        }
        renderItem={({ item }) => {
          const status = getMaintenanceStatus(item, equipment?.totalHours ?? 0);
          return (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.taskHeader}>
                  <Text variant="titleSmall" style={styles.flex}>{item.name}</Text>
                  <Chip compact style={{ backgroundColor: STATUS_COLORS[status] }} textStyle={{ color: 'white' }}>
                    {status === 'ok' ? 'OK' : status === 'due_soon' ? 'Due Soon' : 'Overdue'}
                  </Chip>
                  {item.imported && <Chip compact style={styles.importedChip}>Imported</Chip>}
                  {canEdit && (
                    <>
                      <IconButton icon="pencil-outline" size={18} onPress={() => startEdit(item)} />
                      <IconButton icon="archive-outline" size={18} onPress={() => { archiveMaintenanceTask(item.id, true); load(); }} />
                      <IconButton icon="trash-can-outline" size={18} onPress={() => handleDelete(item.id)} />
                    </>
                  )}
                </View>
                {item.notes ? <Text variant="bodySmall" style={styles.taskNotes}>{item.notes}</Text> : null}
                {(item.photoUrls?.length ?? 0) > 0 && (
                  <View style={styles.photoGrid}>
                    {item.photoUrls!.map((url, i) => <Image key={i} source={{ uri: url }} style={styles.photoThumb} />)}
                  </View>
                )}
                {item.intervalHours && <Text variant="bodySmall" style={styles.interval}>Every {item.intervalHours} hours</Text>}
                {item.intervalDays && <Text variant="bodySmall" style={styles.interval}>Every {item.intervalDays} days</Text>}
                {item.lastCompletedAt && (
                  <Text variant="bodySmall" style={styles.lastDone}>
                    Last done: {item.lastCompletedAt.toDate().toLocaleDateString()} at {item.lastCompletedHours} hrs
                  </Text>
                )}
                {item.nextDueHours && (
                  <Text variant="bodySmall" style={{ color: STATUS_COLORS[status] }}>
                    Due at: {item.nextDueHours} hrs
                  </Text>
                )}
                {item.nextDueAt && (
                  <Text variant="bodySmall" style={{ color: STATUS_COLORS[status] }}>
                    Due by: {item.nextDueAt.toDate().toLocaleDateString()}
                  </Text>
                )}
                {canLog && (
                  <Button
                    mode="contained"
                    compact
                    style={styles.logBtn}
                    onPress={() => navigation.navigate('MaintenanceLogForm', { taskId: item.id, equipmentId })}
                  >
                    Log Completion
                  </Button>
                )}
              </Card.Content>
            </Card>
          );
        }}
        ListEmptyComponent={null}
        ListFooterComponent={(
          <View>
            {/* One-off tasks section */}
            {oneOffTasks.length > 0 && (
              <>
                <Text variant="labelLarge" style={styles.listHeader}>One-off Tasks ({oneOffTasks.length})</Text>
                {oneOffTasks.map(item => (
                  <Card key={item.id} style={styles.card}>
                    <Card.Content>
                      <View style={styles.taskHeader}>
                        <Text variant="titleSmall" style={styles.flex}>{item.name}</Text>
                        <Chip compact style={styles.pendingChip} textStyle={{ color: '#1565c0' }}>Pending</Chip>
                        {canEdit && (
                          <>
                            <IconButton icon="pencil-outline" size={18} onPress={() => startEdit(item)} />
                            <IconButton icon="trash-can-outline" size={18} onPress={() => handleDelete(item.id)} />
                          </>
                        )}
                      </View>
                      {item.lastCompletedAt && (
                        <Text variant="bodySmall" style={styles.lastDone}>
                          Last done: {item.lastCompletedAt.toDate().toLocaleDateString()} at {item.lastCompletedHours} hrs
                        </Text>
                      )}
                      {canLog && (
                        <Button
                          mode="contained"
                          compact
                          style={styles.logBtn}
                          onPress={() => navigation.navigate('MaintenanceLogForm', { taskId: item.id, equipmentId })}
                        >
                          Log Completion
                        </Button>
                      )}
                    </Card.Content>
                  </Card>
                ))}
              </>
            )}

            {/* Archived section */}
            {archivedTasks.length > 0 && (
              <>
                <Button
                  mode="text"
                  icon={showArchived ? 'chevron-up' : 'chevron-down'}
                  onPress={() => setShowArchived(v => !v)}
                  style={styles.archivedToggle}
                  compact
                >
                  Completed / Archived ({archivedTasks.length})
                </Button>
                {showArchived && archivedTasks.map(item => (
                  <Card key={item.id} style={[styles.card, styles.archivedCard]}>
                    <Card.Content>
                      <View style={styles.taskHeader}>
                        <Text variant="titleSmall" style={[styles.flex, styles.archivedText]}>{item.name}</Text>
                        {canEdit && (
                          <>
                            <IconButton icon="restore" size={18} onPress={() => { archiveMaintenanceTask(item.id, false); load(); }} />
                            <IconButton icon="trash-can-outline" size={18} onPress={() => handleDelete(item.id)} />
                          </>
                        )}
                      </View>
                      {item.lastCompletedAt && (
                        <Text variant="bodySmall" style={styles.lastDone}>
                          Completed: {item.lastCompletedAt.toDate().toLocaleDateString()} at {item.lastCompletedHours} hrs
                        </Text>
                      )}
                    </Card.Content>
                  </Card>
                ))}
              </>
            )}
          </View>
        )}
      />

      {canEdit && (
        <FAB icon="plus" style={[styles.fab, { bottom: 16 + insets.bottom }]} onPress={() => { cancelForm(); setShowAddForm(true); }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  equipName: { padding: 16, paddingBottom: 0, color: '#2e7d32', fontWeight: 'bold' },
  importRow: { flexDirection: 'row', padding: 16, paddingBottom: 0 },
  card: { margin: 16, marginBottom: 0, borderRadius: 8 },
  importNote: { color: '#888', marginBottom: 8 },
  input: { marginBottom: 12 },
  importedTask: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  flex: { flex: 1 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8 },
  formRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  listHeader: { padding: 16, paddingBottom: 4, color: '#666' },
  taskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  interval: { color: '#666' },
  lastDone: { color: '#888' },
  logBtn: { marginTop: 8, alignSelf: 'flex-start' },
  empty: { textAlign: 'center', color: '#999', padding: 32 },
  archivedToggle: { marginHorizontal: 16, marginTop: 8, alignSelf: 'flex-start' },
  archivedCard: { opacity: 0.6 },
  archivedText: { color: '#999' },
  segmented: { marginBottom: 12 },
  fieldHint: { color: '#888', marginBottom: 6, marginTop: 4 },
  twoCol: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  colInput: { flex: 1 },
  taskNotes: { color: '#666', marginBottom: 4, fontStyle: 'italic' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  photoThumb: { width: 64, height: 64, borderRadius: 4 },
  thumbRemove: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  thumbRemoveText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  pendingChip: { backgroundColor: '#e3f2fd' },
  importedChip: { backgroundColor: '#f3e5f5', marginLeft: 4 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2e7d32' },
});
