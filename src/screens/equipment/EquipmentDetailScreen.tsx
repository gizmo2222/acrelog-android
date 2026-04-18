import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, Chip, Card, Divider, Menu, IconButton, ActivityIndicator, Dialog, Portal, TextInput as PaperTextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getEquipmentById, getCategories, archiveEquipment, deleteEquipment } from '../../services/equipment';
import { getMaintenanceTasks, getMaintenanceStatus } from '../../services/maintenance';
import { Equipment, Category, MaintenanceTask } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EquipmentDetail'>;

const STATUS_COLORS: Record<string, string> = {
  ok: '#2e7d32',
  due_soon: '#f57c00',
  overdue: '#c62828',
};

export default function EquipmentDetailScreen({ route, navigation }: Props) {
  const { equipmentId } = route.params;
  const { activeFarm } = useAuth();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [brokenDialogVisible, setBrokenDialogVisible] = useState(false);
  const [breakReason, setBreakReason] = useState('');

  useFocusEffect(
    useCallback(() => { load(); }, [equipmentId])
  );

  async function load() {
    setLoading(true);
    const eq = await getEquipmentById(equipmentId);
    setEquipment(eq);
    if (eq && activeFarm) {
      const cats = await getCategories(activeFarm.farmId);
      setCategory(cats.find(c => c.id === eq.categoryId) ?? null);
      const t = await getMaintenanceTasks(equipmentId);
      setTasks(t);
    }
    setLoading(false);
  }

  function canEdit() {
    return activeFarm?.role === 'owner';
  }

  async function handleArchive(status: 'archived' | 'sold' | 'broken') {
    if (status === 'broken') {
      setBreakReason('');
      setBrokenDialogVisible(true);
    } else {
      Alert.alert('Confirm', `Mark as ${status}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: async () => { await archiveEquipment(equipmentId, status); navigation.goBack(); } },
      ]);
    }
  }

  async function confirmBroken() {
    if (!breakReason.trim()) return;
    setBrokenDialogVisible(false);
    await archiveEquipment(equipmentId, 'broken', breakReason.trim());
    navigation.goBack();
  }

  const insets = useSafeAreaInsets();

  if (loading || !equipment) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      {/* Header row with menu */}
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={styles.name}>{equipment.name}</Text>
        {canEdit() && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
          >
            <Menu.Item onPress={() => { setMenuVisible(false); navigation.navigate('EquipmentForm', { equipmentId }); }} title="Edit" />
            {['active', 'broken'].includes(equipment.status) && (
              <>
                <Menu.Item onPress={() => { setMenuVisible(false); handleArchive('archived'); }} title="Archive" />
                <Menu.Item onPress={() => { setMenuVisible(false); handleArchive('sold'); }} title="Mark as Sold" />
                {equipment.status === 'active' && (
                  <Menu.Item onPress={() => { setMenuVisible(false); handleArchive('broken'); }} title="Mark as Broken" />
                )}
                <Divider />
                <Menu.Item
                  title="Delete…"
                  titleStyle={{ color: '#999' }}
                  onPress={() => { setMenuVisible(false); Alert.alert('Archive First', 'Archive or mark as sold before deleting.'); }}
                />
              </>
            )}
            {!['active', 'broken'].includes(equipment.status) && (
              <>
                <Menu.Item onPress={() => { setMenuVisible(false); archiveEquipment(equipmentId, 'active').then(load); }} title="Restore to Active" />
                <Divider />
                <Menu.Item
                  title="Delete Permanently"
                  titleStyle={{ color: '#c62828' }}
                  onPress={() => {
                    setMenuVisible(false);
                    Alert.alert(
                      'Delete Equipment',
                      `Permanently delete "${equipment.name}"? This cannot be undone.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: async () => { await deleteEquipment(equipmentId); navigation.goBack(); } },
                      ]
                    );
                  }}
                />
              </>
            )}
          </Menu>
        )}
      </View>

      {/* Primary image */}
      {equipment.primaryImageUrl && (
        <Image source={{ uri: equipment.primaryImageUrl }} style={styles.primaryImage} />
      )}

      {/* Status */}
      {equipment.status !== 'active' && (
        <View style={styles.row}>
          <Chip style={[styles.chip, equipment.status === 'broken' && styles.chipBroken]}>
            {equipment.status.toUpperCase()}
          </Chip>
          {equipment.status === 'broken' && equipment.breakReason && (
            <Text variant="bodySmall" style={styles.breakReason}>Reason: {equipment.breakReason}</Text>
          )}
        </View>
      )}

      {/* Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Details</Text>
          <DetailRow label="Brand" value={equipment.brand} />
          <DetailRow label="Model" value={equipment.model} />
          <DetailRow label="Serial #" value={equipment.serialNumber} />
          <DetailRow label="Category" value={category?.name ?? '-'} />
          <DetailRow label="Location" value={equipment.location || '-'} />
          <DetailRow label="Purchase Location" value={equipment.purchaseLocation || '-'} />
          <DetailRow label="Total Hours" value={`${equipment.totalHours} hrs`} />
          {equipment.description ? <DetailRow label="Description" value={equipment.description} /> : null}
          {equipment.manufacturerUrl ? <DetailRow label="Manufacturer URL" value={equipment.manufacturerUrl} /> : null}
        </Card.Content>
      </Card>

      {/* Custom fields */}
      {Object.keys(equipment.customFields ?? {}).length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Specifications</Text>
            {Object.entries(equipment.customFields).map(([k, v]) => (
              <DetailRow key={k} label={k} value={v} />
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Maintenance */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>Maintenance</Text>
            <Button compact onPress={() => navigation.navigate('MaintenanceSchedule', { equipmentId })}>
              View All
            </Button>
          </View>
          {tasks.slice(0, 3).map((task) => {
            const status = getMaintenanceStatus(task, equipment.totalHours);
            return (
              <View key={task.id} style={styles.taskRow}>
                <Text variant="bodyMedium" style={styles.taskName}>{task.name}</Text>
                <Chip compact style={{ backgroundColor: STATUS_COLORS[status] }} textStyle={{ color: 'white' }}>
                  {status === 'ok' ? 'OK' : status === 'due_soon' ? 'Due Soon' : 'Overdue'}
                </Chip>
              </View>
            );
          })}
          {tasks.length === 0 && <Text style={styles.empty}>No maintenance tasks</Text>}
        </Card.Content>
      </Card>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button mode="contained" icon="wrench" onPress={() => navigation.navigate('MaintenanceSchedule', { equipmentId })} style={styles.actionBtn}>
          Maintenance
        </Button>
        <Button mode="outlined" icon="clipboard-check" onPress={() => navigation.navigate('InspectionChecklist', { equipmentId })} style={styles.actionBtn}>
          Inspection
        </Button>
        <Button mode="outlined" icon="history" onPress={() => navigation.navigate('MaintenanceHistory', { equipmentId })} style={styles.actionBtn}>
          History
        </Button>
      </View>
      <Portal>
        <Dialog visible={brokenDialogVisible} onDismiss={() => setBrokenDialogVisible(false)}>
          <Dialog.Title>Mark as Broken</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Reason *"
              value={breakReason}
              onChangeText={setBreakReason}
              mode="outlined"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setBrokenDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmBroken} disabled={!breakReason.trim()}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="labelMedium" style={styles.detailLabel}>{label}</Text>
      <Text variant="bodyMedium" style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  name: { fontWeight: 'bold', flex: 1 },
  primaryImage: { width: '100%', height: 200, resizeMode: 'cover' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  chip: { marginRight: 8 },
  chipBroken: { backgroundColor: '#c62828' },
  breakReason: { color: '#c62828', flex: 1 },
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 8 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8, color: '#2e7d32' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { color: '#666', flex: 1 },
  detailValue: { flex: 2, textAlign: 'right' },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  taskName: { flex: 1 },
  empty: { color: '#999', textAlign: 'center', padding: 8 },
  actions: { padding: 16, gap: 8 },
  actionBtn: { marginBottom: 4 },
});
