import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface ButtonProps {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradient?: boolean;
}

/**
 * 🔘 Reusable Button component
 * - Supports multiple variants & sizes
 * - Optional gradient background
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
  gradient = false,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'destructive':
        return { backgroundColor: '#EF4444' };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#22D3EE' };
      case 'secondary':
        return { backgroundColor: '#64748B' };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'link':
        return { backgroundColor: 'transparent' };
      default:
        return { backgroundColor: '#FB923C' };
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 32 };
      case 'icon':
        return { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const containerStyle = [
    styles.base,
    getVariantStyle(),
    getSizeStyle(),
    disabled && styles.disabled,
    style,
  ];

  const textVariantStyle: TextStyle = variant === 'link'
    ? { color: '#22D3EE', textDecorationLine: 'underline' }
    : { color: '#FFFFFF' };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={containerStyle}
    >
      {gradient && variant === 'default' ? (
        <LinearGradient
          colors={['#FB923C', '#F97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, getSizeStyle()]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.text, textVariantStyle, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      ) : loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, textVariantStyle, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22D3EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  gradient: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 12,
  },
});

export default Button;
