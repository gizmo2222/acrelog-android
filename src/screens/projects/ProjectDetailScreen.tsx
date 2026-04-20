import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Card, Chip, IconButton, TextInput, Button, Divider, Menu, ActivityIndicator, Dialog, Portal, ProgressBar } from 'react-native-paper';
import EmptyState from '../../components/EmptyState';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Timestamp, deleteField } from 'firebase/firestore';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import {
  getProject, getTasks, createTask, completeTask, reopenTask,
  updateProjectStatus, deleteProject, deleteTask, updateProject,
  getTaskEquipmentLogs,
} from '../../services/projects';
import DatePickerField from '../../components/DatePickerField';
import { Project, Task, TaskEquipmentLog, TaskPriority } from '../../types';
import { errorMessage } from '../../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'ProjectDetail'>;

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: '#c62828',
  medium: '#f57c00',
  low: '#9e9e9e',
};
const PRIORITY_BG: Record<TaskPriority, string> = {
  high: '#ffebee',
  medium: '#fff3e0',
  low: '#f5f5f5',
};

function toISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

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
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editing, setEditing] = useState(false);

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
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTask(task.id); load(); } },
    ]);
  }

  async function handleCompleteToggle() {
    setMenuVisible(false);
    const isCompleted = project?.status === 'completed';
    if (isCompleted) {
      await updateProjectStatus(projectId, 'active');
      setProject(p => p ? { ...p, status: 'active' } : p);
    } else {
      Alert.alert('Mark project complete?', 'It will move to the Completed tab.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: async () => { await updateProjectStatus(projectId, 'completed'); navigation.goBack(); } },
      ]);
    }
  }

  async function handleArchiveToggle() {
    setMenuVisible(false);
    const isArchived = project?.status === 'archived';
    if (isArchived) {
      await updateProjectStatus(projectId, 'active');
      setProject(p => p ? { ...p, status: 'active' } : p);
    } else {
      Alert.alert('Archive project?', 'You can restore it from the Archived tab.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive', onPress: async () => { await updateProjectStatus(projectId, 'archived'); navigation.goBack(); } },
      ]);
    }
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
            try { await deleteProject(projectId); navigation.goBack(); }
            catch (e: any) { Alert.alert("Couldn't delete project", errorMessage(e)); }
          }
        },
      ]
    );
  }

  async function handleSaveEdit() {
    if (!editName.trim()) return;
    setEditing(true);
    try {
      const update: any = { name: editName.trim(), description: editDescription.trim() || '' };
      if (editDueDate) {
        update.dueDate = Timestamp.fromDate(new Date(editDueDate + 'T00:00:00'));
      } else if (project?.dueDate) {
        update.dueDate = deleteField();
      }
      await updateProject(projectId, update);
      setEditVisible(false);
      navigation.setOptions({ title: editName.trim() });
      setProject(p => p ? {
        ...p,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        ...(editDueDate ? { dueDate: Timestamp.fromDate(new Date(editDueDate + 'T00:00:00')) } : { dueDate: undefined }),
      } : p);
    } catch (e: any) {
      Alert.alert("Couldn't update project", errorMessage(e));
    } finally {
      setEditing(false);
    }
  }

  async function optimisticUpdate(taskId: string, newStatus: 'pending' | 'in_progress' | 'completed', action: () => Promise<void>) {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        status: newStatus,
        ...(newStatus === 'completed' ? { completedAt: Timestamp.now() } : {}),
        ...(newStatus === 'pending' ? { completedAt: undefined } : {}),
      };
    }));
    try {
      await action();
    } catch (e: any) {
      load();
      Alert.alert("Couldn't update task", errorMessage(e));
    }
  }

  const canEdit = activeFarm?.role !== 'auditor';
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const pending = tasks.filter(t => t.status === 'pending');
  const completed = tasks.filter(t => t.status === 'completed');
  const taskCount = tasks.length;
  const completedCount = completed.length;
  const progress = taskCount > 0 ? completedCount / taskCount : 0;
  const totalCost = tasks.reduce((sum, t) => sum + (t.parts ?? []).reduce((s, p) => s + (p.cost ?? 0), 0), 0);
  const isOverdue = project?.dueDate && project.dueDate.toMillis() < Date.now();

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  function renderTask(task: Task) {
    const isCompleted = task.status === 'completed';
    const isInProgress = task.status === 'in_progress';
    const logs = equipmentLogs[task.id] ?? [];
    const partCost = (task.parts ?? []).reduce((s, p) => s + (p.cost ?? 0), 0);

    return (
      <Card
        style={[styles.card, isCompleted && styles.completedCard]}
        key={task.id}
        onPress={() => navigation.navigate('TaskEdit', { taskId: task.id, projectId })}
      >
        <Card.Content>
          <View style={styles.taskRow}>
            <View style={styles.taskNameRow}>
              <Text variant="bodyLarge" style={[styles.flex, isCompleted && styles.strikethrough]}>
                {task.name}
              </Text>
              {task.priority && (
                <Chip
                  compact
                  style={{ backgroundColor: PRIORITY_BG[task.priority], marginLeft: 4 }}
                  textStyle={{ color: PRIORITY_COLORS[task.priority], fontSize: 11 }}
                >
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Chip>
              )}
            </View>
            {canEdit && (
              <IconButton icon="trash-can-outline" size={18} iconColor="#9e9e9e" onPress={() => handleDeleteTask(task)} />
            )}
          </View>

          <View style={styles.taskMeta}>
            {isInProgress && (
              <Chip compact style={styles.inProgressChip} textStyle={{ color: '#d4870a', fontSize: 11 }}>In Progress</Chip>
            )}
            {task.dueDate && (
              <Text variant="bodySmall" style={styles.due}>Due {task.dueDate.toDate().toLocaleDateString()}</Text>
            )}
            {task.assignedToName && (
              <Text variant="bodySmall" style={styles.assignee}>→ {task.assignedToName}</Text>
            )}
            {isCompleted && task.completedAt && (
              <Text variant="bodySmall" style={styles.completedAt}>
                Done {task.completedAt.toDate().toLocaleDateString()}
              </Text>
            )}
          </View>

          {(logs.length > 0 || partCost > 0) && (
            <View style={styles.logsRow}>
              {logs.map((l) => (
                <Chip key={l.id} compact icon="tractor" style={styles.equipChip}>{l.hours} hrs</Chip>
              ))}
              {partCost > 0 && (
                <Chip compact icon="currency-usd" style={styles.costChip}>${partCost.toFixed(2)}</Chip>
              )}
            </View>
          )}

          {canEdit && !isCompleted && (
            <Button
              compact
              mode="contained"
              icon="check-circle-outline"
              style={styles.completeBtn}
              buttonColor="#2e7d32"
              onPress={() => optimisticUpdate(task.id, 'completed', () => completeTask(task.id))}
            >
              Mark Complete
            </Button>
          )}
          {canEdit && isCompleted && (
            <Button compact mode="text" icon="undo" style={styles.reopenBtn} onPress={() => optimisticUpdate(task.id, 'pending', () => reopenTask(task.id))}>
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
        <Text variant="titleLarge" style={styles.title} numberOfLines={1}>{project?.name ?? 'Project'}</Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              setEditName(project?.name ?? '');
              setEditDueDate(project?.dueDate ? toISO(project.dueDate.toDate()) : '');
              setEditDescription(project?.description ?? '');
              setEditVisible(true);
            }}
            title="Edit Project"
            leadingIcon="pencil-outline"
          />
          {project?.status !== 'archived' && (
            <Menu.Item
              onPress={handleCompleteToggle}
              title={project?.status === 'completed' ? 'Reopen Project' : 'Mark Complete'}
              leadingIcon={project?.status === 'completed' ? 'restore' : 'check-circle-outline'}
            />
          )}
          <Menu.Item
            onPress={handleArchiveToggle}
            title={project?.status === 'archived' ? 'Restore Project' : 'Archive Project'}
            leadingIcon={project?.status === 'archived' ? 'restore' : 'archive-outline'}
          />
          <Divider />
          <Menu.Item onPress={handleDelete} title="Delete Project" leadingIcon="trash-can-outline" titleStyle={{ color: '#c62828' }} />
        </Menu>
      </View>

      {project?.description ? (
        <Text variant="bodySmall" style={styles.description}>{project.description}</Text>
      ) : null}

      {/* Progress header */}
      {taskCount > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressMeta}>
            <Text variant="bodySmall" style={styles.progressText}>
              {completedCount}/{taskCount} tasks done
              {totalCost > 0 ? ` · Est. $${totalCost.toFixed(2)}` : ''}
            </Text>
            {project?.dueDate && (
              <Text variant="bodySmall" style={[styles.dueText, isOverdue && styles.overdueText]}>
                {isOverdue ? 'Overdue · ' : 'Due '}
                {project.dueDate.toDate().toLocaleDateString()}
              </Text>
            )}
          </View>
          <ProgressBar progress={progress} color="#2e7d32" style={styles.progressBar} />
        </View>
      )}

      {!taskCount && project?.dueDate && (
        <Text variant="bodySmall" style={[styles.dueSolo, isOverdue && styles.overdueText]}>
          {isOverdue ? 'Overdue · ' : 'Due '}
          {project.dueDate.toDate().toLocaleDateString()}
        </Text>
      )}

      {/* Add task row */}
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
          <IconButton icon="plus" mode="contained" onPress={handleAddTask} disabled={addingTask} containerColor="#2e7d32" iconColor="white" />
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: 32 + insets.bottom }]}>
        {/* In Progress */}
        {inProgress.length > 0 && (
          <>
            <Text variant="labelLarge" style={styles.sectionLabel}>In Progress ({inProgress.length})</Text>
            {inProgress.map(t => renderTask(t))}
          </>
        )}

        {/* Empty state when nothing is open */}
        {inProgress.length === 0 && pending.length === 0 && (
          <EmptyState icon="checkbox-blank-outline" title="No open tasks" subtitle={canEdit ? 'Add a task above.' : undefined} />
        )}

        {/* To Do — only when there are pending tasks */}
        {pending.length > 0 && (
          <>
            <Text variant="labelLarge" style={styles.sectionLabel}>To Do ({pending.length})</Text>
            {pending.map(t => renderTask(t))}
          </>
        )}

        {/* Done */}
        {completed.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <Text variant="labelLarge" style={styles.sectionLabel}>Done ({completed.length})</Text>
            {completed.map(t => renderTask(t))}
          </>
        )}
      </ScrollView>

      {/* Edit project dialog */}
      <Portal>
        <Dialog visible={editVisible} onDismiss={() => setEditVisible(false)}>
          <Dialog.Title>Edit Project</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Project name"
              value={editName}
              onChangeText={setEditName}
              mode="outlined"
              autoFocus
              style={styles.dialogInput}
            />
            <TextInput
              label="Description (optional)"
              value={editDescription}
              onChangeText={setEditDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
            <DatePickerField label="Due date" value={editDueDate} onChange={setEditDueDate} optional />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditVisible(false)}>Cancel</Button>
            <Button onPress={handleSaveEdit} loading={editing} disabled={!editName.trim() || editing}>Save</Button>
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
  progressSection: { marginHorizontal: 16, marginTop: 4, marginBottom: 8 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { color: '#6b6b6b' },
  progressBar: { height: 6, borderRadius: 3 },
  dueText: { color: '#6b6b6b' },
  overdueText: { color: '#c62828', fontWeight: '600' },
  dueSolo: { marginHorizontal: 16, marginTop: 4, marginBottom: 8, color: '#6b6b6b' },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  addInput: { flex: 1, marginRight: 4 },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  sectionLabel: { color: '#6b6b6b', marginBottom: 8, marginTop: 8 },
  card: { marginBottom: 8, borderRadius: 8 },
  completedCard: { opacity: 0.6 },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start' },
  taskNameRow: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  flex: { flex: 1 },
  strikethrough: { textDecorationLine: 'line-through', color: '#6b6b6b' },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 2 },
  inProgressChip: { backgroundColor: '#fff3e0' },
  due: { color: '#f57c00' },
  assignee: { color: '#6b6b6b' },
  completedAt: { color: '#6b6b6b' },
  logsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  equipChip: { backgroundColor: '#e8f5e9' },
  costChip: { backgroundColor: '#fff8e1' },
  completeBtn: { alignSelf: 'flex-start', marginTop: 8 },
  reopenBtn: { marginTop: 6, alignSelf: 'flex-start' },
  divider: { marginTop: 8, marginBottom: 4 },
  description: { color: '#6b6b6b', marginHorizontal: 16, marginTop: 2, marginBottom: 8 },
  dialogInput: { marginBottom: 12 },
});
