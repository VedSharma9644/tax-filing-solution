import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DataLoadingScreenProps {
  message?: string;
}

const DataLoadingScreen: React.FC<DataLoadingScreenProps> = ({ 
  message = 'Loading your saved data...' 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="document-text-outline" size={64} color="#007bff" />
        </View>
        
        <Text style={styles.title}>Tax Filing Form</Text>
        <Text style={styles.message}>{message}</Text>
        
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
        
        <Text style={styles.subtitle}>
          Please wait while we restore your progress...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  loader: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default DataLoadingScreen;
