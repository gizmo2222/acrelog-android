import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { signIn, isBiometricAvailable, isBiometricEnabled } from '../../services/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      setShowBiometric(available && enabled);
    })();
  }, []);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      Alert.alert('Login failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Surface style={styles.card} elevation={2}>
        <Text variant="headlineMedium" style={styles.title}>AcreLog</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          mode="outlined"
        />

        <Button mode="contained" onPress={handleLogin} loading={loading} style={styles.button}>
          Sign In
        </Button>

        {showBiometric && (
          <Button mode="outlined" onPress={() => navigation.navigate('Biometric')} style={styles.button}>
            Use Biometrics
          </Button>
        )}

        <Button onPress={() => navigation.navigate('SignUp')}>
          Create account
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f5f2ee', padding: 16 },
  card: { padding: 24, borderRadius: 12 },
  title: { textAlign: 'center', fontWeight: 'bold', color: '#2e7d32' },
  subtitle: { textAlign: 'center', color: '#666', marginBottom: 24 },
  input: { marginBottom: 12 },
  button: { marginTop: 8 },
});
