import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, ScrollView } from 'react-native';
import { Text, Button, Dialog, Portal } from 'react-native-paper';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  style?: ViewStyle;
  optional?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_DAYS = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso ? iso.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];
  return { y, m: m - 1, d };
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatDisplay(iso: string): string {
  if (!iso) return '';
  const { y, m, d } = parseISO(iso);
  return `${MONTHS[m]} ${d}, ${y}`;
}

function buildYears(): number[] {
  const cur = new Date().getFullYear();
  const years: number[] = [];
  for (let i = cur + 5; i >= 1900; i--) years.push(i);
  return years;
}

const YEARS = buildYears();

interface ColProps {
  items: (string | number)[];
  selected: number;
  onSelect: (i: number) => void;
}

function Column({ items, selected, onSelect }: ColProps) {
  return (
    <ScrollView style={styles.col} showsVerticalScrollIndicator={false}>
      {items.map((item, i) => (
        <TouchableOpacity key={i} style={[styles.colItem, i === selected && styles.colItemSelected]} onPress={() => onSelect(i)}>
          <Text style={[styles.colText, i === selected && styles.colTextSelected]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export default function DatePickerField({ label, value, onChange, style, optional }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const { y: initY, m: initM, d: initD } = parseISO(value || '');
  const [selYear, setSelYear] = useState(initY);
  const [selMonth, setSelMonth] = useState(initM);
  const [selDay, setSelDay] = useState(initD);

  const hasValue = !!value;
  const daysInMonth = MONTH_DAYS(selYear, selMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function handleOpen() {
    const { y, m, d } = parseISO(value || '');
    setSelYear(y);
    setSelMonth(m);
    setSelDay(Math.min(d, MONTH_DAYS(y, m)));
    setOpen(true);
  }

  function handleConfirm() {
    const safeDay = Math.min(selDay, daysInMonth);
    onChange(toISO(selYear, selMonth, safeDay));
    setOpen(false);
  }

  function handleClear() {
    onChange('');
  }

  const yearIdx = YEARS.indexOf(selYear);
  const dayIdx = Math.min(selDay, daysInMonth) - 1;

  return (
    <View style={style}>
      <TouchableOpacity
        onPress={handleOpen}
        activeOpacity={0.7}
        style={[styles.field, hasValue && styles.fieldFilled]}
        accessibilityRole="button"
      >
        <View style={styles.inner}>
          <Text style={[styles.labelText, hasValue && styles.labelFloated]}>{label}</Text>
          {hasValue && <Text style={styles.valueText}>{formatDisplay(value)}</Text>}
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

      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)} style={styles.dialog}>
          <Dialog.Title>{label}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.pickerRow}>
              <Column
                items={MONTHS}
                selected={selMonth}
                onSelect={setSelMonth}
              />
              <Column
                items={days}
                selected={dayIdx}
                onSelect={(i) => setSelDay(i + 1)}
              />
              <Column
                items={YEARS}
                selected={yearIdx >= 0 ? yearIdx : 0}
                onSelect={(i) => setSelYear(YEARS[i])}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleConfirm}>Set Date</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c4bdb6',
    borderRadius: 4,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  fieldFilled: { borderColor: '#2e7d32' },
  inner: { flex: 1, justifyContent: 'center' },
  labelText: { fontSize: 16, color: '#4a4540' },
  labelFloated: { fontSize: 12, color: '#2e7d32', marginBottom: 2 },
  valueText: { fontSize: 16, color: '#1a1a18' },
  rightIcons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearIcon: { fontSize: 12, color: '#6b6b6b' },
  calIcon: { fontSize: 18 },
  dialog: { maxHeight: '80%' },
  pickerRow: { flexDirection: 'row', height: 200 },
  col: { flex: 1 },
  colItem: { paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  colItemSelected: { backgroundColor: '#c8e6c9', borderRadius: 6 },
  colText: { fontSize: 15, color: '#4a4540' },
  colTextSelected: { color: '#2e7d32', fontWeight: '700' },
});
