import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD string or ''
  onChange: (value: string) => void; // returns YYYY-MM-DD string
  style?: ViewStyle;
  optional?: boolean;
}

function toDateLocal(isoStr: string): Date {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(isoStr: string): string {
  if (!isoStr) return '';
  return toDateLocal(isoStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function DatePickerField({ label, value, onChange, style, optional }: DatePickerFieldProps) {
  const [show, setShow] = useState(false);

  const selectedDate = value ? toDateLocal(value) : new Date();

  function handleChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShow(false);
    if (date) onChange(toISODate(date));
  }

  function handlePress() {
    setShow(true);
  }

  function handleClear() {
    onChange('');
  }

  const hasValue = !!value;

  return (
    <View style={[styles.wrapper, style]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={[styles.field, hasValue && styles.fieldFilled]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${hasValue ? formatDisplay(value) : 'tap to select'}`}
      >
        <View style={styles.inner}>
          <Text style={[styles.label, hasValue && styles.labelFloated]}>{label}</Text>
          {hasValue && (
            <Text style={styles.valueText}>{formatDisplay(value)}</Text>
          )}
        </View>
        <View style={styles.rightIcons}>
          {optional && hasValue && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.calIcon}>📅</Text>
        </View>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}

      {/* iOS: needs an explicit Done button since spinner doesn't auto-dismiss */}
      {show && Platform.OS === 'ios' && (
        <TouchableOpacity style={styles.iosDone} onPress={() => setShow(false)}>
          <Text style={styles.iosDoneText}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c4bdb6',
    borderRadius: 4,
    backgroundColor: 'transparent',
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  fieldFilled: {
    borderColor: '#2e7d32',
  },
  inner: { flex: 1, justifyContent: 'center' },
  label: {
    fontSize: 16,
    color: '#4a4540',
  },
  labelFloated: {
    fontSize: 12,
    color: '#2e7d32',
    marginBottom: 2,
  },
  valueText: {
    fontSize: 16,
    color: '#1a1a18',
  },
  rightIcons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearIcon: { fontSize: 12, color: '#6b6b6b' },
  calIcon: { fontSize: 18 },
  iosDone: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
  },
  iosDoneText: { color: '#2e7d32', fontWeight: '600', fontSize: 16 },
});
