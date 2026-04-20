import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, TextInput, Button, Card, Chip, IconButton, Divider, ActivityIndicator } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Timestamp, deleteField } from 'firebase/firestore';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import {
  getTask, updateTask, completeTask, reopenTask,
  getTaskEquipmentLogs, deleteTaskEquipmentLog,
} from '../../services/projects';
import { getEquipment } from '../../services/equipment';
import DatePickerField from '../../components/DatePickerField';
import { Task, TaskEquipmentLog, Equipment } from '../../types';
import { errorMessage } from '../../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskEdit'>;

export default function TaskEditScreen({ route, navigation }: Props) {
  const { taskId, projectId } = route.params;
  const { activeFarm } = useAuth();
  const insets = useSafeAreaInsets();
  const [task, setTask] = useState<Task | null>(null);
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [logs, setLogs] = useState<TaskEquipmentLog[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  useFocusEffect(useCallback(() => { load(); }, [taskId]));

  async function load() {
    setLoading(true);
    const [t, l] = await Promise.all([
      getTask(taskId),
      getTaskEquipmentLogs(taskId),
    ]);
    if (!t) { navigation.goBack(); return; }

    setTask(t);
    setName(t.name);
    setDueDate(t.dueDate ? toISO(t.dueDate.toDate()) : '');
    setLogs(l);

    if (activeFarm) {
      const eq = await getEquipment(activeFarm.farmId);
      setEquipment(eq);
    }
    setLoading(false);
  }

  function toISO(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const update: any = { name: name.trim() };
      if (dueDate) {
        update.dueDate = Timestamp.fromDate(new Date(dueDate + 'T00:00:00'));
      } else if (task?.dueDate) {
        update.dueDate = deleteField();
      }
      await updateTask(taskId, update);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Couldn't save task", errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleComplete() {
    if (!task) return;
    setToggling(true);
    try {
      if (task.status === 'pending') {
        await completeTask(taskId);
      } else {
        await reopenTask(taskId);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Couldn't update task", errorMessage(e));
    } finally {
      setToggling(false);
    }
  }

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

  const canEdit = activeFarm?.role !== 'auditor';

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <TextInput
          label="Task name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          editable={canEdit}
        />
        <DatePickerField
          label="Due date"
          value={dueDate}
          onChange={setDueDate}
          optional
        />
      </View>

      {canEdit && (
        <Button
          mode={task?.status === 'completed' ? 'outlined' : 'contained'}
          icon={task?.status === 'completed' ? 'undo' : 'check-circle-outline'}
          onPress={handleToggleComplete}
          loading={toggling}
          style={styles.completeBtn}
          buttonColor={task?.status === 'completed' ? undefined : '#2e7d32'}
        >
          {task?.status === 'completed' ? 'Reopen Task' : 'Mark Complete'}
        </Button>
      )}

      <Divider style={styles.divider} />

      <Text variant="labelLarge" style={styles.sectionLabel}>Equipment Used</Text>

      {logs.length === 0
        ? <Text variant="bodySmall" style={styles.emptyNote}>No equipment logged yet.</Text>
        : logs.map(log => {
            const eq = equipment.find(e => e.id === log.equipmentId);
            return (
              <Card key={log.id} style={styles.logCard}>
                <Card.Content style={styles.logRow}>
                  <View style={styles.flex}>
                    <Text variant="bodyMedium">{eq?.name ?? log.equipmentId}</Text>
                    <Text variant="bodySmall" style={styles.logHours}>{log.hours} hrs · {log.loggedAt.toDate().toLocaleDateString()}</Text>
                  </View>
                  {canEdit && (
                    <IconButton icon="trash-can-outline" size={18} iconColor="#9e9e9e" onPress={() => handleDeleteLog(log.id)} />
                  )}
                </Card.Content>
              </Card>
            );
          })
      }

      {canEdit && task?.status !== 'completed' && (
        <Button
          mode="outlined"
          icon="tractor"
          style={styles.addEquipBtn}
          onPress={() => navigation.navigate('TaskForm', { projectId, taskId })}
        >
          Log Equipment Use
        </Button>
      )}

      <Divider style={styles.divider} />

      {canEdit && (
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={!name.trim() || saving}
          style={styles.saveBtn}
          buttonColor="#2e7d32"
        >
          Save Changes
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f2ee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { padding: 16, paddingBottom: 8 },
  input: { marginBottom: 12 },
  completeBtn: { marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  divider: { marginHorizontal: 16, marginVertical: 16 },
  sectionLabel: { color: '#6b6b6b', marginHorizontal: 16, marginBottom: 8 },
  emptyNote: { color: '#9e9e9e', marginHorizontal: 16, marginBottom: 8 },
  logCard: { marginHorizontal: 16, marginBottom: 8, borderRadius: 8 },
  logRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  logHours: { color: '#6b6b6b', marginTop: 2 },
  addEquipBtn: { marginHorizontal: 16, marginTop: 4 },
  saveBtn: { marginHorizontal: 16, marginTop: 8 },
});
