import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Divider, IconButton, Chip, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/equipment';
import { Category, CategoryField } from '../../types';

type FieldType = 'text' | 'number' | 'select';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
];

export default function CategorySettingsScreen() {
  const { activeFarm } = useAuth();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New category form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');

  // Field editor state (used for both new and existing categories)
  const [editFields, setEditFields] = useState<Record<string, CategoryField[]>>({});
  const [newFieldLabel, setNewFieldLabel] = useState<Record<string, string>>({});
  const [newFieldType, setNewFieldType] = useState<Record<string, FieldType>>({});
  const [newFieldOptions, setNewFieldOptions] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!activeFarm) return;
    const cats = await getCategories(activeFarm.farmId);
    setCategories(cats.sort((a, b) => {
      if (a.builtIn && !b.builtIn) return -1;
      if (!a.builtIn && b.builtIn) return 1;
      return a.name.localeCompare(b.name);
    }));
    setLoading(false);
  }

  function startEdit(cat: Category) {
    setExpandedId(expandedId === cat.id ? null : cat.id);
    setEditFields(prev => ({ ...prev, [cat.id]: [...cat.defaultFields] }));
    setNewFieldLabel(prev => ({ ...prev, [cat.id]: '' }));
    setNewFieldType(prev => ({ ...prev, [cat.id]: 'text' }));
    setNewFieldOptions(prev => ({ ...prev, [cat.id]: '' }));
  }

  function addFieldToEdit(catId: string) {
    const label = newFieldLabel[catId]?.trim();
    if (!label) return;
    const key = label.toLowerCase().replace(/\s+/g, '_');
    const type = newFieldType[catId] ?? 'text';
    const field: CategoryField = { key, label, type };
    if (type === 'select') {
      field.options = (newFieldOptions[catId] ?? '').split(',').map(s => s.trim()).filter(Boolean);
    }
    setEditFields(prev => ({ ...prev, [catId]: [...(prev[catId] ?? []), field] }));
    setNewFieldLabel(prev => ({ ...prev, [catId]: '' }));
    setNewFieldOptions(prev => ({ ...prev, [catId]: '' }));
  }

  function removeField(catId: string, idx: number) {
    setEditFields(prev => ({ ...prev, [catId]: prev[catId].filter((_, i) => i !== idx) }));
  }

  async function saveCategory(cat: Category) {
    setSaving(cat.id);
    try {
      await updateCategory(cat.id, { defaultFields: editFields[cat.id] ?? [] });
      setExpandedId(null);
      load();
    } finally {
      setSaving(null);
    }
  }

  async function handleCreate() {
    if (!newName.trim() || !activeFarm) return;
    await createCategory(activeFarm.farmId, newName.trim());
    setNewName('');
    setShowNewForm(false);
    load();
  }

  async function handleDelete(cat: Category) {
    Alert.alert('Delete Category', `Delete "${cat.name}"? Equipment using this category will keep their data.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteCategory(cat.id); load(); } },
    ]);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      <Text variant="bodyMedium" style={styles.hint}>
        Built-in categories can have fields added. Custom categories can be renamed or deleted.
      </Text>

      {/* New category */}
      <Button icon="plus" mode="outlined" onPress={() => setShowNewForm(v => !v)} style={styles.newBtn}>
        New Category
      </Button>
      {showNewForm && (
        <Card style={styles.card}>
          <Card.Content>
            <TextInput label="Category name *" value={newName} onChangeText={setNewName} mode="outlined" style={styles.input} />
            <View style={styles.row}>
              <Button onPress={() => setShowNewForm(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleCreate} disabled={!newName.trim()}>Create</Button>
            </View>
          </Card.Content>
        </Card>
      )}

      <Divider style={styles.divider} />

      {categories.map(cat => {
        const isExpanded = expandedId === cat.id;
        const fields = isExpanded ? (editFields[cat.id] ?? cat.defaultFields) : cat.defaultFields;

        return (
          <Card key={cat.id} style={styles.card}>
            <Card.Content>
              <View style={styles.catHeader}>
                <View style={styles.flex}>
                  <Text variant="titleSmall" style={styles.catName}>{cat.name}</Text>
                  {cat.builtIn && <Text variant="bodySmall" style={styles.builtIn}>Built-in</Text>}
                </View>
                <IconButton icon={isExpanded ? 'chevron-up' : 'pencil-outline'} size={20} onPress={() => startEdit(cat)} />
                {!cat.builtIn && (
                  <IconButton icon="trash-can-outline" size={20} onPress={() => handleDelete(cat)} />
                )}
              </View>

              {/* Field list */}
              {fields.length > 0 && !isExpanded && (
                <View style={styles.fieldChips}>
                  {fields.map(f => <Chip key={f.key} compact style={styles.chip}>{f.label}</Chip>)}
                </View>
              )}

              {/* Edit mode */}
              {isExpanded && (
                <>
                  <Divider style={styles.divider} />
                  <Text variant="labelMedium" style={styles.sectionLabel}>Fields</Text>
                  {(editFields[cat.id] ?? []).map((f, i) => (
                    <View key={f.key} style={styles.fieldRow}>
                      <Text variant="bodyMedium" style={styles.flex}>{f.label}</Text>
                      <Text variant="bodySmall" style={styles.fieldType}>{f.type}</Text>
                      <IconButton icon="close" size={16} onPress={() => removeField(cat.id, i)} />
                    </View>
                  ))}

                  <Divider style={styles.miniDivider} />
                  <Text variant="labelSmall" style={styles.sectionLabel}>Add field</Text>
                  <TextInput
                    label="Field label"
                    value={newFieldLabel[cat.id] ?? ''}
                    onChangeText={v => setNewFieldLabel(prev => ({ ...prev, [cat.id]: v }))}
                    mode="outlined"
                    style={styles.input}
                  />
                  <SegmentedButtons
                    value={newFieldType[cat.id] ?? 'text'}
                    onValueChange={v => setNewFieldType(prev => ({ ...prev, [cat.id]: v as FieldType }))}
                    buttons={FIELD_TYPES}
                    style={styles.segmented}
                  />
                  {(newFieldType[cat.id] ?? 'text') === 'select' && (
                    <TextInput
                      label="Options (comma separated)"
                      value={newFieldOptions[cat.id] ?? ''}
                      onChangeText={v => setNewFieldOptions(prev => ({ ...prev, [cat.id]: v }))}
                      mode="outlined"
                      style={styles.input}
                    />
                  )}
                  <Button mode="outlined" compact onPress={() => addFieldToEdit(cat.id)} style={styles.addFieldBtn}
                    disabled={!newFieldLabel[cat.id]?.trim()}>
                    Add Field
                  </Button>

                  <View style={styles.row}>
                    <Button onPress={() => setExpandedId(null)}>Cancel</Button>
                    <Button mode="contained" onPress={() => saveCategory(cat)} loading={saving === cat.id}>Save</Button>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ee', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: { color: '#6b6b6b', marginBottom: 12 },
  newBtn: { marginBottom: 8 },
  card: { marginBottom: 8, borderRadius: 8 },
  catHeader: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  catName: { fontWeight: 'bold' },
  builtIn: { color: '#6b6b6b', fontSize: 12 },
  fieldChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: { backgroundColor: '#e8f5e9' },
  divider: { marginVertical: 12 },
  miniDivider: { marginVertical: 8 },
  sectionLabel: { color: '#6b6b6b', marginBottom: 6 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  fieldType: { color: '#6b6b6b', marginRight: 4 },
  input: { marginBottom: 8 },
  segmented: { marginBottom: 8 },
  addFieldBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
