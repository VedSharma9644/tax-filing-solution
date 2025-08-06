import React from 'react';
import { View, Image, Text, StyleSheet, ImageProps } from 'react-native';

export const Avatar = ({ source, fallback, style, ...props }: { source?: ImageProps['source']; fallback?: string; style?: any }) => (
  source ? (
    <Image source={source} style={[styles.avatar, style]} {...props} />
  ) : (
    <View style={[styles.avatar, style, styles.fallback]} {...props}>
      <Text style={styles.fallbackText}>{fallback || '?'}</Text>
    </View>
  )
);

const styles = StyleSheet.create({
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  fallback: { backgroundColor: '#007bff' },
  fallbackText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});
