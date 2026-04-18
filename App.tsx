import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/hooks/useAuth';
import AppNavigator from './src/navigation';

const theme = {
  colors: {
    primary: '#2e7d32',
    secondary: '#81c784',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme as any}>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}
