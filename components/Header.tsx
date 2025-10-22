/**
 * Header component
 * App header with title and subtitle
 */

import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * App header component with memoization
 */
const Header = memo(() => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const titleStyle = useMemo(
    () => [styles.title, { color: theme.colors.primary }],
    [theme]
  );

  const subtitleStyle = useMemo(
    () => [styles.subtitle, { color: theme.colors.textSecondary }],
    [theme]
  );

  return (
    <View style={styles.container}>
      <Text style={titleStyle} accessibilityRole="header">
        {t.home.title}
      </Text>
      <Text style={subtitleStyle}>{t.home.subtitle}</Text>
    </View>
  );
});

Header.displayName = 'Header';

export default Header;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    letterSpacing: 0.2,
  },
});
