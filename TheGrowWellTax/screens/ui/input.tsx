import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

export const Input = React.forwardRef<TextInput, TextInputProps>((props, ref) => (
  <TextInput
    ref={ref}
    style={[styles.input, props.style]}
    {...props}
  />
));
Input.displayName = 'Input';

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
});