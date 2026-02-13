
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { THEME } from '../constants/theme';

export const Screen = ({ children, style, scroll = true }: any) => (
  <SafeAreaView style={[styles.screen, style]}>
    <StatusBar barStyle="light-content" />
    {scroll ? (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    ) : (
      <View style={styles.content}>{children}</View>
    )}
  </SafeAreaView>
);

export const NText = ({ children, variant = 'body', style, ...props }: any) => {
  const textStyle = [
    styles.text,
    variant === 'h1' && styles.h1,
    variant === 'h2' && styles.h2,
    variant === 'caption' && styles.caption,
    variant === 'mono' && styles.mono,
    variant === 'accent' && { color: THEME.colors.accent },
    style
  ];
  return <Text style={textStyle} {...props}>{children}</Text>;
};

export const NButton = ({ title, onPress, variant = 'primary', style }: any) => (
  <TouchableOpacity 
    activeOpacity={0.8} 
    onPress={onPress} 
    style={[
      styles.button, 
      variant === 'outline' && styles.buttonOutline,
      style
    ]}
  >
    <Text style={[
      styles.buttonText, 
      variant === 'outline' && { color: THEME.colors.textPrimary }
    ]}>
      {title.toUpperCase()}
    </Text>
  </TouchableOpacity>
);

export const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: THEME.colors.bg },
  scrollContent: { paddingBottom: THEME.spacing.xl },
  content: { flex: 1 },
  text: { color: THEME.colors.textPrimary, fontSize: 16, lineHeight: 26, fontFamily: 'Inter' },
  h1: { fontSize: 32, fontWeight: '700', letterSpacing: 4, textTransform: 'uppercase' },
  h2: { fontSize: 20, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' },
  caption: { fontSize: 11, color: THEME.colors.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase' },
  mono: { fontFamily: 'JetBrains Mono', fontSize: 13, letterSpacing: 0.5 },
  button: { backgroundColor: THEME.colors.textPrimary, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.colors.divider },
  buttonText: { color: THEME.colors.bg, fontSize: 12, fontWeight: '800', letterSpacing: 3 },
  divider: { height: 1, backgroundColor: THEME.colors.divider, marginVertical: THEME.spacing.md }
});
