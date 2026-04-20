import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getMaintenanceTasks, getMaintenanceStatus } from './maintenance';
import { getEquipment } from './equipment';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Cancel all previously scheduled maintenance reminders and reschedule
// based on current due status. Call after loading equipment on app focus.
export async function scheduleMaintenenanceNotifications(farmId: string): Promise<void> {
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  // Cancel all existing scheduled reminders before rescheduling
  await Notifications.cancelAllScheduledNotificationsAsync();

  const equipment = await getEquipment(farmId);
  const now = Date.now();
  const oneDayMs = 86400000;

  for (const eq of equipment.filter(e => e.status === 'active' && !e.broken)) {
    const tasks = await getMaintenanceTasks(eq.id);
    for (const task of tasks.filter(t => !t.archived)) {
      const status = getMaintenanceStatus(task, eq.totalHours);
      if (status !== 'due_soon' && status !== 'overdue') continue;

      const title = status === 'overdue'
        ? `⚠️ Overdue: ${task.name}`
        : `🔧 Due soon: ${task.name}`;
      const body = `${eq.name} — ${
        task.nextDueHours ? `due at ${task.nextDueHours} hrs (current: ${eq.totalHours})` :
        task.nextDueAt ? `due ${task.nextDueAt.toDate().toLocaleDateString()}` : 'check schedule'
      }`;

      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { equipmentId: eq.id, taskId: task.id } },
        trigger: { seconds: 5, repeats: false },
      });
    }
  }
}
