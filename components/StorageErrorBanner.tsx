/**
 * StorageErrorBanner
 *
 * Tells the user when their data could not be saved or loaded, with a Retry.
 *
 * GoalsContext used to record these failures in state that nothing rendered,
 * so a failed write was invisible: the change looked saved, stayed in memory,
 * and was gone on the next launch.
 */

import { DURATION } from '@/src/constants/animation';
import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StorageErrorBanner() {
  const { storageError, retryStorage, dismissStorageError } = useGoals();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await retryStorage();
    } finally {
      setIsRetrying(false);
    }
  }, [retryStorage]);

  if (!storageError) {
    return null;
  }

  const message =
    storageError === 'load' ? t.storageErrors.loadFailed : t.storageErrors.saveFailed;

  return (
    <Animated.View
      entering={FadeInUp.duration(DURATION.normal)}
      exiting={FadeOutUp.duration(DURATION.fast)}
      style={[styles.container, { top: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      <View
        style={[styles.banner, { backgroundColor: theme.colors.danger }, theme.shadows.small]}
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
      >
        <Ionicons name="warning-outline" size={20} color="#FFF" />
        <Text style={styles.message}>{message}</Text>

        <Pressable
          onPress={handleRetry}
          disabled={isRetrying}
          style={styles.retry}
          accessibilityRole="button"
          accessibilityLabel={t.storageErrors.retry}
          hitSlop={6}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color={theme.colors.danger} />
          ) : (
            <Text style={[styles.retryText, { color: theme.colors.danger }]}>
              {t.storageErrors.retry}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={dismissStorageError}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color="#FFF" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  message: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  retry: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 64,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
