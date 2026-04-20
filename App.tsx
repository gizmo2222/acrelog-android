import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { MD3LightTheme, Provider as PaperProvider, configureFonts } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { Barlow_400Regular, Barlow_600SemiBold } from '@expo-google-fonts/barlow';
import { AuthProvider } from './src/hooks/useAuth';
import AppNavigator from './src/navigation';
import { COLORS } from './src/constants/theme';

const fontConfig = {
  displayLarge:  { fontFamily: 'BarlowCondensed_700Bold', fontWeight: '700' as const },
  displayMedium: { fontFamily: 'BarlowCondensed_700Bold', fontWeight: '700' as const },
  displaySmall:  { fontFamily: 'BarlowCondensed_700Bold', fontWeight: '700' as const },
  headlineLarge: { fontFamily: 'BarlowCondensed_700Bold', fontWeight: '700' as const },
  headlineMedium:{ fontFamily: 'BarlowCondensed_700Bold', fontWeight: '700' as const },
  headlineSmall: { fontFamily: 'BarlowCondensed_700Bold', fontWeight: '700' as const },
  titleLarge:    { fontFamily: 'Barlow_600SemiBold', fontWeight: '600' as const },
  titleMedium:   { fontFamily: 'Barlow_600SemiBold', fontWeight: '600' as const },
  titleSmall:    { fontFamily: 'Barlow_600SemiBold', fontWeight: '600' as const },
  bodyLarge:     { fontFamily: 'Barlow_400Regular', fontWeight: '400' as const },
  bodyMedium:    { fontFamily: 'Barlow_400Regular', fontWeight: '400' as const },
  bodySmall:     { fontFamily: 'Barlow_400Regular', fontWeight: '400' as const },
  labelLarge:    { fontFamily: 'Barlow_600SemiBold', fontWeight: '600' as const },
  labelMedium:   { fontFamily: 'Barlow_600SemiBold', fontWeight: '600' as const },
  labelSmall:    { fontFamily: 'Barlow_600SemiBold', fontWeight: '600' as const },
  default:       { fontFamily: 'Barlow_400Regular', fontWeight: '400' as const },
};

const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    onPrimary: COLORS.onPrimary,
    primaryContainer: COLORS.primaryContainer,
    onPrimaryContainer: COLORS.onPrimaryContainer,
    secondary: COLORS.secondary,
    onSecondary: COLORS.onSecondary,
    secondaryContainer: COLORS.secondaryContainer,
    onSecondaryContainer: COLORS.onSecondaryContainer,
    background: COLORS.background,
    onBackground: COLORS.onBackground,
    surface: COLORS.surface,
    onSurface: COLORS.onSurface,
    surfaceVariant: COLORS.surfaceVariant,
    onSurfaceVariant: COLORS.onSurfaceVariant,
    outline: COLORS.outline,
    outlineVariant: COLORS.outlineVariant,
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_700Bold,
    Barlow_400Regular,
    Barlow_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
