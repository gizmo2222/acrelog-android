import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Card, Chip, Button, FAB, IconButton, TextInput, ActivityIndicator, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getEquipmentById } from '../../services/equipment';
import {
  getMaintenanceTasks, createMaintenanceTask, updateMaintenanceTask, deleteMaintenanceTask,
  getMaintenanceStatus, scrapeMaintenanceSchedule,
} from '../../services/maintenance';
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
  const [intervalHours, setIntervalHours] = useState('');
  const [intervalDays, setIntervalDays] = useState('');
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);

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
    setIntervalHours(task.intervalHours ? String(task.intervalHours) : '');
    setIntervalDays(task.intervalDays ? String(task.intervalDays) : '');
    setShowAddForm(true);
  }

  function cancelForm() {
    setEditingTask(null);
    setTaskName('');
    setIntervalHours('');
    setIntervalDays('');
    setShowAddForm(false);
  }

  async function handleSaveTask() {
    if (!taskName) return;
    try {
      const updates: any = { name: taskName.trim() };
      updates.intervalHours = intervalHours ? parseInt(intervalHours) : null;
      updates.intervalDays = intervalDays ? parseInt(intervalDays) : null;

      if (editingTask) {
        await updateMaintenanceTask(editingTask.id, updates);
      } else {
        await createMaintenanceTask({ equipmentId, imported: false, ...updates });
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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.equipName}>{equipment?.name} — {equipment?.totalHours} hrs</Text>

      <FlatList
        data={tasks}
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
                  <TextInput label="Every X hours" value={intervalHours} onChangeText={setIntervalHours} mode="outlined" keyboardType="numeric" style={styles.input} />
                  <TextInput label="Every X days" value={intervalDays} onChangeText={setIntervalDays} mode="outlined" keyboardType="numeric" style={styles.input} />
                  <View style={styles.formRow}>
                    <Button onPress={cancelForm}>Cancel</Button>
                    <Button mode="contained" onPress={handleSaveTask}>Save</Button>
                  </View>
                </Card.Content>
              </Card>
            )}

            <Text variant="labelLarge" style={styles.listHeader}>Tasks ({tasks.length})</Text>
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
                  {canEdit && (
                    <>
                      <IconButton icon="pencil-outline" size={18} onPress={() => startEdit(item)} />
                      <IconButton icon="trash-can-outline" size={18} onPress={() => handleDelete(item.id)} />
                    </>
                  )}
                </View>
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
        ListEmptyComponent={<Text style={styles.empty}>No maintenance tasks. Add one or import from the manufacturer's site.</Text>}
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
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2e7d32' },
});
