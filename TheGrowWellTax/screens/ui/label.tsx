import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';

export const Label = ({ style, ...props }: TextProps) => (
  <Text style={[styles.label, style]} {...props} />
);

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 4 },
});