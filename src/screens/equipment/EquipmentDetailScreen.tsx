import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Button, Chip, Card, Divider, Menu, IconButton, ActivityIndicator, Dialog, Portal, TextInput as PaperTextInput, SegmentedButtons } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getEquipmentById, getCategories, archiveEquipment, markBroken, clearBroken, deleteEquipment, addHours, setHours, getMeterReadings, updateEquipment, uploadEquipmentPhoto, deleteEquipmentPhoto } from '../../services/equipment';
import { getMaintenanceTasks, getMaintenanceStatus } from '../../services/maintenance';
import { getUserFarms } from '../../services/farms';
import { auth } from '../../services/firebase';
import { Equipment, Category, MaintenanceTask, MeterReading, MaintenanceStatus, Farm, UserRole } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../constants/equipment';
import EmptyState from '../../components/EmptyState';
import * as ImagePicker from 'expo-image-picker';
import { errorMessage } from '../../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'EquipmentDetail'>;

const READINGS_PAGE_SIZE = 20;

export default function EquipmentDetailScreen({ route, navigation }: Props) {
  const { equipmentId } = route.params;
  const { activeFarm } = useAuth();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [showAllReadings, setShowAllReadings] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [brokenDialogVisible, setBrokenDialogVisible] = useState(false);
  const [breakReason, setBreakReason] = useState('');
  const [hoursDialogVisible, setHoursDialogVisible] = useState(false);
  const [hoursInput, setHoursInput] = useState('');
  const [hoursMode, setHoursMode] = useState<'add' | 'set'>('add');
  const [moveDialogVisible, setMoveDialogVisible] = useState(false);
  const [otherFarms, setOtherFarms] = useState<{ farm: Farm; role: UserRole }[]>([]);
  const [moving, setMoving] = useState(false);
  const [readingsPage, setReadingsPage] = useState(1);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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
      const [t, r] = await Promise.all([
        getMaintenanceTasks(equipmentId),
        getMeterReadings(equipmentId),
      ]);
      setTasks(t);
      setReadings(r);
    }
    setLoading(false);
  }

  function canEdit() {
    return activeFarm?.role === 'owner';
  }

  async function handleArchive(status: 'archived' | 'sold') {
    const title = status === 'sold' ? 'Mark as Sold?' : 'Archive Equipment?';
    const actionLabel = status === 'sold' ? 'Mark as Sold' : 'Archive';
    Alert.alert(title, "This can be undone from the equipment's overflow menu.", [
      { text: 'Cancel', style: 'cancel' },
      { text: actionLabel, onPress: async () => { await archiveEquipment(equipmentId, status); navigation.goBack(); } },
    ]);
  }

  function handleMarkBroken() {
    setBreakReason('');
    setBrokenDialogVisible(true);
  }

  async function confirmBroken() {
    if (!breakReason.trim()) return;
    setBrokenDialogVisible(false);
    await markBroken(equipmentId, breakReason.trim());
    load();
  }

  async function confirmHours() {
    const h = parseFloat(hoursInput);
    if (isNaN(h) || h < 0) return;
    setHoursDialogVisible(false);
    if (hoursMode === 'add') await addHours(equipmentId, h);
    else await setHours(equipmentId, h);
    load();
  }

  async function handleOpenMove() {
    setMenuVisible(false);
    const uid = auth.currentUser?.uid;
    if (!uid || !activeFarm) return;
    const all = await getUserFarms(uid);
    setOtherFarms(all.filter(f => f.farm.id !== activeFarm.farmId));
    setMoveDialogVisible(true);
  }

  async function handleMoveTo(targetFarmId: string) {
    setMoving(true);
    try {
      await updateEquipment(equipmentId, { farmId: targetFarmId, categoryId: '' } as any);
      setMoveDialogVisible(false);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', errorMessage(e));
    } finally {
      setMoving(false);
    }
  }

  async function handleTakePhoto() {
    if (!activeFarm) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Camera access is needed.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 });
    if (result.canceled) return;
    await doUploadPhoto(result.assets[0].uri);
  }

  async function handlePickPhoto() {
    if (!activeFarm) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8, allowsMultipleSelection: true });
    if (result.canceled) return;
    for (const asset of result.assets) {
      await doUploadPhoto(asset.uri);
    }
  }

  async function handleDeletePhoto(photoUrl: string) {
    Alert.alert('Delete photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteEquipmentPhoto(equipmentId, photoUrl);
          load();
        } catch (e: any) {
          Alert.alert('Error deleting photo', errorMessage(e));
        }
      }},
    ]);
  }

  async function doUploadPhoto(uri: string) {
    if (!activeFarm) return;
    setUploadingPhoto(true);
    try {
      await uploadEquipmentPhoto(equipmentId, activeFarm.farmId, uri);
      load();
    } catch (e: any) {
      Alert.alert('Error uploading photo', errorMessage(e));
    } finally {
      setUploadingPhoto(false);
    }
  }

  const insets = useSafeAreaInsets();

  if (loading || !equipment) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;
  }

  const meterLabel = category?.meterLabel ?? 'hours';
  const meterUnit = meterLabel === 'miles' ? 'mi' : 'hrs';
  const meterTitle = meterLabel === 'miles' ? 'TOTAL MILES' : 'TOTAL HOURS';

  const overallStatus: MaintenanceStatus = equipment.broken
    ? 'broken'
    : tasks.filter(t => !t.archived).reduce<MaintenanceStatus>((acc, t) => {
        const s = getMaintenanceStatus(t, equipment.totalHours);
        if (s === 'overdue') return 'overdue';
        if (s === 'due_soon' && acc !== 'overdue') return 'due_soon';
        return acc;
      }, 'ok');

  // Pick the most informative custom fields for the summary (all of them, up to 6)
  const summaryFields = category?.defaultFields
    .filter(f => equipment.customFields?.[f.key])
    .slice(0, 6) ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={styles.name}>{equipment.name}</Text>
        {canEdit() && (
          <View style={styles.headerActions}>
            <IconButton icon="pencil-outline" size={22} onPress={() => navigation.navigate('EquipmentForm', { equipmentId })} />
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={<IconButton icon="dots-vertical" size={22} onPress={() => setMenuVisible(true)} />}
            >
              {equipment.status === 'active' ? (
                <>
                  <Menu.Item onPress={() => { setMenuVisible(false); handleArchive('archived'); }} title="Archive" />
                  <Menu.Item onPress={() => { setMenuVisible(false); handleArchive('sold'); }} title="Mark as Sold" />
                  <Menu.Item onPress={handleOpenMove} title="Move to Farm…" />
                  <Divider />
                  <Menu.Item
                    title="Delete…"
                    titleStyle={{ color: '#6b6b6b' }}
                    onPress={() => { setMenuVisible(false); Alert.alert('Archive First', 'Archive or mark as sold before deleting.'); }}
                  />
                </>
              ) : (
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
          </View>
        )}
      </View>

      {/* Photo gallery */}
      {(equipment.primaryImageUrl || (equipment.photos?.length ?? 0) > 0) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery} contentContainerStyle={styles.photoGalleryContent}>
          {equipment.primaryImageUrl && (
            <View style={styles.galleryPhotoWrap}>
              <Image source={{ uri: equipment.primaryImageUrl }} style={styles.galleryPhoto} />
            </View>
          )}
          {equipment.photos?.map((p, i) => (
            <View key={i} style={styles.galleryPhotoWrap}>
              <Image source={{ uri: p.url }} style={styles.galleryPhoto} />
              {canEdit() && equipment.status === 'active' && (
                <TouchableOpacity style={styles.photoDeleteBtn} onPress={() => handleDeletePhoto(p.url)}>
                  <Text style={styles.photoDeleteText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}
      {canEdit() && equipment.status === 'active' && (
        <View style={styles.photoButtonRow}>
          <Button icon="camera" mode="outlined" compact style={styles.photoBtn} onPress={handleTakePhoto} loading={uploadingPhoto} disabled={uploadingPhoto}>
            Camera
          </Button>
          <Button icon="image-plus" mode="outlined" compact style={styles.photoBtn} onPress={handlePickPhoto} loading={uploadingPhoto} disabled={uploadingPhoto}>
            Library
          </Button>
        </View>
      )}

      {/* Summary */}
      <Card style={[styles.card, styles.heroCard]}>
        <Card.Content>
          {/* Hours + Maintenance — full-width row */}
          <View style={styles.statRowWide}>
            <View style={styles.statHoursSide}>
              <Text style={styles.statLabel}>{meterTitle}</Text>
              <Text style={styles.statHoursValue}>{equipment.totalHours ?? 0}</Text>
              <Text
                style={styles.statUpdateLink}
                onPress={() => { setHoursInput(''); setHoursDialogVisible(true); }}
              >
                {meterLabel === 'miles' ? 'Update Odometer' : 'Update Hours'}
              </Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statMaintSide}>
              <Text style={styles.statLabel}>MAINTENANCE</Text>
              <Text style={[styles.statMaintenanceValue, { color: STATUS_COLORS[overallStatus] }]}>
                {STATUS_LABELS[overallStatus]}
              </Text>
              {equipment.broken && equipment.breakReason
                ? <Text style={styles.statNote}>{equipment.breakReason}</Text>
                : null}
            </View>
          </View>

          {/* Category fields + location — 2-column grid */}
          {(summaryFields.length > 0 || equipment.location) && (
            <View style={styles.summaryGrid}>
              {summaryFields.map(field => (
                <View key={field.key} style={styles.statTile}>
                  <Text style={styles.statLabel}>{field.label.toUpperCase()}</Text>
                  <Text style={styles.statValue}>{equipment.customFields[field.key]}</Text>
                </View>
              ))}
              {equipment.location ? (
                <View style={styles.statTile}>
                  <Text style={styles.statLabel}>LOCATION</Text>
                  <Text style={styles.statValue}>{equipment.location}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Broken status banner */}
          {(equipment.status !== 'active' || equipment.broken) && (
            <View style={[styles.statusBanner, equipment.broken ? styles.statusBannerBroken : styles.statusBannerArchived]}>
              <Text variant="labelMedium" style={{ color: equipment.broken ? '#7b1fa2' : '#6b6b6b' }}>
                {equipment.broken ? 'BROKEN' : equipment.status.toUpperCase()}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Details</Text>
          <DetailRow label="Category" value={category?.name ?? '-'} />
          <DetailRow label="Brand" value={equipment.brand} />
          <DetailRow label="Model" value={equipment.model} />
          <DetailRow label="Serial #" value={equipment.serialNumber} />
          {equipment.purchaseLocation ? <DetailRow label="Purchase Location" value={equipment.purchaseLocation} /> : null}
          {equipment.purchaseDate ? <DetailRow label="Purchase Date" value={new Date(equipment.purchaseDate + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} /> : null}
          {equipment.description ? <DetailRow label="Description" value={equipment.description} /> : null}
          {equipment.manufacturerUrl ? <DetailRow label="Manufacturer URL" value={equipment.manufacturerUrl} /> : null}
        </Card.Content>
      </Card>

      {/* Hours history */}
      {readings.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {meterLabel === 'miles' ? 'Mileage History' : 'Hours History'} ({readings.length})
              </Text>
              <Button compact icon={showAllReadings ? 'chevron-up' : 'chevron-down'}
                onPress={() => { setShowAllReadings(v => !v); setReadingsPage(1); }}>
                {showAllReadings ? 'Hide' : 'Show'}
              </Button>
            </View>
            {showAllReadings && (
              <>
                {readings.slice(0, readingsPage * READINGS_PAGE_SIZE).map((r) => (
                  <View key={r.id} style={styles.readingRow}>
                    <Text variant="bodySmall" style={styles.readingDate}>
                      {r.recordedAt.toDate().toLocaleDateString()}
                    </Text>
                    <Text variant="bodyMedium" style={styles.readingHours}>{r.hours} {meterUnit}</Text>
                  </View>
                ))}
                {readings.length > readingsPage * READINGS_PAGE_SIZE && (
                  <Button compact onPress={() => setReadingsPage(p => p + 1)} style={{ marginTop: 8 }}>
                    Load more ({readings.length - readingsPage * READINGS_PAGE_SIZE} remaining)
                  </Button>
                )}
              </>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Extra custom fields not shown in summary (beyond the first 6) */}
      {(category?.defaultFields.filter(f => equipment.customFields?.[f.key]).length ?? 0) > 6 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>More Specifications</Text>
            {category!.defaultFields.slice(6).filter(f => equipment.customFields?.[f.key]).map(f => (
              <DetailRow key={f.key} label={f.label} value={equipment.customFields[f.key]} />
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Maintenance */}
      <Card style={[styles.card, styles.maintCard]}>
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
          {tasks.length === 0 && (
            <EmptyState
              icon="wrench-clock"
              title="No maintenance tasks"
              subtitle="Tap Maintenance to set up recurring and one-off tasks."
              style={{ paddingVertical: 16 }}
            />
          )}
        </Card.Content>
      </Card>

      {/* Action buttons */}
      <View style={styles.actions}>
        {equipment.status === 'active' && (
          <>
            <Button mode="contained" icon="wrench" onPress={() => navigation.navigate('MaintenanceSchedule', { equipmentId })} style={styles.actionBtn}>
              Maintenance
            </Button>
            <Button mode="outlined" icon="clipboard-check" onPress={() => navigation.navigate('InspectionChecklist', { equipmentId })} style={styles.actionBtn}>
              Inspection
            </Button>
          </>
        )}
        <Button mode="outlined" icon="history" onPress={() => navigation.navigate('MaintenanceHistory', { equipmentId })} style={styles.actionBtn}>
          History
        </Button>
        {canEdit() && equipment.status === 'active' && (
          <>
            <Divider style={styles.actionDivider} />
            {equipment.broken
              ? <Button mode="text" icon="wrench-check" onPress={() => clearBroken(equipmentId).then(load)} style={styles.actionBtn} textColor="#7b1fa2">
                  Mark as Fixed
                </Button>
              : <Button mode="text" icon="alert-outline" onPress={handleMarkBroken} style={styles.actionBtn} textColor="#7b1fa2">
                  Report Breakdown
                </Button>
            }
          </>
        )}
      </View>
      <Portal>
        <Dialog visible={hoursDialogVisible} onDismiss={() => setHoursDialogVisible(false)}>
          <Dialog.Title>{meterLabel === 'miles' ? 'Update Mileage' : 'Update Hours'}</Dialog.Title>
          <Dialog.Content>
            <SegmentedButtons
              value={hoursMode}
              onValueChange={v => setHoursMode(v as 'add' | 'set')}
              buttons={[
                { value: 'add', label: meterLabel === 'miles' ? 'Add miles' : 'Add hours' },
                { value: 'set', label: 'Set total' },
              ]}
              style={{ marginBottom: 12 }}
            />
            <PaperTextInput
              label={hoursMode === 'add'
                ? (meterLabel === 'miles' ? 'Miles to add' : 'Hours to add')
                : (meterLabel === 'miles' ? 'New odometer reading' : 'New total hours')}
              value={hoursInput}
              onChangeText={setHoursInput}
              mode="outlined"
              keyboardType="numeric"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setHoursDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmHours} disabled={!hoursInput || isNaN(parseFloat(hoursInput))}>Save</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={brokenDialogVisible} onDismiss={() => setBrokenDialogVisible(false)}>
          <Dialog.Title>Mark as Broken</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="What's wrong? *"
              value={breakReason}
              onChangeText={setBreakReason}
              mode="outlined"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setBrokenDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmBroken} disabled={!breakReason.trim()}>Mark Broken</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={moveDialogVisible} onDismiss={() => setMoveDialogVisible(false)}>
          <Dialog.Title>Move to Farm</Dialog.Title>
          <Dialog.Content>
            {otherFarms.length === 0 ? (
              <Text variant="bodyMedium">You have no other farms to move this equipment to.</Text>
            ) : (
              <>
                <Text variant="bodySmall" style={{ color: '#6b6b6b', marginBottom: 12 }}>
                  Equipment moves with its full maintenance history. You'll need to assign a category in the new farm.
                </Text>
                {otherFarms.map(({ farm }) => (
                  <Button
                    key={farm.id}
                    mode="outlined"
                    onPress={() => handleMoveTo(farm.id)}
                    loading={moving}
                    style={{ marginBottom: 8 }}
                  >
                    {farm.name}
                  </Button>
                ))}
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMoveDialogVisible(false)}>Cancel</Button>
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
  container: { flex: 1, backgroundColor: '#f5f2ee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 16, paddingRight: 4, paddingVertical: 8 },
  name: { fontWeight: 'bold', flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  photoGallery: { marginBottom: 0 },
  photoGalleryContent: { paddingHorizontal: 16, gap: 8 },
  galleryPhotoWrap: { position: 'relative' },
  galleryPhoto: { width: 200, height: 150, borderRadius: 8, resizeMode: 'cover' },
  photoDeleteBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  photoDeleteText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  photoButtonRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 8 },
  photoBtn: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  chip: { marginRight: 8 },
  chipBroken: { backgroundColor: '#7b1fa2' },
  breakReason: { color: '#7b1fa2', flex: 1 },
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 8 },
  // Summary
  statRowWide: { flexDirection: 'row', backgroundColor: '#faf9f7', borderRadius: 8, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#2e7d32' },
  statHoursSide: { flex: 1 },
  statMaintSide: { flex: 1 },
  statSeparator: { width: StyleSheet.hairlineWidth, backgroundColor: '#e8e4df', marginHorizontal: 14 },
  statLabel: { fontSize: 12, color: '#6b6b6b', letterSpacing: 0.8, marginBottom: 4, fontFamily: 'Barlow_600SemiBold' },
  statHoursValue: { fontSize: 36, fontFamily: 'BarlowCondensed_700Bold', fontWeight: '700', color: '#2e7d32', lineHeight: 40, letterSpacing: -0.5 },
  statUpdateLink: { fontSize: 12, color: '#2e7d32', fontFamily: 'Barlow_600SemiBold', fontWeight: '600', marginTop: 6 },
  statMaintenanceValue: { fontSize: 16, fontFamily: 'BarlowCondensed_700Bold', fontWeight: '700', marginTop: 2 },
  statNote: { color: '#6b6b6b', marginTop: 4, fontSize: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  statTile: { flexBasis: '47%', flexGrow: 1, backgroundColor: '#faf9f7', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: '#e8e4df' },
  statValue: { fontSize: 14, color: '#1a1a18', fontFamily: 'Barlow_600SemiBold', fontWeight: '600', marginTop: 2 },
  statusBanner: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, alignSelf: 'flex-start' },
  statusBannerBroken: { backgroundColor: '#f3e5f5' },
  statusBannerArchived: { backgroundColor: '#ede9e3' },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8, color: '#2e7d32' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, flex: 1 },
  readingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e8e4df' },
  readingDate: { color: '#6b6b6b' },
  readingHours: { fontWeight: '500' },
  detailLabel: { color: '#6b6b6b', flex: 1 },
  detailValue: { flex: 2, textAlign: 'right' },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  taskName: { flex: 1 },
  empty: { color: '#6b6b6b', textAlign: 'center', padding: 8 },
  actions: { padding: 16, gap: 8 },
  actionBtn: { marginBottom: 4 },
  actionDivider: { marginTop: 8, marginBottom: 4 },
  heroCard: { marginBottom: 20 },
  maintCard: { marginTop: 8 },
});
