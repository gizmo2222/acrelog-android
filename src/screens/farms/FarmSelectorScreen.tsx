import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getUserFarms } from '../../services/farms';
import { Farm, UserRole } from '../../types';
import { signOut } from '../../services/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'FarmSelector'>;

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  worker: 'Worker',
  mechanic: 'Mechanic',
  auditor: 'Auditor (Read-only)',
};

export default function FarmSelectorScreen({ navigation }: Props) {
  const { user, setActiveFarm } = useAuth();
  const [farms, setFarms] = useState<{ farm: Farm; role: UserRole }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserFarms(user.uid).then((f) => {
      setFarms(f);
      setLoading(false);
    });
  }, [user]);

  function selectFarm(farm: Farm, role: UserRole) {
    setActiveFarm({ farmId: farm.id, farmName: farm.name, role });
    navigation.replace('Main');
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Select a Farm</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>Choose which farm to work on</Text>

      {farms.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyLarge" style={styles.emptyText}>You're not a member of any farm yet.</Text>
          <Button mode="contained" onPress={() => navigation.navigate('CreateFarm')} style={styles.button}>
            Create Your Farm
          </Button>
        </View>
      ) : (
        <FlatList
          data={farms}
          keyExtractor={(item) => item.farm.id}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => selectFarm(item.farm, item.role)}>
              <Card.Content>
                <Text variant="titleLarge">{item.farm.name}</Text>
                <Chip style={styles.roleChip} compact>{ROLE_LABELS[item.role]}</Chip>
              </Card.Content>
            </Card>
          )}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateFarm')}
        label="New Farm"
      />

      <Button onPress={() => signOut()} style={styles.signOut}>Sign Out</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: 'bold', color: '#2e7d32', marginTop: 48 },
  subtitle: { color: '#666', marginBottom: 24 },
  card: { marginBottom: 12, borderRadius: 8 },
  roleChip: { marginTop: 8, alignSelf: 'flex-start' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', textAlign: 'center', marginBottom: 24 },
  button: { marginTop: 8 },
  fab: { position: 'absolute', right: 16, bottom: 80, backgroundColor: '#2e7d32' },
  signOut: { marginBottom: 16 },
});
