import React from 'react';
import { View, Text, StyleSheet, ViewProps, TextProps } from 'react-native';

export const Alert = ({ style, ...props }: ViewProps) => (
  <View style={[styles.alert, style]} {...props} />
);
export const AlertTitle = ({ style, ...props }: TextProps) => (
  <Text style={[styles.title, style]} {...props} />
);
export const AlertDescription = ({ style, ...props }: TextProps) => (
  <Text style={[styles.description, style]} {...props} />
);

const styles = StyleSheet.create({
  alert: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#333',
  },
});