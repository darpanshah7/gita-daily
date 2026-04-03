import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  label?: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

export function DropdownPicker<T extends string>({ label, value, options, onChange }: Props<T>) {
  const c = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <View>
        {label ? (
          <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
        ) : null}
        <TouchableOpacity
          onPress={() => setOpen(true)}
          style={[styles.trigger, { backgroundColor: c.surface, borderColor: c.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.triggerText, { color: c.text }]} numberOfLines={1}>
            {selected?.label ?? value}
          </Text>
          <Ionicons name="chevron-down" size={16} color={c.textMuted} />
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.sheet, { backgroundColor: c.surface }]}>
                <Text style={[styles.sheetTitle, { color: c.accent, borderBottomColor: c.border }]}>
                  {label ?? 'Select'}
                </Text>
                <FlatList
                  data={options}
                  keyExtractor={item => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => { onChange(item.value); setOpen(false); }}
                      style={[
                        styles.option,
                        { borderBottomColor: c.border },
                        item.value === value && { backgroundColor: c.surfaceAlt },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.optionText, { color: c.text }]}>{item.label}</Text>
                      {item.value === value && (
                        <Ionicons name="checkmark-circle" size={18} color={c.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerText: { fontSize: 15, fontWeight: '500', flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: 480,
  },
  sheetTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 15 },
});
