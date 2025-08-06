import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';

export const Badge = ({ children, style, ...props }: ViewProps & { children: React.ReactNode }) => (
  <View style={[styles.badge, style]} {...props}>
    <Text style={styles.text}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: { backgroundColor: '#eee', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  text: { color: '#333', fontSize: 12, fontWeight: 'bold' },
});
