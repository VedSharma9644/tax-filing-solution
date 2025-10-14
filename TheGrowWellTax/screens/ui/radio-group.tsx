import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export const RadioGroup = ({ options, value, onValueChange, style }: {
  options: { label: string, value: string }[],
  value: string,
  onValueChange: (val: string) => void,
  style?: any,
}) => (
  <View style={style}>
    {options.map(opt => (
      <TouchableOpacity
        key={opt.value}
        style={styles.option}
        onPress={() => onValueChange(opt.value)}
      >
        <View style={[styles.circle, value === opt.value && styles.selected]} />
        <Text style={styles.label}>{opt.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  circle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#007bff', marginRight: 8 },
  selected: { backgroundColor: '#007bff' },
  label: { fontSize: 14 },
});