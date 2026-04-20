import React from 'react';
import { NavigationContainer, DefaultTheme as NavDefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import BiometricScreen from '../screens/auth/BiometricScreen';

// Farm screens
import FarmSelectorScreen from '../screens/farms/FarmSelectorScreen';
import CreateFarmScreen from '../screens/farms/CreateFarmScreen';
import FarmSettingsScreen from '../screens/farms/FarmSettingsScreen';
import CategorySettingsScreen from '../screens/farms/CategorySettingsScreen';

// Equipment screens
import EquipmentListScreen from '../screens/equipment/EquipmentListScreen';
import EquipmentDetailScreen from '../screens/equipment/EquipmentDetailScreen';
import EquipmentFormScreen from '../screens/equipment/EquipmentFormScreen';
import SerialScanScreen from '../screens/equipment/SerialScanScreen';

// Maintenance screens
import MaintenanceScheduleScreen from '../screens/maintenance/MaintenanceScheduleScreen';
import MaintenanceLogFormScreen from '../screens/maintenance/MaintenanceLogFormScreen';
import MaintenanceHistoryScreen from '../screens/maintenance/MaintenanceHistoryScreen';
import MaintenanceTaskFormScreen from '../screens/maintenance/MaintenanceTaskFormScreen';
import InspectionChecklistScreen from '../screens/maintenance/InspectionChecklistScreen';

// Project screens
import ProjectListScreen from '../screens/projects/ProjectListScreen';
import ProjectDetailScreen from '../screens/projects/ProjectDetailScreen';
import TaskFormScreen from '../screens/projects/TaskFormScreen';

// Reports
import ReportsScreen from '../screens/reports/ReportsScreen';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Biometric: undefined;
  FarmSelector: undefined;
  CreateFarm: undefined;
  Main: undefined;
  FarmSettings: undefined;
  CategorySettings: undefined;
  EquipmentDetail: { equipmentId: string };
  EquipmentForm: { equipmentId?: string; prefillSerial?: string };
  SerialScan: undefined;
  MaintenanceSchedule: { equipmentId: string };
  MaintenanceLogForm: { taskId: string; equipmentId: string };
  MaintenanceHistory: { equipmentId: string };
  MaintenanceTaskForm: { equipmentId: string; taskId?: string };
  InspectionChecklist: { equipmentId: string; checklistId?: string };
  ProjectDetail: { projectId: string };
  TaskForm: { projectId: string; taskId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...NavDefaultTheme,
  colors: {
    ...NavDefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.nearBlack,
    border: COLORS.divider,
    primary: COLORS.primary,
  },
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Equipment: 'construct-outline',
            Projects: 'list-outline',
            Reports: 'bar-chart-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.mutedText,
        headerShown: false,
        tabBarStyle: { paddingBottom: insets.bottom, height: 56 + insets.bottom, backgroundColor: COLORS.surface, borderTopColor: COLORS.divider },
      })}
    >
      <Tab.Screen name="Equipment" component={EquipmentListScreen} />
      <Tab.Screen name="Projects" component={ProjectListScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, activeFarm, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Biometric" component={BiometricScreen} />
          </>
        ) : !activeFarm ? (
          <>
            <Stack.Screen name="FarmSelector" component={FarmSelectorScreen} />
            <Stack.Screen name="CreateFarm" component={CreateFarmScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="FarmSettings" component={FarmSettingsScreen} options={{ headerShown: true, title: 'Farm Settings' }} />
            <Stack.Screen name="CategorySettings" component={CategorySettingsScreen} options={{ headerShown: true, title: 'Categories' }} />
            <Stack.Screen name="EquipmentDetail" component={EquipmentDetailScreen} options={{ headerShown: true, title: 'Equipment' }} />
            <Stack.Screen name="EquipmentForm" component={EquipmentFormScreen} options={{ headerShown: true, title: 'Equipment' }} />
            <Stack.Screen name="SerialScan" component={SerialScanScreen} options={{ headerShown: true, title: 'Scan Serial Number' }} />
            <Stack.Screen name="MaintenanceSchedule" component={MaintenanceScheduleScreen} options={{ headerShown: true, title: 'Maintenance' }} />
            <Stack.Screen name="MaintenanceLogForm" component={MaintenanceLogFormScreen} options={{ headerShown: true, title: 'Log Maintenance' }} />
            <Stack.Screen name="MaintenanceHistory" component={MaintenanceHistoryScreen} options={{ headerShown: true, title: 'Maintenance History' }} />
            <Stack.Screen name="MaintenanceTaskForm" component={MaintenanceTaskFormScreen} options={{ headerShown: true, title: 'Add Task' }} />
            <Stack.Screen name="InspectionChecklist" component={InspectionChecklistScreen} options={{ headerShown: true, title: 'Inspection' }} />
            <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ headerShown: true, title: 'Project' }} />
            <Stack.Screen name="TaskForm" component={TaskFormScreen} options={{ headerShown: true, title: 'Task' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
