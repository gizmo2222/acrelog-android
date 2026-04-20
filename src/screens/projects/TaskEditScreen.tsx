import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, Button, Card, Chip, IconButton, Divider, ActivityIndicator, Menu, SegmentedButtons } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Timestamp, deleteField } from 'firebase/firestore';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import {
  getTask, updateTask, completeTask, reopenTask, startTask,
  getTaskEquipmentLogs, deleteTaskEquipmentLog,
  getTaskComments, createTaskComment, deleteTaskComment,
  scheduleNextRecurrence,
} from '../../services/projects';
import { getFarmMembers } from '../../services/farms';
import { getEquipment, getCategories } from '../../services/equipment';
import DatePickerField from '../../components/DatePickerField';
import { Task, TaskEquipmentLog, TaskComment, Equipment, Category, FarmMember, TaskPriority, TaskStatus, TaskPart, TaskRecurrence } from '../../types';
import { errorMessage } from '../../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskEdit'>;

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: '#c62828',
  medium: '#f57c00',
  low: '#6b6b6b',
};
const PRIORITY_BG: Record<TaskPriority, string> = {
  high: '#ffebee',
  medium: '#fff3e0',
  low: '#f5f5f5',
};
const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'To Do',
  in_progress: 'In Progress',
  completed: 'Done',
};

export default function TaskEditScreen({ route, navigation }: Props) {
  const { taskId, projectId } = route.params;
  const { activeFarm, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [task, setTask] = useState<Task | null>(null);
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority | undefined>(undefined);
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [assignedToId, setAssignedToId] = useState<string | undefined>(undefined);
  const [assignedToName, setAssignedToName] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState<{ name: string; cost: string }[]>([]);
  const [farmMembers, setFarmMembers] = useState<FarmMember[]>([]);
  const [logs, setLogs] = useState<TaskEquipmentLog[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigneeMenuVisible, setAssigneeMenuVisible] = useState(false);
  const [recurrence, setRecurrence] = useState<TaskRecurrence | undefined>(undefined);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, [taskId]));

  async function load() {
    setLoading(true);
    const [t, l, c] = await Promise.all([
      getTask(taskId),
      getTaskEquipmentLogs(taskId),
      getTaskComments(taskId),
    ]);
    if (!t) { navigation.goBack(); return; }

    setTask(t);
    setName(t.name);
    setDueDate(t.dueDate ? toISO(t.dueDate.toDate()) : '');
    setPriority(t.priority);
    setStatus(t.status);
    setAssignedToId(t.assignedToId);
    setAssignedToName(t.assignedToName);
    setNotes(t.notes ?? '');
    setRecurrence(t.recurrence);
    setParts((t.parts ?? []).map(p => ({ name: p.name, cost: p.cost != null ? String(p.cost) : '' })));
    setLogs(l);
    setComments(c);

    if (activeFarm) {
      const [eq, members, cats] = await Promise.all([
        getEquipment(activeFarm.farmId),
        getFarmMembers(activeFarm.farmId),
        getCategories(activeFarm.farmId),
      ]);
      setEquipment(eq);
      setFarmMembers(members);
      setCategories(cats);
    }
    setLoading(false);
  }

  function toISO(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function addPart() {
    setParts(prev => [...prev, { name: '', cost: '' }]);
  }

  function updatePart(index: number, field: 'name' | 'cost', value: string) {
    setParts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  function removePart(index: number) {
    setParts(prev => prev.filter((_, i) => i !== index));
  }

  const canEdit = activeFarm?.role !== 'auditor';

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const taskParts: TaskPart[] = parts
        .filter(p => p.name.trim())
        .map(p => ({ name: p.name.trim(), ...(p.cost ? { cost: parseFloat(p.cost) } : {}) }));

      const update: any = {
        name: name.trim(),
        status,
        notes: notes.trim() || '',
        parts: taskParts,
        ...(priority ? { priority } : { priority: deleteField() }),
        ...(recurrence ? { recurrence } : { recurrence: deleteField() }),
        ...(assignedToId ? { assignedToId, assignedToName } : { assignedToId: deleteField(), assignedToName: deleteField() }),
      };
      if (dueDate) {
        update.dueDate = Timestamp.fromDate(new Date(dueDate + 'T00:00:00'));
      } else if (task?.dueDate) {
        update.dueDate = deleteField();
      }
      if (status === 'completed' && task?.status !== 'completed') {
        await completeTask(taskId);
        delete update.status;
        if (recurrence && task) {
          await scheduleNextRecurrence({ ...task, name: name.trim(), recurrence, dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate + 'T00:00:00')) : task.dueDate });
        }
      } else if (status !== 'completed' && task?.status === 'completed') {
        await reopenTask(taskId);
        delete update.status;
      } else if (status === 'in_progress' && task?.status === 'pending') {
        await startTask(taskId);
        delete update.status;
      }
      await updateTask(taskId, update);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Couldn't save task", errorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [name, parts, status, notes, priority, recurrence, assignedToId, assignedToName, dueDate, task, taskId]);


  useEffect(() => {
    if (!canEdit || loading) return;
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={handleSave}
          loading={saving}
          disabled={!name.trim() || saving}
          textColor="#2e7d32"
        >
          Save
        </Button>
      ),
    });
  }, [name, saving, loading, canEdit, handleSave]);

  async function handleDeleteLog(logId: string) {
    Alert.alert('Remove this equipment entry?', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await deleteTaskEquipmentLog(logId);
          setLogs(prev => prev.filter(l => l.id !== logId));
        }
      },
    ]);
  }

  function meterUnitFor(equipmentId: string): string {
    const eq = equipment.find(e => e.id === equipmentId);
    if (!eq) return 'hrs';
    const cat = categories.find(c => c.id === eq.categoryId);
    return cat?.meterLabel === 'miles' ? 'mi' : 'hrs';
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Name */}
      <View style={styles.section}>
        <TextInput
          label="Task name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          editable={canEdit}
        />
      </View>

      {/* Status */}
      {canEdit && (
        <View style={styles.section}>
          <Text variant="labelSmall" style={styles.fieldLabel}>Status</Text>
          <SegmentedButtons
            value={status}
            onValueChange={v => setStatus(v as TaskStatus)}
            buttons={[
              { value: 'pending', label: 'To Do' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Done' },
            ]}
          />
        </View>
      )}

      {/* Priority */}
      {canEdit && (
        <View style={styles.section}>
          <Text variant="labelSmall" style={styles.fieldLabel}>Priority</Text>
          <View style={styles.chipRow}>
            {(['high', 'medium', 'low'] as TaskPriority[]).map(p => (
              <Chip
                key={p}
                compact
                selected={priority === p}
                onPress={() => setPriority(priority === p ? undefined : p)}
                selectedColor={PRIORITY_COLORS[p]}
                style={[styles.priorityChip, priority === p && { backgroundColor: PRIORITY_BG[p] }]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Chip>
            ))}
          </View>
        </View>
      )}

      {/* Recurrence */}
      {canEdit && (
        <View style={styles.section}>
          <Text variant="labelSmall" style={styles.fieldLabel}>Repeats</Text>
          <View style={styles.chipRow}>
            {(['daily', 'weekly', 'monthly', 'yearly'] as TaskRecurrence[]).map(r => (
              <Chip
                key={r}
                compact
                selected={recurrence === r}
                onPress={() => setRecurrence(recurrence === r ? undefined : r)}
                style={recurrence === r ? styles.recurrenceChipSelected : undefined}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Chip>
            ))}
          </View>
        </View>
      )}

      {/* Due date */}
      <View style={styles.section}>
        <DatePickerField label="Due date" value={dueDate} onChange={setDueDate} optional />
      </View>

      {/* Assignee */}
      {canEdit && (
        <View style={styles.section}>
          <Text variant="labelSmall" style={styles.fieldLabel}>Assigned to</Text>
          <Menu
            visible={assigneeMenuVisible}
            onDismiss={() => setAssigneeMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="account-outline"
                onPress={() => setAssigneeMenuVisible(true)}
                style={styles.assigneeBtn}
                contentStyle={styles.assigneeBtnContent}
              >
                {assignedToName ?? 'Unassigned'}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => { setAssignedToId(undefined); setAssignedToName(undefined); setAssigneeMenuVisible(false); }}
              title="Unassigned"
            />
            {farmMembers.map(m => (
              <Menu.Item
                key={m.userId}
                onPress={() => { setAssignedToId(m.userId); setAssignedToName(m.displayName); setAssigneeMenuVisible(false); }}
                title={`${m.displayName} (${m.role})`}
              />
            ))}
          </Menu>
        </View>
      )}

      {/* Notes */}
      <View style={styles.section}>
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
          editable={canEdit}
        />
      </View>

      <Divider style={styles.divider} />

      {/* Parts */}
      <View style={styles.section}>
        <Text variant="labelSmall" style={styles.fieldLabel}>Parts & Materials</Text>
        {parts.map((part, i) => (
          <View key={i} style={styles.partRow}>
            <TextInput
              label="Part name"
              value={part.name}
              onChangeText={v => updatePart(i, 'name', v)}
              mode="outlined"
              style={styles.partName}
              dense
            />
            <TextInput
              label="Cost $"
              value={part.cost}
              onChangeText={v => updatePart(i, 'cost', v)}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.partCost}
              dense
            />
            <IconButton icon="close" size={18} onPress={() => removePart(i)} style={styles.partDelete} />
          </View>
        ))}
        {canEdit && (
          <Button icon="plus" mode="text" onPress={addPart} style={styles.addPartBtn}>
            Add Part
          </Button>
        )}
        {parts.filter(p => p.name && p.cost).length > 0 && (
          <Text variant="bodySmall" style={styles.totalCost}>
            Est. total: ${parts.filter(p => p.name && p.cost).reduce((s, p) => s + parseFloat(p.cost || '0'), 0).toFixed(2)}
          </Text>
        )}
      </View>

      <Divider style={styles.divider} />

      {/* Equipment logs */}
      <View style={styles.section}>
        <Text variant="labelSmall" style={styles.fieldLabel}>Equipment Used</Text>
        {logs.length === 0
          ? <Text variant="bodySmall" style={styles.emptyNote}>No equipment logged yet.</Text>
          : logs.map(log => {
              const eq = equipment.find(e => e.id === log.equipmentId);
              return (
                <Card key={log.id} style={styles.logCard}>
                  <Card.Content style={styles.logRow}>
                    <View style={styles.flex}>
                      <Text variant="bodyMedium">{eq?.name ?? log.equipmentId}</Text>
                      <Text variant="bodySmall" style={styles.logMeta}>{log.hours} {meterUnitFor(log.equipmentId)} · {log.loggedAt.toDate().toLocaleDateString()}</Text>
                    </View>
                    {canEdit && (
                      <IconButton icon="trash-can-outline" size={18} iconColor="#9e9e9e" onPress={() => handleDeleteLog(log.id)} />
                    )}
                  </Card.Content>
                </Card>
              );
            })
        }
        {canEdit && status !== 'completed' && (
          <Button mode="outlined" icon="tractor" style={styles.addEquipBtn} onPress={() => navigation.navigate('TaskForm', { projectId, taskId })}>
            Log Equipment Use
          </Button>
        )}
      </View>

      <Divider style={styles.divider} />

      {/* Comments */}
      <View style={styles.section}>
        <Text variant="labelSmall" style={styles.fieldLabel}>Comments</Text>
        {comments.length === 0
          ? <Text variant="bodySmall" style={styles.emptyNote}>No comments yet.</Text>
          : comments.map(c => (
              <View key={c.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text variant="labelSmall" style={styles.commentAuthor}>{c.userName}</Text>
                  <Text variant="bodySmall" style={styles.commentDate}>
                    {c.createdAt?.toDate?.().toLocaleDateString() ?? ''}
                  </Text>
                </View>
                <Text variant="bodySmall" style={styles.commentBody}>{c.body}</Text>
              </View>
            ))
        }
        {canEdit && (
          <View style={styles.commentInputRow}>
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment…"
              mode="outlined"
              dense
              style={styles.commentInput}
            />
            <Button
              mode="contained"
              compact
              disabled={!newComment.trim() || postingComment}
              loading={postingComment}
              onPress={async () => {
                if (!newComment.trim()) return;
                setPostingComment(true);
                try {
                  const userName = profile?.displayName ?? 'Unknown';
                  const c = await createTaskComment(taskId, projectId, newComment.trim(), userName);
                  setComments(prev => [...prev, c]);
                  setNewComment('');
                } catch (e: any) {
                  Alert.alert("Couldn't post comment", errorMessage(e));
                } finally {
                  setPostingComment(false);
                }
              }}
              style={styles.commentPostBtn}
            >
              Post
            </Button>
          </View>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { paddingHorizontal: 16, paddingTop: 12 },
  fieldLabel: { color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { marginBottom: 4 },
  chipRow: { flexDirection: 'row', gap: 8 },
  priorityChip: { marginRight: 0 },
  recurrenceChipSelected: { backgroundColor: '#e8f5e9' },
  assigneeBtn: { alignSelf: 'flex-start' },
  assigneeBtnContent: { flexDirection: 'row-reverse' },
  divider: { marginTop: 16 },
  partRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  partName: { flex: 2 },
  partCost: { flex: 1 },
  partDelete: { margin: 0 },
  addPartBtn: { alignSelf: 'flex-start', marginTop: 0 },
  totalCost: { color: '#2e7d32', fontWeight: '600', marginTop: 4 },
  emptyNote: { color: '#9e9e9e', marginBottom: 8 },
  logCard: { marginBottom: 8, borderRadius: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  logMeta: { color: '#6b6b6b', marginTop: 2 },
  addEquipBtn: { marginTop: 4 },
  commentItem: { marginBottom: 8 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  commentAuthor: { color: '#2e7d32', fontWeight: '600' },
  commentDate: { color: '#9e9e9e' },
  commentBody: { color: '#333' },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  commentInput: { flex: 1 },
  commentPostBtn: { marginTop: 4 },
});
