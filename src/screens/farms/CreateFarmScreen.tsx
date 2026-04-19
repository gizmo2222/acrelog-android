import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { createFarm } from '../../services/farms';
import { useAuth } from '../../hooks/useAuth';
import { ensureBuiltInCategories as initCategories } from '../../services/equipment';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateFarm'>;

export default function CreateFarmScreen({ navigation }: Props) {
  const { setActiveFarm } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const farm = await createFarm(name.trim());
      await initCategories(farm.id);
      setActiveFarm({ farmId: farm.id, farmName: farm.name, role: 'owner' });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.card} elevation={2}>
        <Text variant="headlineMedium" style={styles.title}>Create a Farm</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Give your farm a name to get started</Text>

        <TextInput
          label="Farm Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          mode="outlined"
          autoFocus
        />

        <Button mode="contained" onPress={handleCreate} loading={loading} style={styles.button}>
          Create Farm
        </Button>
        <Button onPress={() => navigation.goBack()}>Back</Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f5f2ee', padding: 16 },
  card: { padding: 24, borderRadius: 12 },
  title: { fontWeight: 'bold', color: '#2e7d32' },
  subtitle: { color: '#666', marginBottom: 24 },
  input: { marginBottom: 12 },
  button: { marginTop: 8 },
});
