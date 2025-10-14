import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({ 
  children, 
  style, 
  edges = ['top', 'bottom', 'left', 'right'] 
}) => {
  return (
    <SafeAreaView 
      style={[styles.container, style]} 
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    ...(Platform.OS === 'android' && {
      paddingTop: Platform.Version >= 21 ? 0 : 20,
    }),
  },
});

export default SafeAreaWrapper; 