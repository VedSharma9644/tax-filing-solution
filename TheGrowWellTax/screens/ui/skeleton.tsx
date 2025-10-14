import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

export const Skeleton = ({ style, ...props }: ViewProps) => (
  <View style={[styles.skeleton, style]} {...props} />
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#eee',
    borderRadius: 4,
    height: 20,
    marginVertical: 4,
  },
});
