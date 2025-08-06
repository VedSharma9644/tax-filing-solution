import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

export const Progress = ({ value = 0, style, ...props }: ViewProps & { value?: number }) => (
  <View style={[styles.container, style]} {...props}>
    <View style={[styles.bar, { width: `${value}%` }]} />
  </View>
);

const styles = StyleSheet.create({
  container: { height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden', width: '100%' },
  bar: { height: 8, backgroundColor: '#007bff', borderRadius: 4 },
});