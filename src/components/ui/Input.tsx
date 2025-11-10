import React from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface InputProps extends TextInputProps {
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

/**
 * ✏️ Reusable Input component
 * - Matches your web design’s cyan border & dark background
 * - Can be used for wallet address or other fields
 */
export const Input: React.FC<InputProps> = ({
  containerStyle,
  inputStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[styles.input, inputStyle]}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 3,
    borderColor: '#22D3EE',
    borderRadius: 16,
    backgroundColor: '#1E293B',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    height: 50,
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 15,
    borderRadius: 16,
  },
});

export default Input;
