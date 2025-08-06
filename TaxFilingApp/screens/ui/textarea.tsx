import React from 'react';
import { TextInput, StyleSheet, TextInputProps, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const Textarea = React.forwardRef<TextInput, TextInputProps>((props, ref) => (
  <TextInput
    ref={ref}
    style={[styles.textarea, props.style]}
    multiline
    numberOfLines={4}
    textAlignVertical="top"
    {...props}
  />
));
Textarea.displayName = 'Textarea';

const styles = StyleSheet.create({
  textarea: {
    minHeight: Math.max(100, screenWidth * 0.25),
    maxHeight: Math.max(150, screenWidth * 0.35),
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Math.min(10, screenWidth * 0.025),
    paddingVertical: Math.min(8, screenWidth * 0.02),
    backgroundColor: '#fff',
    marginBottom: 12,
    fontSize: Math.min(14, screenWidth * 0.035),
  },
});