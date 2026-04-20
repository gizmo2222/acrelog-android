import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Card, Chip, IconButton, TextInput, Button, Divider, Menu, ActivityIndicator, Dialog, Portal } from 'react-native-paper';
import EmptyState from '../../components/EmptyState';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import {
  getProject, getTasks, createTask, completeTask, reopenTask,
  updateProjectStatus, deleteProject, deleteTask, renameProject,
  getTaskEquipmentLogs,
} from '../../services/projects';
import { Project, Task, TaskEquipmentLog } from '../../types';
import { errorMessage } from '../../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'ProjectDetail'>;

export default function ProjectDetailScreen({ route, navigation }: Props) {
  const { projectId } = route.params;
  const { activeFarm } = useAuth();
  const insets = useSafeAreaInsets();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskName, setNewTaskName] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [equipmentLogs, setEquipmentLogs] = useState<Record<string, TaskEquipmentLog[]>>({});
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [renaming, setRenaming] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, [projectId]));

  async function load() {
    setLoading(true);
    const [proj, t] = await Promise.all([getProject(projectId), getTasks(projectId)]);
    setProject(proj);
    setTasks(t);
    if (proj) navigation.setOptions({ title: proj.name });

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
    setAddingTask(true);
    try {
      await createTask(projectId, newTaskName.trim());
      setNewTaskName('');
      load();
    } catch (e: any) {
      Alert.alert("Couldn't add task", errorMessage(e));
    } finally {
      setAddingTask(false);
    }
  }

  async function handleDeleteTask(task: Task) {
    Alert.alert(`Delete "${task.name}"?`, "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteTask(task.id);
          load();
        }
      },
    ]);
  }

  async function handleComplete(taskId: string) {
    await completeTask(taskId);
    load();
  }

  async function handleReopen(taskId: string) {
    await reopenTask(taskId);
    load();
  }

  async function handleArchive() {
    setMenuVisible(false);
    Alert.alert('Archive project?', 'You can restore it later from the Archived tab.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive', onPress: async () => {
          await updateProjectStatus(projectId, 'archived');
          navigation.goBack();
        }
      },
    ]);
  }

  async function handleDelete() {
    setMenuVisible(false);
    Alert.alert(
      `Delete "${project?.name ?? 'project'}"?`,
      'All tasks will be permanently deleted. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await deleteProject(projectId);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert("Couldn't delete project", errorMessage(e));
            }
          }
        },
      ]
    );
  }

  async function handleRename() {
    if (!renameName.trim()) return;
    setRenaming(true);
    try {
      await renameProject(projectId, renameName.trim());
      setRenameVisible(false);
      navigation.setOptions({ title: renameName.trim() });
      setProject(p => p ? { ...p, name: renameName.trim() } : p);
    } catch (e: any) {
      Alert.alert("Couldn't rename project", errorMessage(e));
    } finally {
      setRenaming(false);
    }
  }

  const pending = tasks.filter(t => t.status === 'pending');
  const completed = tasks.filter(t => t.status === 'completed');
  const canEdit = activeFarm?.role !== 'auditor';

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  function renderTask(task: Task, isCompleted: boolean) {
    const logs = equipmentLogs[task.id] ?? [];
    return (
      <Card
        style={[styles.card, isCompleted && styles.completedCard]}
        key={task.id}
        onPress={() => navigation.navigate('TaskEdit', { taskId: task.id, projectId })}
      >
        <Card.Content>
          <View style={styles.taskRow}>
            <Text variant="bodyLarge" style={[styles.flex, isCompleted && styles.strikethrough]}>
              {task.name}
            </Text>
            {canEdit && (
              <IconButton icon="trash-can-outline" size={18} iconColor="#9e9e9e" onPress={() => handleDeleteTask(task)} />
            )}
          </View>

          {task.dueDate && (
            <Text variant="bodySmall" style={styles.due}>
              Due {task.dueDate.toDate().toLocaleDateString()}
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
              mode="contained"
              icon="check-circle-outline"
              style={styles.completeBtn}
              buttonColor="#2e7d32"
              onPress={() => handleComplete(task.id)}
            >
              Mark Complete
            </Button>
          )}
          {canEdit && isCompleted && (
            <Button
              compact
              mode="text"
              icon="undo"
              style={styles.completeBtn}
              onPress={() => handleReopen(task.id)}
            >
              Reopen
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title} numberOfLines={1}>
          {project?.name ?? 'Project'}
        </Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
        >
          <Menu.Item
            onPress={() => { setMenuVisible(false); setRenameName(project?.name ?? ''); setRenameVisible(true); }}
            title="Rename Project"
            leadingIcon="pencil-outline"
          />
          <Menu.Item
            onPress={handleArchive}
            title="Archive Project"
            leadingIcon="archive-outline"
          />
          <Divider />
          <Menu.Item
            onPress={handleDelete}
            title="Delete Project"
            leadingIcon="trash-can-outline"
            titleStyle={{ color: '#c62828' }}
          />
        </Menu>
      </View>

      {canEdit && (
        <View style={styles.addRow}>
          <TextInput
            label="New task name..."
            value={newTaskName}
            onChangeText={setNewTaskName}
            mode="outlined"
            style={styles.addInput}
            onSubmitEditing={handleAddTask}
            returnKeyType="done"
          />
          <IconButton
            icon="plus"
            mode="contained"
            onPress={handleAddTask}
            disabled={addingTask}
            containerColor="#2e7d32"
            iconColor="white"
          />
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: 32 + insets.bottom }]}>
        <Text variant="labelLarge" style={styles.sectionLabel}>Pending ({pending.length})</Text>
        {pending.length === 0
          ? <EmptyState
              icon="checkbox-blank-outline"
              title="No pending tasks"
              subtitle={canEdit ? 'Add a task above to get started.' : undefined}
            />
          : pending.map(t => renderTask(t, false))
        }

        {completed.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <Text variant="labelLarge" style={styles.sectionLabel}>Completed ({completed.length})</Text>
            {completed.map(t => renderTask(t, true))}
          </>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={renameVisible} onDismiss={() => setRenameVisible(false)}>
          <Dialog.Title>Rename Project</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Project name"
              value={renameName}
              onChangeText={setRenameName}
              mode="outlined"
              autoFocus
              onSubmitEditing={handleRename}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameVisible(false)}>Cancel</Button>
            <Button onPress={handleRename} loading={renaming} disabled={!renameName.trim() || renaming}>
              Save
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 16, paddingRight: 4, paddingTop: 8 },
  title: { fontWeight: 'bold', color: '#2e7d32', flex: 1 },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  addInput: { flex: 1, marginRight: 4 },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  sectionLabel: { color: '#6b6b6b', marginBottom: 8, marginTop: 8 },
  card: { marginBottom: 8, borderRadius: 8 },
  completedCard: { opacity: 0.6 },
  taskRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  strikethrough: { textDecorationLine: 'line-through', color: '#6b6b6b' },
  due: { color: '#f57c00', marginTop: 2 },
  completedAt: { color: '#6b6b6b', marginTop: 2 },
  logsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  equipChip: { backgroundColor: '#e8f5e9' },
  completeBtn: { marginTop: 8, alignSelf: 'flex-start' },
  divider: { marginTop: 8, marginBottom: 4 },
});
