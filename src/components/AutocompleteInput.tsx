import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { TextInput } from 'react-native-paper';

type TextInputProps = React.ComponentProps<typeof TextInput>;

interface AutocompleteInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'mode' | 'label'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  suggestions: string[];
  mode?: 'outlined' | 'flat';
  style?: ViewStyle;
}

export default function AutocompleteInput({
  label,
  value,
  onChangeText,
  suggestions,
  mode = 'outlined',
  style,
  ...rest
}: AutocompleteInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const suppressBlur = useRef(false);

  const lowerValue = value.toLowerCase();

  const exactMatch = suggestions.some(s => s.toLowerCase() === lowerValue);

  const filtered = exactMatch
    ? []
    : suggestions
        .filter(s => s.toLowerCase().includes(lowerValue))
        .slice(0, 6);

  const showList = isFocused && value.length > 0 && filtered.length > 0;

  return (
    <View style={style}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        mode={mode}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          if (suppressBlur.current) {
            suppressBlur.current = false;
            return;
          }
          setIsFocused(false);
        }}
        {...rest}
      />
      {showList && (
        <View style={styles.listContainer}>
          {filtered.map((item, index) => (
            <TouchableOpacity
              key={item}
              onPressIn={() => {
                suppressBlur.current = true;
              }}
              onPress={() => {
                onChangeText(item);
                setIsFocused(false);
              }}
              style={[
                styles.item,
                index < filtered.length - 1 && styles.itemBorder,
              ]}
            >
              <Text style={styles.itemText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    marginTop: 2,
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  itemText: {
    fontSize: 14,
    color: '#212121',
  },
});
