import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Chip, Divider, ActivityIndicator, IconButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { logEquipmentUsage, getTaskEquipmentLogs } from '../../services/projects';
import { getEquipment } from '../../services/equipment';
import { getUserFarms } from '../../services/farms';
import { Equipment, TaskEquipmentLog } from '../../types';
import { auth } from '../../services/firebase';
import { errorMessage } from '../../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskForm'>;

export default function TaskFormScreen({ route, navigation }: Props) {
  const { projectId, taskId } = route.params;
  const { activeFarm } = useAuth();
  const [allEquipment, setAllEquipment] = useState<{ equipment: Equipment; farmName: string }[]>([]);
  const [existingLogs, setExistingLogs] = useState<TaskEquipmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEquipId, setSelectedEquipId] = useState('');
  const [selectedEquipFarmId, setSelectedEquipFarmId] = useState('');
  const [hours, setHours] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const user = auth.currentUser;
    if (!user) return;

    // Load equipment from all farms the user belongs to
    const farms = await getUserFarms(user.uid);
    const equipmentByFarm = await Promise.all(
      farms.map(async ({ farm, role }) => {
        const eq = await getEquipment(farm.id);
        return eq.map(e => ({ equipment: e, farmName: farm.name }));
      })
    );
    setAllEquipment(equipmentByFarm.flat());

    if (taskId) {
      const logs = await getTaskEquipmentLogs(taskId);
      setExistingLogs(logs);
    }

    setLoading(false);
  }

  async function handleLog() {
    if (!selectedEquipId || !hours || !taskId) {
      Alert.alert('Select equipment and enter hours');
      return;
    }
    setSaving(true);
    try {
      await logEquipmentUsage(taskId, projectId, selectedEquipId, selectedEquipFarmId, parseFloat(hours));
      const logs = await getTaskEquipmentLogs(taskId);
      setExistingLogs(logs);
      setSelectedEquipId('');
      setHours('');
    } catch (e: any) {
      Alert.alert('Error', errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const filtered = allEquipment.filter(({ equipment: e }) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.brand.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>Log Equipment Usage</Text>

      {existingLogs.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="labelMedium" style={styles.sectionLabel}>Already Logged</Text>
            {existingLogs.map((log) => {
              const eq = allEquipment.find(a => a.equipment.id === log.equipmentId);
              return (
                <View key={log.id} style={styles.logRow}>
                  <Text variant="bodyMedium" style={styles.flex}>{eq?.equipment.name ?? log.equipmentId}</Text>
                  <Chip compact>{log.hours} hrs</Chip>
                </View>
              );
            })}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="labelMedium" style={styles.sectionLabel}>Select Equipment</Text>
          <TextInput
            placeholder="Search..."
            value={search}
            onChangeText={setSearch}
            mode="outlined"
            style={styles.search}
            left={<TextInput.Icon icon="magnify" />}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.equipment.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Card
                style={[styles.equipCard, selectedEquipId === item.equipment.id && styles.selectedCard]}
                onPress={() => { setSelectedEquipId(item.equipment.id); setSelectedEquipFarmId(item.equipment.farmId); }}
              >
                <Card.Content style={styles.equipRow}>
                  <View style={styles.flex}>
                    <Text variant="bodyMedium">{item.equipment.name}</Text>
                    <Text variant="bodySmall" style={styles.farmLabel}>{item.farmName} · {item.equipment.totalHours} hrs</Text>
                  </View>
                  {selectedEquipId === item.equipment.id && (
                    <Chip compact style={styles.selectedChip}>Selected</Chip>
                  )}
                </Card.Content>
              </Card>
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Hours used *"
            value={hours}
            onChangeText={setHours}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          <Button mode="contained" onPress={handleLog} loading={saving} icon="tractor">
            Log Usage
          </Button>
        </Card.Content>
      </Card>

      <Button onPress={() => navigation.goBack()} style={styles.doneBtn}>Done</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ee', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: 'bold', color: '#2e7d32', marginBottom: 12 },
  card: { marginBottom: 12, borderRadius: 8 },
  sectionLabel: { color: '#666', marginBottom: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  flex: { flex: 1 },
  search: { marginBottom: 8 },
  equipCard: { marginBottom: 4, borderRadius: 6 },
  selectedCard: { borderColor: '#2e7d32', borderWidth: 2 },
  equipRow: { flexDirection: 'row', alignItems: 'center' },
  farmLabel: { color: '#6b6b6b' },
  selectedChip: { backgroundColor: '#e8f5e9' },
  input: { marginBottom: 12 },
  doneBtn: { marginTop: 4 },
});
