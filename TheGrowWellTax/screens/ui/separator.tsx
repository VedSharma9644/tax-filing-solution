import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

export const Separator = ({ style, ...props }: ViewProps) => (
  <View style={[styles.separator, style]} {...props} />
);

const styles = StyleSheet.create({
  separator: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
});