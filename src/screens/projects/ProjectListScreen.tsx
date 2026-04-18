import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, Card, FAB, Chip, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../hooks/useAuth';
import { getProjects, createProject } from '../../services/projects';
import { Project } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProjectListScreen() {
  const navigation = useNavigation<Nav>();
  const { activeFarm } = useAuth();
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!activeFarm) return;
      getProjects(activeFarm.farmId)
        .then(p => { setProjects(p); setLoading(false); })
        .catch(e => { console.error('Projects load error:', e.message); setLoading(false); });
    }, [activeFarm])
  );

  const filtered = projects.filter(p => p.status === filter);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2e7d32" /></View>;

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.title}>Projects</Text>

      <SegmentedButtons
        value={filter}
        onValueChange={(v) => setFilter(v as any)}
        buttons={[
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
        ]}
        style={styles.segment}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}>
            <Card.Content>
              <Text variant="titleMedium">{item.name}</Text>
              <Text variant="bodySmall" style={styles.date}>
                Created {item.createdAt.toDate().toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No {filter} projects</Text>}
        contentContainerStyle={[styles.list, { paddingBottom: 80 + insets.bottom }]}
      />

      {activeFarm?.role !== 'auditor' && (
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: 16 + insets.bottom }]}
          onPress={async () => {
            if (!activeFarm) return;
            const p = await createProject(activeFarm.farmId, 'New Project');
            navigation.navigate('ProjectDetail', { projectId: p.id });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { padding: 16, fontWeight: 'bold', color: '#2e7d32' },
  segment: { marginHorizontal: 16, marginBottom: 8 },
  list: { paddingBottom: 16 },
  card: { marginHorizontal: 16, marginBottom: 8, borderRadius: 8 },
  date: { color: '#888', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', padding: 32 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#2e7d32' },
});
