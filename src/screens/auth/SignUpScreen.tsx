import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { signUp } from '../../services/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!displayName || !email || !password) {
      Alert.alert('Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, displayName);
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Surface style={styles.card} elevation={2}>
        <Text variant="headlineMedium" style={styles.title}>Create Account</Text>

        <TextInput label="Full Name" value={displayName} onChangeText={setDisplayName} style={styles.input} mode="outlined" />
        <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} mode="outlined" />
        <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} mode="outlined" />
        <TextInput label="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry style={styles.input} mode="outlined" />

        <Button mode="contained" onPress={handleSignUp} loading={loading} style={styles.button}>
          Create Account
        </Button>
        <Button onPress={() => navigation.goBack()}>Back to Sign In</Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f5f5f5', padding: 16 },
  card: { padding: 24, borderRadius: 12 },
  title: { textAlign: 'center', fontWeight: 'bold', color: '#2e7d32', marginBottom: 24 },
  input: { marginBottom: 12 },
  button: { marginTop: 8 },
});
