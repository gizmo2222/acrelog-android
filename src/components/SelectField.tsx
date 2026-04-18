import React, { useState } from 'react';
import { Pressable, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Menu, TextInput } from 'react-native-paper';

interface Props {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function SelectField({ label, value, options, onChange, allowClear = false, style }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={style}>
      <Menu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Pressable onPress={() => setOpen(true)}>
            <TextInput
              label={label}
              value={value}
              mode="outlined"
              editable={false}
              pointerEvents="none"
              right={<TextInput.Icon icon="chevron-down" onPress={() => setOpen(true)} />}
            />
          </Pressable>
        }
      >
        {options.map(opt => (
          <Menu.Item
            key={opt}
            title={opt}
            onPress={() => { onChange(opt); setOpen(false); }}
            titleStyle={opt === value ? styles.selected : undefined}
          />
        ))}
        {allowClear && value ? (
          <Menu.Item title="Clear" titleStyle={styles.clear} onPress={() => { onChange(''); setOpen(false); }} />
        ) : null}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  selected: { color: '#2e7d32', fontWeight: '600' },
  clear: { color: '#999' },
});
