import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Card, FAB, SegmentedButtons, ActivityIndicator, Dialog, Portal, TextInput, Button } from 'react-native-paper';
import EmptyState from '../../components/EmptyState';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getProjects, createProject } from '../../services/projects';
import { Project } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProjectListScreen() {
  const navigation = useNavigation<Nav>();
  const { activeFarm } = useAuth();
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!activeFarm) return;
      getProjects(activeFarm.farmId)
        .then(p => { setProjects(p); setLoading(false); })
        .catch(e => { console.error('Projects load error:', e.message); setLoading(false); });
    }, [activeFarm])
  );

  async function handleCreate() {
    if (!newName.trim() || !activeFarm) return;
    setCreating(true);
    try {
      const p = await createProject(activeFarm.farmId, newName.trim());
      setShowDialog(false);
      setNewName('');
      navigation.navigate('ProjectDetail', { projectId: p.id });
    } finally {
      setCreating(false);
    }
  }

  const filtered = projects.filter(p => p.status === filter);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Projects</Text>

      <SegmentedButtons
        value={filter}
        onValueChange={(v) => setFilter(v as any)}
        buttons={[
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
        ]}
        style={styles.segment}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}>
            <Card.Content>
              <Text variant="titleMedium">{item.name}</Text>
              <Text variant="bodySmall" style={styles.date}>
                Created {item.createdAt.toDate().toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-list-outline"
            title={filter === 'active' ? 'No active projects' : 'No archived projects'}
            subtitle={filter === 'active' ? 'Tap + to start your first project.' : undefined}
          />
        }
        contentContainerStyle={[styles.list, { paddingBottom: 80 + insets.bottom }]}
      />

      {activeFarm?.role !== 'auditor' && (
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: 16 + insets.bottom }]}
          onPress={() => { setNewName(''); setShowDialog(true); }}
        />
      )}

      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
          <Dialog.Title>New Project</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Project name"
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
              autoFocus
              onSubmitEditing={handleCreate}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancel</Button>
            <Button onPress={handleCreate} loading={creating} disabled={!newName.trim() || creating}>
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { padding: 16, fontWeight: 'bold', color: '#2e7d32' },
  segment: { marginHorizontal: 16, marginBottom: 8 },
  list: { paddingBottom: 16 },
  card: { marginHorizontal: 16, marginBottom: 8, borderRadius: 8 },
  date: { color: '#6b6b6b', marginTop: 2 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2e7d32' },
});
