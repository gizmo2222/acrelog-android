import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Card, FAB, SegmentedButtons, ActivityIndicator, Dialog, Portal, TextInput, Button, ProgressBar } from 'react-native-paper';
import EmptyState from '../../components/EmptyState';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Timestamp } from 'firebase/firestore';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getProjects, getTasksForProjects, createProject } from '../../services/projects';
import DatePickerField from '../../components/DatePickerField';
import { Project } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface ProjectSummary {
  project: Project;
  taskCount: number;
  completedCount: number;
}

function toISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function ProjectListScreen() {
  const navigation = useNavigation<Nav>();
  const { activeFarm } = useAuth();
  const insets = useSafeAreaInsets();
  const [summaries, setSummaries] = useState<ProjectSummary[]>([]);
  const [filter, setFilter] = useState<'active' | 'completed' | 'archived'>('active');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!activeFarm) return;
      loadProjects();
    }, [activeFarm])
  );

  async function loadProjects() {
    if (!activeFarm) return;
    setLoading(true);
    try {
      const projects = await getProjects(activeFarm.farmId);
      const allTasks = await getTasksForProjects(projects.map(p => p.id));
      const tasksByProject = allTasks.reduce<Record<string, typeof allTasks>>((acc, t) => {
        (acc[t.projectId] = acc[t.projectId] ?? []).push(t);
        return acc;
      }, {});
      const results = projects.map(project => {
        const tasks = tasksByProject[project.id] ?? [];
        return {
          project,
          taskCount: tasks.length,
          completedCount: tasks.filter(t => t.status === 'completed').length,
        };
      });
      setSummaries(results);
    } catch (e: any) {
      console.error('Projects load error:', e.message);
      Alert.alert('Could not load projects', e.message ?? 'Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim() || !activeFarm) return;
    setCreating(true);
    try {
      const dueDate = newDueDate ? new Date(newDueDate + 'T00:00:00') : undefined;
      const p = await createProject(activeFarm.farmId, newName.trim(), dueDate);
      setShowDialog(false);
      setNewName('');
      setNewDueDate('');
      navigation.navigate('ProjectDetail', { projectId: p.id });
    } finally {
      setCreating(false);
    }
  }

  function isOverdue(project: Project) {
    if (!project.dueDate) return false;
    return project.dueDate.toMillis() < Date.now();
  }

  const filtered = summaries.filter(s => s.project.status === filter);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Projects</Text>

      <SegmentedButtons
        value={filter}
        onValueChange={(v) => setFilter(v as any)}
        buttons={[
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'archived', label: 'Archived' },
        ]}
        style={styles.segment}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.project.id}
        renderItem={({ item }) => {
          const overdue = isOverdue(item.project);
          const progress = item.taskCount > 0 ? item.completedCount / item.taskCount : 0;
          return (
            <Card style={styles.card} onPress={() => navigation.navigate('ProjectDetail', { projectId: item.project.id })}>
              <Card.Content>
                <Text variant="titleMedium">{item.project.name}</Text>
                <View style={styles.metaRow}>
                  <Text variant="bodySmall" style={styles.date}>
                    {item.taskCount === 0
                      ? 'No tasks yet'
                      : `${item.completedCount} done · ${item.taskCount - item.completedCount} remaining`}
                  </Text>
                  {item.project.dueDate && (
                    <Text variant="bodySmall" style={[styles.dueLabel, overdue && styles.overdueLabel]}>
                      {overdue ? 'Overdue · ' : 'Due '}
                      {item.project.dueDate.toDate().toLocaleDateString()}
                    </Text>
                  )}
                </View>
                {item.taskCount > 0 && (
                  <View style={styles.progressRow}>
                    <ProgressBar
                      progress={progress}
                      color="#2e7d32"
                      style={styles.progressBar}
                    />
                    <Text variant="bodySmall" style={styles.progressText}>
                      {item.completedCount}/{item.taskCount}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-list-outline"
            title={filter === 'active' ? 'No active projects' : filter === 'completed' ? 'No completed projects' : 'No archived projects'}
            subtitle={filter === 'active' ? 'Tap + to start your first project.' : undefined}
          />
        }
        contentContainerStyle={[styles.list, { paddingBottom: 80 + insets.bottom }]}
      />

      {activeFarm?.role !== 'auditor' && (
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: 16 + insets.bottom }]}
          onPress={() => { setNewName(''); setNewDueDate(''); setShowDialog(true); }}
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
              style={styles.dialogInput}
            />
            <DatePickerField
              label="Due date"
              value={newDueDate}
              onChange={setNewDueDate}
              optional
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
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  date: { color: '#6b6b6b' },
  dueLabel: { color: '#6b6b6b' },
  overdueLabel: { color: '#c62828', fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3 },
  progressText: { color: '#6b6b6b', minWidth: 32, textAlign: 'right' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2e7d32' },
  dialogInput: { marginBottom: 12 },
});
