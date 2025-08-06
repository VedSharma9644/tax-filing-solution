import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export const ToggleGroup = ({ options, value, onValueChange, style }: {
  options: { label: string, value: string }[],
  value: string,
  onValueChange: (val: string) => void,
  style?: any,
}) => (
  <View style={[styles.group, style]}>
    {options.map(opt => (
      <TouchableOpacity
        key={opt.value}
        style={[styles.toggle, value === opt.value && styles.active]}
        onPress={() => onValueChange(opt.value)}
      >
        <Text style={styles.text}>{opt.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  group: { flexDirection: 'row', gap: 8 },
  toggle: { backgroundColor: '#eee', borderRadius: 8, padding: 12, alignItems: 'center', marginVertical: 4 },
  active: { backgroundColor: '#007bff' },
  text: { color: '#333', fontWeight: 'bold' },
});
