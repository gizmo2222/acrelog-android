import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Card, Chip, Button, FAB, IconButton, TextInput, ActivityIndicator } from 'react-native-paper';
import EmptyState from '../../components/EmptyState';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getEquipmentById } from '../../services/equipment';
import {
  getMaintenanceTasks, createMaintenanceTask, deleteMaintenanceTask,
  archiveMaintenanceTask, getMaintenanceStatus, scrapeMaintenanceSchedule,
} from '../../services/maintenance';
import { Equipment, MaintenanceTask } from '../../types';
import { errorMessage } from '../../utils/errorMessage';

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
  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importedTasks, setImportedTasks] = useState<Omit<MaintenanceTask, 'id' | 'equipmentId' | 'createdAt'>[]>([]);

  const [showArchived, setShowArchived] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, [equipmentId]));

  async function load() {
    setLoading(true);
    const [eq, t] = await Promise.all([getEquipmentById(equipmentId), getMaintenanceTasks(equipmentId)]);
    setEquipment(eq);
    setTasks(t);
    setLoading(false);
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
    const task = tasks.find(t => t.id === id);
    Alert.alert(`Delete "${task?.name ?? 'task'}"?`, "This can't be undone.", [
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
                    Import Tasks
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

            {recurringTasks.length > 0 && <Text variant="labelLarge" style={styles.listHeader}>Recurring ({recurringTasks.length})</Text>}
            {recurringTasks.length === 0 && oneOffTasks.length === 0 && (
              <EmptyState
                icon="wrench-clock"
                title="No maintenance tasks"
                subtitle="Add tasks manually or import from the manufacturer's maintenance page."
                action={canEdit ? { label: 'Add Task', onPress: () => navigation.navigate('MaintenanceTaskForm', { equipmentId }) } : undefined}
              />
            )}
          </>
        }
        renderItem={({ item }) => {
          const status = getMaintenanceStatus(item, equipment?.totalHours ?? 0);
          return (
            <Card style={styles.card}>
              <Card.Content>
                {/* Tier 1: name + status chip */}
                <View style={styles.taskTier1}>
                  <Text variant="titleSmall" style={styles.taskName}>{item.name}</Text>
                  <View style={styles.taskChips}>
                    <Chip compact style={{ backgroundColor: STATUS_COLORS[status] }} textStyle={{ color: 'white' }}>
                      {status === 'ok' ? 'OK' : status === 'due_soon' ? 'Due Soon' : 'Overdue'}
                    </Chip>
                    {item.imported && <Chip compact style={styles.importedChip}>Imported</Chip>}
                  </View>
                </View>

                {/* Tier 2: schedule meta + last done */}
                <View style={styles.taskMeta}>
                  {item.intervalHours ? <Text variant="bodySmall" style={styles.interval}>Every {item.intervalHours} hrs</Text> : null}
                  {item.intervalDays ? <Text variant="bodySmall" style={styles.interval}>Every {item.intervalDays} days</Text> : null}
                  {item.nextDueHours ? <Text variant="bodySmall" style={[styles.interval, { color: STATUS_COLORS[status] }]}>Due at {item.nextDueHours} hrs</Text> : null}
                  {item.nextDueAt ? <Text variant="bodySmall" style={[styles.interval, { color: STATUS_COLORS[status] }]}>Due {item.nextDueAt.toDate().toLocaleDateString()}</Text> : null}
                  {item.lastCompletedAt ? (
                    <Text variant="bodySmall" style={styles.lastDone}>
                      Last done {item.lastCompletedAt.toDate().toLocaleDateString()}
                      {item.lastCompletedHours ? ` · ${item.lastCompletedHours} hrs` : ''}
                    </Text>
                  ) : null}
                </View>

                {item.notes ? <Text variant="bodySmall" style={styles.taskNotes}>{item.notes}</Text> : null}
                {(item.photoUrls?.length ?? 0) > 0 && (
                  <View style={styles.photoGrid}>
                    {item.photoUrls!.map((url, i) => <Image key={i} source={{ uri: url }} style={styles.photoThumb} />)}
                  </View>
                )}

                {/* Actions row */}
                <View style={styles.taskActions}>
                  {canLog && (
                    <Button
                      mode="contained"
                      style={styles.logBtn}
                      onPress={() => navigation.navigate('MaintenanceLogForm', { taskId: item.id, equipmentId })}
                    >
                      Log Completion
                    </Button>
                  )}
                  {canEdit && (
                    <View style={styles.taskIcons}>
                      <IconButton icon="pencil-outline" size={18} onPress={() => navigation.navigate('MaintenanceTaskForm', { equipmentId, taskId: item.id })} />
                      <IconButton icon="archive-outline" size={18} onPress={() => { archiveMaintenanceTask(item.id, true); load(); }} />
                      <IconButton icon="trash-can-outline" size={18} onPress={() => handleDelete(item.id)} />
                    </View>
                  )}
                </View>
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
                      <View style={styles.taskTier1}>
                        <Text variant="titleSmall" style={styles.taskName}>{item.name}</Text>
                        <Chip compact style={styles.pendingChip} textStyle={{ color: '#d4870a' }}>Pending</Chip>
                      </View>
                      {item.lastCompletedAt ? (
                        <Text variant="bodySmall" style={styles.lastDone}>
                          Last done {item.lastCompletedAt.toDate().toLocaleDateString()}
                          {item.lastCompletedHours ? ` · ${item.lastCompletedHours} hrs` : ''}
                        </Text>
                      ) : null}
                      <View style={styles.taskActions}>
                        {canLog && (
                          <Button
                            mode="contained"
                            style={styles.logBtn}
                            onPress={() => navigation.navigate('MaintenanceLogForm', { taskId: item.id, equipmentId })}
                          >
                            Log Completion
                          </Button>
                        )}
                        {canEdit && (
                          <View style={styles.taskIcons}>
                            <IconButton icon="pencil-outline" size={18} onPress={() => navigation.navigate('MaintenanceTaskForm', { equipmentId, taskId: item.id })} />
                            <IconButton icon="trash-can-outline" size={18} onPress={() => handleDelete(item.id)} />
                          </View>
                        )}
                      </View>
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
                  Archived ({archivedTasks.length})
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
        <FAB icon="plus" style={[styles.fab, { bottom: 16 + insets.bottom }]} onPress={() => navigation.navigate('MaintenanceTaskForm', { equipmentId })} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  equipName: { padding: 16, paddingBottom: 0, color: '#2e7d32', fontWeight: 'bold' },
  importRow: { flexDirection: 'row', padding: 16, paddingBottom: 0 },
  card: { margin: 16, marginBottom: 0, borderRadius: 8 },
  importNote: { color: '#6b6b6b', marginBottom: 8 },
  input: { marginBottom: 12 },
  importedTask: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  flex: { flex: 1 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8 },
  formRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  listHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, color: '#6b6b6b' },
  taskTier1: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  taskName: { flex: 1, marginRight: 8 },
  taskChips: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  taskActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  taskIcons: { flexDirection: 'row', alignItems: 'center' },
  interval: { color: '#6b6b6b' },
  lastDone: { color: '#6b6b6b' },
  logBtn: { flex: 1 },
  empty: { textAlign: 'center', color: '#6b6b6b', padding: 32 },
  archivedToggle: { marginHorizontal: 16, marginTop: 8, alignSelf: 'flex-start' },
  archivedCard: { opacity: 0.6 },
  archivedText: { color: '#6b6b6b' },
  taskNotes: { color: '#6b6b6b', marginBottom: 4, fontStyle: 'italic' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  photoThumb: { width: 64, height: 64, borderRadius: 4 },
  pendingChip: { backgroundColor: '#fff3e0' },
  importedChip: { backgroundColor: '#f3e5f5', marginLeft: 4 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2e7d32' },
});
