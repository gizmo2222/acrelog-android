import React, { useState, useCallback } from 'react';
import { View, FlatList, SectionList, StyleSheet, Alert } from 'react-native';
import { Text, Card, FAB, Chip, IconButton, TextInput, Button, Divider, Menu, ActivityIndicator } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import {
  getTasks, createTask, completeTask, reopenTask, updateProjectStatus,
  getTaskEquipmentLogs,
} from '../../services/projects';
import { Task, TaskEquipmentLog } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProjectDetail'>;

export default function ProjectDetailScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const { activeFarm } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskName, setNewTaskName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [equipmentLogs, setEquipmentLogs] = useState<Record<string, TaskEquipmentLog[]>>({});

  useFocusEffect(useCallback(() => { load(); }, [projectId]));

  async function load() {
    setLoading(true);
    const t = await getTasks(projectId);
    setTasks(t);

    // Load equipment logs for all tasks
    const logs: Record<string, TaskEquipmentLog[]> = {};
    await Promise.all(
      t.map(async (task) => {
        const l = await getTaskEquipmentLogs(task.id);
        if (l.length > 0) logs[task.id] = l;
      })
    );
    setEquipmentLogs(logs);
    setLoading(false);
  }

  async function handleAddTask() {
    if (!newTaskName.trim()) return;
    await createTask(projectId, newTaskName.trim());
    setNewTaskName('');
    load();
  }

  async function handleComplete(taskId: string) {
    await completeTask(taskId);
    load();
  }

  async function handleReopen(taskId: string) {
    await reopenTask(taskId);
    load();
  }

  const pending = tasks.filter(t => t.status === 'pending');
  const completed = tasks.filter(t => t.status === 'completed');
  const canEdit = activeFarm?.role !== 'auditor';

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  function renderTask(task: Task, isCompleted: boolean) {
    const logs = equipmentLogs[task.id] ?? [];
    return (
      <Card style={[styles.card, isCompleted && styles.completedCard]} key={task.id}>
        <Card.Content>
          <View style={styles.taskRow}>
            <Text variant="bodyLarge" style={[styles.flex, isCompleted && styles.strikethrough]}>
              {task.name}
            </Text>
            {canEdit && !isCompleted && (
              <IconButton icon="check" size={20} iconColor="#2e7d32" onPress={() => handleComplete(task.id)} />
            )}
            {canEdit && isCompleted && (
              <IconButton icon="undo" size={18} iconColor="#888" onPress={() => handleReopen(task.id)} />
            )}
          </View>

          {task.dueDate && (
            <Text variant="bodySmall" style={styles.due}>
              Due: {task.dueDate.toDate().toLocaleDateString()}
            </Text>
          )}

          {isCompleted && task.completedAt && (
            <Text variant="bodySmall" style={styles.completedAt}>
              Completed {task.completedAt.toDate().toLocaleDateString()}
            </Text>
          )}

          {logs.length > 0 && (
            <View style={styles.logsRow}>
              {logs.map((l) => (
                <Chip key={l.id} compact icon="tractor" style={styles.equipChip}>
                  {l.hours} hrs
                </Chip>
              ))}
            </View>
          )}

          {canEdit && !isCompleted && (
            <Button
              compact
              icon="tractor"
              mode="outlined"
              style={styles.logEquipBtn}
              onPress={() => navigation.navigate('TaskForm', { projectId, taskId: task.id })}
            >
              Log Equipment
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>Tasks</Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
        >
          <Menu.Item
            onPress={() => { setMenuVisible(false); updateProjectStatus(projectId, 'archived').then(() => navigation.goBack()); }}
            title="Archive Project"
          />
        </Menu>
      </View>

      {/* New task input */}
      {canEdit && (
        <View style={styles.addRow}>
          <TextInput
            label="Add task..."
            value={newTaskName}
            onChangeText={setNewTaskName}
            mode="outlined"
            style={styles.addInput}
            onSubmitEditing={handleAddTask}
          />
          <IconButton icon="plus" mode="contained" onPress={handleAddTask} containerColor="#2e7d32" iconColor="white" />
        </View>
      )}

      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            <Text variant="labelLarge" style={styles.sectionLabel}>Pending ({pending.length})</Text>
            {pending.map(t => renderTask(t, false))}
            {pending.length === 0 && <Text style={styles.empty}>No pending tasks</Text>}

            {completed.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <Text variant="labelLarge" style={styles.sectionLabel}>History ({completed.length})</Text>
                {completed.map(t => renderTask(t, true))}
              </>
            )}
          </>
        }
        renderItem={() => null}
        keyExtractor={() => 'dummy'}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  title: { fontWeight: 'bold', color: '#2e7d32' },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  addInput: { flex: 1, marginRight: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionLabel: { color: '#666', marginBottom: 4, marginTop: 8 },
  card: { marginBottom: 8, borderRadius: 8 },
  completedCard: { opacity: 0.6 },
  taskRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  strikethrough: { textDecorationLine: 'line-through', color: '#999' },
  due: { color: '#f57c00', marginTop: 2 },
  completedAt: { color: '#888', marginTop: 2 },
  logsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  equipChip: { backgroundColor: '#e8f5e9' },
  logEquipBtn: { marginTop: 8, alignSelf: 'flex-start' },
  divider: { marginVertical: 12 },
  empty: { textAlign: 'center', color: '#999', padding: 16 },
});
