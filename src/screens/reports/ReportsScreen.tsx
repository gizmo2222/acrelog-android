import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Card, Button, ActivityIndicator, DataTable } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../hooks/useAuth';
import { getEquipment } from '../../services/equipment';
import { getMaintenanceTasks, getMaintenanceStatus, getMaintenanceLogs } from '../../services/maintenance';
import { getDowntimeRecords } from '../../services/equipment';
import { Equipment, MaintenanceTask, MaintenanceLog, DowntimeRecord } from '../../types';
import { errorMessage } from '../../utils/errorMessage';
import EmptyState from '../../components/EmptyState';

interface EquipmentSummary {
  equipment: Equipment;
  tasks: MaintenanceTask[];
  overdueCount: number;
  dueSoonCount: number;
  totalDowntimeMs: number;
}

export default function ReportsScreen() {
  const { activeFarm } = useAuth();
  const [summaries, setSummaries] = useState<EquipmentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { load(); }, [activeFarm]));

  async function load() {
    if (!activeFarm) return;
    setLoading(true);
    try {
    const equipment = await getEquipment(activeFarm.farmId);
    const results = await Promise.all(
      equipment.filter(e => e.status === 'active').map(async (e) => {
        const tasks = await getMaintenanceTasks(e.id);
        const downtimes = await getDowntimeRecords(e.id);

        let overdueCount = 0;
        let dueSoonCount = 0;
        tasks.forEach(t => {
          const s = getMaintenanceStatus(t, e.totalHours);
          if (s === 'overdue') overdueCount++;
          if (s === 'due_soon') dueSoonCount++;
        });

        const totalDowntimeMs = downtimes.reduce((acc, d) => {
          if (!d.resolvedAt) return acc;
          return acc + (d.resolvedAt.toMillis() - d.startedAt.toMillis());
        }, 0);

        return { equipment: e, tasks, overdueCount, dueSoonCount, totalDowntimeMs };
      })
    );
    setSummaries(results);
    } catch (e: any) {
      Alert.alert('Could not load reports', errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function exportEquipmentPDF(summary: EquipmentSummary) {
    const logs = await getMaintenanceLogs(summary.equipment.id);
    const rows = logs.map(l => {
      const task = summary.tasks.find(t => t.id === l.maintenanceTaskId);
      return `<tr>
        <td>${task?.name ?? 'Unknown'}</td>
        <td>${l.completedAt.toDate().toLocaleDateString()}</td>
        <td>${l.hoursAtCompletion} hrs</td>
        <td>${l.notes || '-'}</td>
        <td>${l.partsUsed.map(p => `${p.name} ${p.partNumber}`).join(', ') || '-'}</td>
      </tr>`;
    }).join('');

    const html = `
      <html><body style="font-family: sans-serif; padding: 24px;">
        <h1>${summary.equipment.name}</h1>
        <p><b>Brand:</b> ${summary.equipment.brand} &nbsp; <b>Model:</b> ${summary.equipment.model}</p>
        <p><b>Serial:</b> ${summary.equipment.serialNumber} &nbsp; <b>Total Hours:</b> ${summary.equipment.totalHours}</p>
        <h2>Maintenance History</h2>
        <table border="1" cellpadding="6" cellspacing="0" width="100%">
          <thead><tr><th>Task</th><th>Date</th><th>Hours</th><th>Notes</th><th>Parts</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color: #888; margin-top: 24px;">Generated ${new Date().toLocaleDateString()}</p>
      </body></html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }

  const insets = useSafeAreaInsets();

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  if (summaries.length === 0) {
    return (
      <View style={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>Reports</Text>
        <EmptyState
          icon="chart-bar"
          title="No active equipment"
          subtitle="Add equipment to start tracking maintenance status and generate reports."
        />
      </View>
    );
  }

  const totalOverdue = summaries.reduce((a, s) => a + s.overdueCount, 0);
  const totalDueSoon = summaries.reduce((a, s) => a + s.dueSoonCount, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      <Text variant="headlineSmall" style={styles.title}>Reports</Text>

      {/* Fleet summary */}
      <View style={styles.statBar}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#c62828' }]} />
          <Text style={styles.statBarNum}>{totalOverdue}</Text>
          <Text style={styles.statBarLabel}>Overdue</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#f57c00' }]} />
          <Text style={styles.statBarNum}>{totalDueSoon}</Text>
          <Text style={styles.statBarLabel}>Due soon</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#2e7d32' }]} />
          <Text style={styles.statBarNum}>{summaries.length}</Text>
          <Text style={styles.statBarLabel}>Active equipment</Text>
        </View>
      </View>

      {/* Equipment utilization table */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Fleet Overview</Text>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title style={styles.flex}>Equipment</DataTable.Title>
              <DataTable.Title numeric>Hours</DataTable.Title>
              <DataTable.Title numeric>Overdue</DataTable.Title>
              <DataTable.Title numeric>Due Soon</DataTable.Title>
            </DataTable.Header>
            {summaries.map(s => (
              <DataTable.Row key={s.equipment.id}>
                <DataTable.Cell style={styles.flex}>{s.equipment.name}</DataTable.Cell>
                <DataTable.Cell numeric>{s.equipment.totalHours}</DataTable.Cell>
                <DataTable.Cell numeric style={s.overdueCount > 0 ? styles.redCell : {}}>
                  {s.overdueCount}
                </DataTable.Cell>
                <DataTable.Cell numeric style={s.dueSoonCount > 0 ? styles.orangeCell : {}}>
                  {s.dueSoonCount}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>

      {/* Per-equipment PDF export */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Export Maintenance History</Text>
          <Text variant="bodySmall" style={styles.exportNote}>Full maintenance history as a PDF — useful when selling a piece of equipment.</Text>
          {summaries.map(s => (
            <View key={s.equipment.id} style={styles.exportRow}>
              <Text variant="bodyMedium" style={styles.flex}>{s.equipment.name}</Text>
              <Button compact icon="file-pdf-box" mode="outlined" onPress={() => exportEquipmentPDF(s)}>
                PDF
              </Button>
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { padding: 16, fontWeight: 'bold', color: '#2e7d32' },
  statBar: { flexDirection: 'row', backgroundColor: '#faf9f7', borderRadius: 8, marginHorizontal: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e8e4df', paddingVertical: 14 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statBarNum: { fontSize: 28, fontFamily: 'BarlowCondensed_700Bold', fontWeight: '700', color: '#1a1a18', lineHeight: 32, letterSpacing: -0.5 },
  statBarLabel: { fontSize: 12, color: '#6b6b6b', letterSpacing: 0.3 },
  statDivider: { width: 1, backgroundColor: '#e8e4df', marginVertical: 4 },
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 8 },
  sectionTitle: { fontWeight: 'bold', color: '#2e7d32', marginBottom: 8 },
  flex: { flex: 1 },
  redCell: { color: '#c62828' },
  orangeCell: { color: '#f57c00' },
  exportNote: { color: '#6b6b6b', marginBottom: 8 },
  exportRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
});
