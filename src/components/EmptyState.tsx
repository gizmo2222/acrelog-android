import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export default function EmptyState({ icon, title, subtitle, action, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <MaterialCommunityIcons name={icon} size={52} color="#c4bdb6" style={styles.icon} />
      <Text variant="titleSmall" style={styles.title}>{title}</Text>
      {subtitle ? <Text variant="bodySmall" style={styles.subtitle}>{subtitle}</Text> : null}
      {action ? (
        <Button mode="outlined" onPress={action.onPress} style={styles.btn}>
          {action.label}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  icon: { marginBottom: 16 },
  title: { color: '#4a4540', textAlign: 'center', marginBottom: 6, fontWeight: '600' },
  subtitle: { color: '#6b6b6b', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  btn: { marginTop: 4 },
});
