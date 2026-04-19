import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Card, Button, Checkbox, TextInput, FAB, Divider, ActivityIndicator, IconButton } from 'react-native-paper';
import EmptyState from '../../components/EmptyState';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getEquipmentById } from '../../services/equipment';
import {
  getInspectionChecklists, createInspectionChecklist, logInspection,
} from '../../services/maintenance';
import { Equipment, InspectionChecklist, InspectionItem } from '../../types';
import { auth } from '../../services/firebase';
import { Timestamp } from 'firebase/firestore';
import { errorMessage } from '../../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'InspectionChecklist'>;

export default function InspectionChecklistScreen({ route, navigation }: Props) {
  const { equipmentId } = route.params;
  const { activeFarm } = useAuth();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [checklists, setChecklists] = useState<InspectionChecklist[]>([]);
  const [activeChecklist, setActiveChecklist] = useState<InspectionChecklist | null>(null);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newItems, setNewItems] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [eq, cl] = await Promise.all([getEquipmentById(equipmentId), getInspectionChecklists(equipmentId)]);
      setEquipment(eq);
      setChecklists(cl);
      if (cl.length > 0) setActiveChecklist(cl[0]);
      setLoading(false);
    })();
  }, []);

  function toggleItem(itemId: string) {
    setResults(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  }

  async function handleSubmit() {
    if (!activeChecklist || !auth.currentUser) return;
    setSaving(true);
    try {
      await logInspection({
        checklistId: activeChecklist.id,
        equipmentId,
        completedAt: Timestamp.now(),
        userId: auth.currentUser.uid,
        results,
        notes,
        signedBy: auth.currentUser.uid,
      });
      Alert.alert('Inspection logged', 'Inspection has been recorded.');
      setResults({});
      setNotes('');
    } catch (e: any) {
      Alert.alert('Could not save inspection', errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateChecklist() {
    if (!newName || newItems.filter(Boolean).length === 0) return;
    const items: InspectionItem[] = newItems.filter(Boolean).map((label, i) => ({
      id: `item_${i}`,
      label,
      required: true,
    }));
    const cl = await createInspectionChecklist({ equipmentId, name: newName, items });
    setChecklists(prev => [...prev, cl]);
    setActiveChecklist(cl);
    setShowCreateForm(false);
    setNewName('');
    setNewItems(['']);
  }

  const insets = useSafeAreaInsets();

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      <Text variant="titleMedium" style={styles.title}>{equipment?.name} — Inspection</Text>

      {/* Checklist selector */}
      {checklists.length > 1 && (
        <ScrollView horizontal style={styles.selectorRow} showsHorizontalScrollIndicator={false}>
          {checklists.map((cl) => (
            <Button
              key={cl.id}
              mode={activeChecklist?.id === cl.id ? 'contained' : 'outlined'}
              onPress={() => { setActiveChecklist(cl); setResults({}); }}
              compact
              style={styles.selectorBtn}
            >
              {cl.name}
            </Button>
          ))}
        </ScrollView>
      )}

      {/* Active checklist */}
      {activeChecklist ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.checklistName}>{activeChecklist.name}</Text>
            {activeChecklist.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Checkbox
                  status={results[item.id] ? 'checked' : 'unchecked'}
                  onPress={() => toggleItem(item.id)}
                />
                <Text variant="bodyMedium" style={styles.itemLabel}>{item.label}</Text>
              </View>
            ))}
            <Divider style={styles.divider} />
            <TextInput
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
            <Button mode="contained" onPress={handleSubmit} loading={saving} icon="clipboard-check">
              Submit Inspection
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <EmptyState
          icon="clipboard-check-outline"
          title="No inspection checklists yet"
          subtitle={activeFarm?.role === 'owner' ? 'Create a checklist template using the form below.' : 'Ask your farm owner to create an inspection checklist.'}
        />
      )}

      {/* Create new checklist */}
      {activeFarm?.role === 'owner' && (
        <>
          <Button
            icon="plus"
            mode="outlined"
            onPress={() => setShowCreateForm(!showCreateForm)}
            style={styles.createBtn}
          >
            New Checklist
          </Button>

          {showCreateForm && (
            <Card style={styles.card}>
              <Card.Content>
                <TextInput label="Checklist Name" value={newName} onChangeText={setNewName} mode="outlined" style={styles.input} />
                <Text variant="labelMedium" style={styles.itemsLabel}>Items</Text>
                {newItems.map((item, i) => (
                  <View key={i} style={styles.newItemRow}>
                    <TextInput
                      value={item}
                      onChangeText={(v) => setNewItems(prev => prev.map((p, j) => j === i ? v : p))}
                      mode="outlined"
                      style={[styles.input, styles.flex]}
                      placeholder={`Item ${i + 1}`}
                    />
                    <IconButton icon="close" size={16} onPress={() => setNewItems(prev => prev.filter((_, j) => j !== i))} />
                  </View>
                ))}
                <Button compact onPress={() => setNewItems(prev => [...prev, ''])}>Add Item</Button>
                <View style={styles.formRow}>
                  <Button onPress={() => setShowCreateForm(false)}>Cancel</Button>
                  <Button mode="contained" onPress={handleCreateChecklist}>Create</Button>
                </View>
              </Card.Content>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { padding: 16, fontWeight: 'bold', color: '#2e7d32' },
  selectorRow: { paddingHorizontal: 16, marginBottom: 8 },
  selectorBtn: { marginRight: 8 },
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 8 },
  checklistName: { fontWeight: 'bold', marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  itemLabel: { flex: 1 },
  divider: { marginVertical: 12 },
  input: { marginBottom: 12 },
  empty: { textAlign: 'center', color: '#6b6b6b', padding: 32 },
  createBtn: { marginHorizontal: 16, marginBottom: 12 },
  itemsLabel: { color: '#6b6b6b', marginBottom: 4 },
  newItemRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  formRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
