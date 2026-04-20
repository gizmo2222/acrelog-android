import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Card, FAB, Chip, Searchbar, SegmentedButtons, ActivityIndicator, IconButton, Divider, Badge } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getEquipment, getCategories, ensureBuiltInCategories } from '../../services/equipment';
import { getMaintenanceTasksForEquipment, getMaintenanceStatus } from '../../services/maintenance';
import { Equipment, Category, MaintenanceStatus } from '../../types';
import { STATUS_COLORS } from '../../constants/equipment';
import EmptyState from '../../components/EmptyState';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type SortKey = 'name_asc' | 'name_desc' | 'hours_desc' | 'hours_asc' | 'maintenance';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'hours_desc', label: 'Hours ↓' },
  { value: 'hours_asc', label: 'Hours ↑' },
  { value: 'maintenance', label: 'Maintenance' },
];

const MAINT_FILTER_OPTIONS: { value: MaintenanceStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: '#6b6b6b' },
  { value: 'broken', label: 'Broken', color: '#7b1fa2' },
  { value: 'overdue', label: 'Overdue', color: '#c62828' },
  { value: 'due_soon', label: 'Due Soon', color: '#f57c00' },
  { value: 'ok', label: 'Up to Date', color: '#2e7d32' },
];

export default function EquipmentListScreen() {
  const navigation = useNavigation<Nav>();
  const { activeFarm, setActiveFarm } = useAuth();
  const insets = useSafeAreaInsets();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState<Record<string, MaintenanceStatus>>({});

  // Filter/sort state
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [maintFilter, setMaintFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('name_asc');

  useFocusEffect(
    useCallback(() => {
      if (!activeFarm) return;
      load();
    }, [activeFarm])
  );

  async function refresh() {
    setRefreshing(true);
    await load(false);
    setRefreshing(false);
  }

  async function load(showSpinner = true) {
    if (!activeFarm) return;
    if (showSpinner) setLoading(true);
    try {
      await ensureBuiltInCategories(activeFarm.farmId);
      const [eq, cats] = await Promise.all([
        getEquipment(activeFarm.farmId),
        getCategories(activeFarm.farmId),
      ]);
      setEquipment(eq);
      setCategories(cats);

      const activeEq = eq.filter(e => e.status === 'active');
      const tasksByEquipment = await getMaintenanceTasksForEquipment(activeEq.map(e => e.id));
      const statuses: Record<string, MaintenanceStatus> = {};
      for (const e of activeEq) {
        if (e.broken) { statuses[e.id] = 'broken'; continue; }
        const tasks = tasksByEquipment[e.id] ?? [];
        statuses[e.id] = tasks.reduce<MaintenanceStatus>((acc, t) => {
          const s = getMaintenanceStatus(t, e.totalHours);
          if (s === 'overdue') return 'overdue';
          if (s === 'due_soon' && acc !== 'overdue') return 'due_soon';
          return acc;
        }, 'ok');
      }
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

  const activeFilterCount = [
    categoryFilter !== null,
    maintFilter !== 'all',
    sortBy !== 'name_asc',
  ].filter(Boolean).length;

  function clearFilters() { setCategoryFilter(null); setMaintFilter('all'); setSortBy('name_asc'); }

  const filtered = equipment
    .filter(e => {
      const matchesStatus = statusFilter === 'active' ? e.status === 'active' : e.status !== 'active';
      const matchesSearch = !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.brand.toLowerCase().includes(search.toLowerCase()) ||
        e.model.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || e.categoryId === categoryFilter;
      const matchesMaint = maintFilter === 'all' || e.status !== 'active' ||
        (maintenanceStatus[e.id] ?? 'ok') === maintFilter;
      return matchesStatus && matchesSearch && matchesCategory && matchesMaint;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'hours_desc': return (b.totalHours ?? 0) - (a.totalHours ?? 0);
        case 'hours_asc': return (a.totalHours ?? 0) - (b.totalHours ?? 0);
        case 'maintenance': {
          const order: Record<MaintenanceStatus, number> = { broken: 0, overdue: 1, due_soon: 2, ok: 3 };
          return (order[maintenanceStatus[a.id] ?? 'ok']) - (order[maintenanceStatus[b.id] ?? 'ok']);
        }
        default: return a.name.localeCompare(b.name);
      }
    });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text variant="headlineSmall" style={styles.title}>Equipment</Text>
          <IconButton
            icon="swap-horizontal"
            size={16}
            iconColor="#6b6b6b"
            style={styles.farmSwitchIcon}
            onPress={() => setActiveFarm(null)}
          />
          <Text variant="bodySmall" style={styles.farmNameLabel} onPress={() => setActiveFarm(null)}>
            {activeFarm?.farmName}
          </Text>
        </View>
        <IconButton icon="cog-outline" size={24} onPress={() => navigation.navigate('FarmSettings')} />
      </View>

      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Search equipment..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
        />
        <View style={styles.filterIconWrap}>
          <IconButton
            icon="tune-variant"
            size={24}
            onPress={() => setShowFilters(v => !v)}
            iconColor={activeFilterCount > 0 ? '#2e7d32' : '#6b6b6b'}
            style={styles.filterIcon}
          />
          {activeFilterCount > 0 && (
            <Badge style={styles.filterBadge} size={16}>{activeFilterCount}</Badge>
          )}
        </View>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          {/* Category */}
          <Text variant="labelSmall" style={styles.filterLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            <Chip
              compact
              selected={categoryFilter === null}
              onPress={() => setCategoryFilter(null)}
              style={styles.filterChip}
            >
              All
            </Chip>
            {categories.map(cat => (
              <Chip
                key={cat.id}
                compact
                selected={categoryFilter === cat.id}
                onPress={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
                style={styles.filterChip}
              >
                {cat.name}
              </Chip>
            ))}
          </ScrollView>

          {/* Maintenance status (active tab only) */}
          {statusFilter === 'active' && (
            <>
              <Text variant="labelSmall" style={styles.filterLabel}>Maintenance</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {MAINT_FILTER_OPTIONS.map(opt => (
                  <Chip
                    key={opt.value}
                    compact
                    selected={maintFilter === opt.value}
                    onPress={() => setMaintFilter(opt.value)}
                    selectedColor={opt.color}
                    style={styles.filterChip}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </ScrollView>
            </>
          )}

          {/* Sort */}
          <Text variant="labelSmall" style={styles.filterLabel}>Sort by</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipRow, styles.chipRowLast]}>
            {SORT_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                compact
                selected={sortBy === opt.value}
                onPress={() => setSortBy(opt.value)}
                style={styles.filterChip}
              >
                {opt.label}
              </Chip>
            ))}
          </ScrollView>

          {activeFilterCount > 0 && (
            <Text
              variant="labelSmall"
              style={styles.clearFilters}
              onPress={clearFilters}
            >
              Clear filters
            </Text>
          )}

          <Divider style={styles.filterDivider} />
        </View>
      )}

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
        contentContainerStyle={{ paddingBottom: 96 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#2e7d32']} tintColor="#2e7d32" />}
        renderItem={({ item }) => {
          const mStatus = maintenanceStatus[item.id] ?? 'ok';
          return (
            <Card
              style={styles.card}
              onPress={() => navigation.navigate('EquipmentDetail', { equipmentId: item.id })}
            >
              <Card.Content style={styles.cardContent}>
                {(item.primaryImageUrl || item.photos?.[0]?.url) ? (
                  <Card.Cover source={{ uri: item.primaryImageUrl ?? item.photos![0].url }} style={styles.thumbnail} />
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
                      {mStatus === 'ok' ? 'Up to date' : mStatus === 'due_soon' ? 'Due soon' : mStatus === 'overdue' ? 'Overdue' : 'Broken'}
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
          activeFilterCount > 0
            ? <EmptyState
                icon="filter-remove-outline"
                title="No equipment matches your filters"
                subtitle="Try adjusting or clearing your filters."
                action={{ label: 'Clear Filters', onPress: clearFilters }}
              />
            : <EmptyState
                icon="tractor"
                title="No equipment yet"
                subtitle="Add your first piece of equipment to get started tracking maintenance and hours."
                action={
                  activeFarm?.role !== 'worker' && activeFarm?.role !== 'auditor'
                    ? { label: 'Add Equipment', onPress: () => navigation.navigate('EquipmentForm', {}) }
                    : undefined
                }
              />
        }
      />

      {activeFarm?.role !== 'worker' && activeFarm?.role !== 'auditor' && (
        <>
          <FAB
            icon="barcode-scan"
            label="Scan Serial"
            style={[styles.fab, { bottom: 72 + insets.bottom, backgroundColor: '#4a4540' }]}
            color="#ffffff"
            onPress={() => navigation.navigate('SerialScan')}
            size="small"
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
  container: { flex: 1, backgroundColor: '#f5f2ee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingLeft: 16, paddingRight: 4, paddingBottom: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  title: { fontWeight: 'bold', color: '#2e7d32' },
  farmNameLabel: { color: '#6b6b6b' },
  farmSwitchIcon: { margin: 0, marginLeft: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8 },
  search: { flex: 1 },
  filterIconWrap: { position: 'relative' },
  filterIcon: { margin: 0, marginLeft: 4 },
  filterBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#2e7d32' },
  filterPanel: { backgroundColor: '#faf9f7', borderWidth: 1, borderColor: '#e8e4df', marginHorizontal: 16, marginBottom: 4, borderRadius: 8, paddingTop: 12, paddingHorizontal: 12 },
  filterLabel: { color: '#6b6b6b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { marginBottom: 10 },
  chipRowLast: { marginBottom: 4 },
  filterChip: { marginRight: 6 },
  clearFilters: { color: '#c62828', textAlign: 'right', marginBottom: 8 },
  filterDivider: { marginTop: 4 },
  segment: { marginHorizontal: 16, marginVertical: 8 },
  card: { marginHorizontal: 16, marginBottom: 8, borderRadius: 8 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  thumbnail: { width: 64, height: 64, borderRadius: 8, marginRight: 12 },
  cardText: { flex: 1 },
  subtitle: { color: '#6b6b6b' },
  category: { color: '#6b6b6b', fontSize: 12, marginTop: 3 },
  statusChip: { marginTop: 6, alignSelf: 'flex-start' },
  archivedChip: { marginTop: 4, alignSelf: 'flex-start' },
  empty: { textAlign: 'center', color: '#6b6b6b', marginTop: 48 },
  fab: { position: 'absolute', right: 16, backgroundColor: '#2e7d32' },
});
