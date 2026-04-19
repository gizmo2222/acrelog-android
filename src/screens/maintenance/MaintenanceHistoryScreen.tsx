import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, Card, Divider, ActivityIndicator, Chip, IconButton, TextInput, Button } from 'react-native-paper';
import EmptyState from '../../components/EmptyState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getEquipmentById } from '../../services/equipment';
import { getMaintenanceLogs, getMaintenanceTasks, updateMaintenanceLog, deleteMaintenanceLog } from '../../services/maintenance';
import { Equipment, MaintenanceLog, MaintenanceTask, PartUsed } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MaintenanceHistory'>;

export default function MaintenanceHistoryScreen({ route }: Props) {
  const { equipmentId } = route.params;
  const { activeFarm } = useAuth();
  const insets = useSafeAreaInsets();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDiag, setEditDiag] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [eq, l, t] = await Promise.all([
      getEquipmentById(equipmentId),
      getMaintenanceLogs(equipmentId),
      getMaintenanceTasks(equipmentId),
    ]);
    setEquipment(eq);
    setLogs(l);
    setTasks(t);
    setLoading(false);
  }

  function getTaskName(taskId: string) {
    return tasks.find(t => t.id === taskId)?.name ?? 'Unknown task';
  }

  function startEdit(log: MaintenanceLog) {
    setEditingId(log.id);
    setEditHours(String(log.hoursAtCompletion));
    setEditNotes(log.notes ?? '');
    setEditDiag(log.diagnosticNotes ?? '');
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(log: MaintenanceLog) {
    setSaving(true);
    try {
      await updateMaintenanceLog(log.id, {
        hoursAtCompletion: parseFloat(editHours) || log.hoursAtCompletion,
        notes: editNotes,
        diagnosticNotes: editDiag,
      });
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  const canEdit = activeFarm?.role !== 'auditor';

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>{equipment?.name} — Maintenance History</Text>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        renderItem={({ item }) => {
          const isEditing = editingId === item.id;
          return (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.headerRow}>
                  <Text variant="titleSmall" style={[styles.taskName, styles.flex]}>{getTaskName(item.maintenanceTaskId)}</Text>
                  {canEdit && !isEditing && (
                    <>
                      <IconButton icon="pencil-outline" size={18} onPress={() => startEdit(item)} />
                      <IconButton icon="trash-can-outline" size={18} onPress={() => {
                        Alert.alert('Delete Log', 'Remove this maintenance record?', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: async () => { await deleteMaintenanceLog(item.id); load(); } },
                        ]);
                      }} />
                    </>
                  )}
                </View>

                {isEditing ? (
                  <>
                    <TextInput label="Hours at completion" value={editHours} onChangeText={setEditHours} mode="outlined" keyboardType="numeric" style={styles.input} />
                    <TextInput label="Notes" value={editNotes} onChangeText={setEditNotes} mode="outlined" multiline numberOfLines={2} style={styles.input} />
                    <TextInput label="Symptom / Diagnostic notes" value={editDiag} onChangeText={setEditDiag} mode="outlined" multiline numberOfLines={2} style={styles.input} />
                    <View style={styles.editActions}>
                      <Button onPress={cancelEdit}>Cancel</Button>
                      <Button mode="contained" onPress={() => saveEdit(item)} loading={saving}>Save</Button>
                    </View>
                  </>
                ) : (
                  <>
                    <Text variant="bodySmall" style={styles.date}>
                      {item.completedAt.toDate().toLocaleDateString()} at {item.hoursAtCompletion} hrs
                    </Text>
                    {item.notes ? <Text variant="bodySmall" style={styles.notes}>{item.notes}</Text> : null}
                    {item.diagnosticNotes ? (
                      <View style={styles.diagRow}>
                        <Chip compact icon="stethoscope">Symptom</Chip>
                        <Text variant="bodySmall" style={styles.diagText}>{item.diagnosticNotes}</Text>
                      </View>
                    ) : null}
                    {item.partsUsed.length > 0 && (
                      <>
                        <Divider style={styles.miniDivider} />
                        <Text variant="labelSmall" style={styles.partsLabel}>Parts Used</Text>
                        {item.partsUsed.map((p, i) => (
                          <Text key={i} variant="bodySmall" style={styles.part}>
                            {p.name} {p.partNumber ? `(${p.partNumber})` : ''} × {p.quantity}
                          </Text>
                        ))}
                      </>
                    )}
                    {(item.receiptUrls.length > 0 || item.photoUrls.length > 0) && (
                      <View style={styles.attachRow}>
                        {item.receiptUrls.length > 0 && <Chip compact icon="receipt">{item.receiptUrls.length} receipt(s)</Chip>}
                        {item.photoUrls.length > 0 && <Chip compact icon="image">{item.photoUrls.length} photo(s)</Chip>}
                      </View>
                    )}
                  </>
                )}
              </Card.Content>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="history"
            title="No maintenance history yet"
            subtitle="Completed maintenance tasks will appear here."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { padding: 16, fontWeight: 'bold', color: '#2e7d32' },
  card: { marginHorizontal: 16, marginBottom: 8, borderRadius: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  taskName: { fontWeight: 'bold' },
  date: { color: '#6b6b6b', marginBottom: 4 },
  notes: { color: '#555', marginTop: 4 },
  diagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  diagText: { flex: 1, color: '#555' },
  miniDivider: { marginVertical: 8 },
  partsLabel: { color: '#666', marginBottom: 2 },
  part: { color: '#444', marginLeft: 8 },
  attachRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  empty: { textAlign: 'center', color: '#999', padding: 32 },
  input: { marginBottom: 8 },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});
