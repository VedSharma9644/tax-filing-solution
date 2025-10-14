import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, TouchableOpacityProps, ViewStyle, TextStyle, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning' | 'premium' | 'mobile';
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon' | 'mobile';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<string, ViewStyle> = {
  default: { backgroundColor: '#0E502B' },
  destructive: { backgroundColor: '#dc3545' },
  outline: { borderWidth: 1, borderColor: '#0E502B', backgroundColor: '#fff' },
  secondary: { backgroundColor: '#6c757d' },
  ghost: { backgroundColor: 'transparent' },
  link: { backgroundColor: 'transparent' },
  success: { backgroundColor: '#28a745' },
  warning: { backgroundColor: '#ffc107' },
  premium: { backgroundColor: '#6f42c1' },
  mobile: { backgroundColor: '#0E502B', borderRadius: 12, height: Math.max(48, screenWidth * 0.12) },
};

const sizeStyles: Record<string, ViewStyle> = {
  default: { 
    paddingVertical: Math.min(12, screenWidth * 0.03), 
    paddingHorizontal: Math.min(24, screenWidth * 0.06) 
  },
  sm: { 
    paddingVertical: Math.min(8, screenWidth * 0.02), 
    paddingHorizontal: Math.min(16, screenWidth * 0.04) 
  },
  lg: { 
    paddingVertical: Math.min(16, screenWidth * 0.04), 
    paddingHorizontal: Math.min(32, screenWidth * 0.08) 
  },
  xl: { 
    paddingVertical: Math.min(20, screenWidth * 0.05), 
    paddingHorizontal: Math.min(40, screenWidth * 0.1) 
  },
  icon: { 
    padding: Math.min(12, screenWidth * 0.03) 
  },
  mobile: { 
    paddingVertical: Math.min(14, screenWidth * 0.035), 
    paddingHorizontal: Math.min(28, screenWidth * 0.07) 
  },
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  size = 'default',
  style,
  textStyle,
  ...props
}) => {
  // Check if children contains React elements (like icons)
  const hasReactElements = React.Children.toArray(children).some(
    child => React.isValidElement(child)
  );

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantStyles[variant] || variantStyles.default,
        sizeStyles[size] || sizeStyles.default,
        style,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      {hasReactElements ? (
        <View style={styles.contentContainer}>
          {children}
        </View>
      ) : (
        <Text style={[styles.text, textStyle]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    minHeight: Math.max(44, screenWidth * 0.11),
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: Math.min(16, screenWidth * 0.04),
  },
});

export { Button };
