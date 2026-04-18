import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, Card, Divider, ActivityIndicator, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { getEquipmentById } from '../../services/equipment';
import { getMaintenanceLogs, getMaintenanceTasks } from '../../services/maintenance';
import { Equipment, MaintenanceLog, MaintenanceTask } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'MaintenanceHistory'>;

export default function MaintenanceHistoryScreen({ route }: Props) {
  const { equipmentId } = route.params;
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [eq, l, t] = await Promise.all([
        getEquipmentById(equipmentId),
        getMaintenanceLogs(equipmentId),
        getMaintenanceTasks(equipmentId),
      ]);
      setEquipment(eq);
      setLogs(l);
      setTasks(t);
      setLoading(false);
    })();
  }, []);

  function getTaskName(taskId: string) {
    return tasks.find(t => t.id === taskId)?.name ?? 'Unknown task';
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>{equipment?.name} — Maintenance History</Text>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleSmall" style={styles.taskName}>{getTaskName(item.maintenanceTaskId)}</Text>
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
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No maintenance history yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { padding: 16, fontWeight: 'bold', color: '#2e7d32' },
  card: { marginHorizontal: 16, marginBottom: 8, borderRadius: 8 },
  taskName: { fontWeight: 'bold' },
  date: { color: '#888', marginBottom: 4 },
  notes: { color: '#555', marginTop: 4 },
  diagRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  diagText: { flex: 1, color: '#555' },
  miniDivider: { marginVertical: 8 },
  partsLabel: { color: '#666', marginBottom: 2 },
  part: { color: '#444', marginLeft: 8 },
  attachRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  empty: { textAlign: 'center', color: '#999', padding: 32 },
});
