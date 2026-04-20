import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { authenticateWithBiometrics } from '../../services/auth';
import { useAuth } from '../../hooks/useAuth';
import { errorMessage } from '../../utils/errorMessage';

type Props = NativeStackScreenProps<RootStackParamList, 'Biometric'>;

export default function BiometricScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-trigger on mount
    handleBiometric();
  }, []);

  async function handleBiometric() {
    setLoading(true);
    try {
      const success = await authenticateWithBiometrics();
      if (!success) {
        Alert.alert("Couldn't verify your identity", 'Try again, or sign in with your password.');
      }
      // Auth state is already set from stored credentials; if biometric succeeds
      // the navigator will redirect via onAuthChanged
    } catch (e: any) {
      Alert.alert('Sign-in failed', errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.card} elevation={2}>
        <Ionicons name="finger-print-outline" size={64} color="#2e7d32" style={styles.icon} />
        <Text variant="headlineSmall" style={styles.title}>Biometric Login</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Use your fingerprint or Face ID to sign in</Text>

        <Button mode="contained" onPress={handleBiometric} loading={loading} style={styles.button}>
          Try Again
        </Button>
        <Button onPress={() => navigation.navigate('Login')}>Use Password</Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f5f2ee', padding: 16 },
  card: { padding: 32, borderRadius: 12, alignItems: 'center' },
  icon: { marginBottom: 16 },
  title: { fontWeight: 'bold', color: '#2e7d32' },
  subtitle: { color: '#6b6b6b', textAlign: 'center', marginVertical: 12 },
  button: { marginTop: 16, width: '100%' },
});
