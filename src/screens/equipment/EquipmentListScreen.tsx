import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Card, FAB, Chip, Searchbar, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getEquipment, getCategories } from '../../services/equipment';
import { getMaintenanceTasks, getMaintenanceStatus } from '../../services/maintenance';
import { Equipment, Category, EquipmentStatus, MaintenanceStatus } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLORS: Record<MaintenanceStatus, string> = {
  ok: '#2e7d32',
  due_soon: '#f57c00',
  overdue: '#c62828',
};

export default function EquipmentListScreen() {
  const navigation = useNavigation<Nav>();
  const { activeFarm } = useAuth();
  const insets = useSafeAreaInsets();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');
  const [loading, setLoading] = useState(true);
  const [maintenanceStatus, setMaintenanceStatus] = useState<Record<string, MaintenanceStatus>>({});

  useFocusEffect(
    useCallback(() => {
      if (!activeFarm) return;
      load();
    }, [activeFarm])
  );

  async function load() {
    if (!activeFarm) return;
    setLoading(true);
    try {
      const [eq, cats] = await Promise.all([
        getEquipment(activeFarm.farmId),
        getCategories(activeFarm.farmId),
      ]);
      setEquipment(eq);
      setCategories(cats);

      const statuses: Record<string, MaintenanceStatus> = {};
      await Promise.all(
        eq.filter(e => e.status === 'active').map(async (e) => {
          const tasks = await getMaintenanceTasks(e.id);
          const worst = tasks.reduce<MaintenanceStatus>((acc, t) => {
            const s = getMaintenanceStatus(t, e.totalHours);
            if (s === 'overdue') return 'overdue';
            if (s === 'due_soon' && acc !== 'overdue') return 'due_soon';
            return acc;
          }, 'ok');
          statuses[e.id] = worst;
        })
      );
      setMaintenanceStatus(statuses);
    } catch (e: any) {
      console.error('Equipment load error:', e.message);
    } finally {
      setLoading(false);
    }
  }

  function getCategoryName(categoryId: string) {
    return categories.find(c => c.id === categoryId)?.name ?? 'Unknown';
  }

  const filtered = equipment.filter(e => {
    const matchesStatus = statusFilter === 'active'
      ? e.status === 'active'
      : ['archived', 'sold', 'broken'].includes(e.status);
    const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.brand.toLowerCase().includes(search.toLowerCase()) ||
      e.model.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>Equipment</Text>
      </View>

      <Searchbar placeholder="Search equipment..." value={search} onChangeText={setSearch} style={styles.search} />

      <SegmentedButtons
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as any)}
        buttons={[
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
        ]}
        style={styles.segment}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const mStatus = maintenanceStatus[item.id] ?? 'ok';
          return (
            <Card
              style={styles.card}
              onPress={() => navigation.navigate('EquipmentDetail', { equipmentId: item.id })}
            >
              <Card.Content style={styles.cardContent}>
                {item.primaryImageUrl ? (
                  <Card.Cover source={{ uri: item.primaryImageUrl }} style={styles.thumbnail} />
                ) : null}
                <View style={styles.cardText}>
                  <Text variant="titleMedium">{item.name}</Text>
                  <Text variant="bodySmall" style={styles.subtitle}>{item.brand} {item.model}</Text>
                  <Text variant="bodySmall" style={styles.category}>{getCategoryName(item.categoryId)}</Text>
                  {item.status === 'active' && (
                    <Chip
                      compact
                      style={[styles.statusChip, { backgroundColor: STATUS_COLORS[mStatus] }]}
                      textStyle={{ color: 'white' }}
                    >
                      {mStatus === 'ok' ? 'Up to date' : mStatus === 'due_soon' ? 'Due soon' : 'Overdue'}
                    </Chip>
                  )}
                  {item.status !== 'active' && (
                    <Chip compact style={styles.archivedChip}>{item.status}</Chip>
                  )}
                </View>
              </Card.Content>
            </Card>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No equipment found</Text>
        }
      />

      {activeFarm?.role !== 'worker' && activeFarm?.role !== 'auditor' && (
        <>
          <FAB
            icon="camera"
            style={[styles.fab, { bottom: 80 + insets.bottom, backgroundColor: '#555' }]}
            onPress={() => navigation.navigate('SerialScan')}
            small
          />
          <FAB
            icon="plus"
            style={[styles.fab, { bottom: 16 + insets.bottom }]}
            onPress={() => navigation.navigate('EquipmentForm', {})}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, paddingBottom: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontWeight: 'bold', color: '#2e7d32' },
  search: { margin: 16, marginTop: 8 },
  segment: { marginHorizontal: 16, marginBottom: 8 },
  card: { marginHorizontal: 16, marginBottom: 8, borderRadius: 8 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  thumbnail: { width: 64, height: 64, borderRadius: 8, marginRight: 12 },
  cardText: { flex: 1 },
  subtitle: { color: '#666' },
  category: { color: '#888', fontSize: 11 },
  statusChip: { marginTop: 4, alignSelf: 'flex-start' },
  archivedChip: { marginTop: 4, alignSelf: 'flex-start' },
  empty: { textAlign: 'center', color: '#999', marginTop: 48 },
  fab: { position: 'absolute', right: 16, backgroundColor: '#2e7d32' },
});
