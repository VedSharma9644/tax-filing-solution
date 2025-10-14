import React from 'react';
import { View, Text, StyleSheet, ViewProps, TextProps, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const Card = ({ style, ...props }: ViewProps) => (
  <View style={[styles.card, style]} {...props} />
);
export const CardHeader = ({ style, ...props }: ViewProps) => (
  <View style={[styles.header, style]} {...props} />
);
export const CardTitle = ({ style, ...props }: TextProps) => (
  <Text style={[styles.title, style]} {...props} />
);
export const CardDescription = ({ style, ...props }: TextProps) => (
  <Text style={[styles.description, style]} {...props} />
);
export const CardContent = ({ style, ...props }: ViewProps) => (
  <View style={[styles.content, style]} {...props} />
);

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    borderRadius: Math.min(12, screenWidth * 0.03), 
    marginBottom: Math.min(16, screenWidth * 0.04), 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: { 
    padding: Math.min(12, screenWidth * 0.03) 
  },
  title: { 
    fontSize: Math.min(18, screenWidth * 0.045), 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  description: { 
    color: '#888', 
    fontSize: Math.min(14, screenWidth * 0.035), 
    marginBottom: 8 
  },
  content: { 
    padding: Math.min(12, screenWidth * 0.03) 
  },
});
