import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';

export const Checkbox = ({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (checked: boolean) => void }) => (
  <TouchableOpacity
    style={[styles.box, checked && styles.checked]}
    onPress={() => onCheckedChange(!checked)}
  >
    {checked && <View style={styles.inner} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  box: { width: 24, height: 24, borderWidth: 2, borderColor: '#007bff', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: '#007bff' },
  inner: { width: 12, height: 12, backgroundColor: '#fff', borderRadius: 2 },
});
