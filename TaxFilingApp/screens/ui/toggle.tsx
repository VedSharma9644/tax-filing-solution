import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';

export const Toggle = ({ value, onValueChange, label, style, ...props }: {
  value: boolean,
  onValueChange: (val: boolean) => void,
  label?: string,
  style?: any,
} & TouchableOpacityProps) => (
  <TouchableOpacity
    style={[styles.toggle, value && styles.active, style]}
    onPress={() => onValueChange(!value)}
    {...props}
  >
    <Text style={styles.text}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  toggle: {
    backgroundColor: '#eee',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginVertical: 4,
  },
  active: {
    backgroundColor: '#007bff',
  },
  text: {
    color: '#333',
    fontWeight: 'bold',
  },
});
