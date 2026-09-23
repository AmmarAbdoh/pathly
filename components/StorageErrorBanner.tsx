/**
 * StorageErrorBanner
 *
 * Tells the user when their data could not be saved or loaded, with a Retry.
 *
 * GoalsContext used to record these failures in state that nothing rendered,
 * so a failed write was invisible: the change looked saved, stayed in memory,
 * and was gone on the next launch.
 *
 * Covers both stores: a failed load (nothing is saved until it works), a
 * failed save (queued and retried; for rewards, a linked reward that could not
 * be redeemed), and stored data that could not be read at all and was set
 * aside. Other failed reward writes are undone and reported by the screen
 * that made them.
 */

import { DURATION } from '@/src/constants/animation';
import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useRewards } from '@/src/context/RewardsContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function StorageErrorBanner() {
  const {
    storageError: goalsError,
    dataSetAside: goalsSetAside,
    retryStorage,
    dismissStorageError: dismissGoalsError,
  } = useGoals();
  const {
    storageError: rewardsError,
    dataSetAside: rewardsSetAside,
    retryStorage: retryRewards,
    dismissStorageError: dismissRewardsError,
  } = useRewards();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      // Independent stores: retry whichever failed.
      await Promise.all([goalsError ? retryStorage() : null, rewardsError ? retryRewards() : null]);
    } finally {
      setIsRetrying(false);
    }
  }, [goalsError, rewardsError, retryStorage, retryRewards]);

  const handleDismiss = useCallback(() => {
    dismissGoalsError();
    dismissRewardsError();
  }, [dismissGoalsError, dismissRewardsError]);

  // A failed load comes first: until it is fixed, nothing is being saved.
  const error =
    goalsError === 'load'
      ? t.storageErrors.loadFailed
      : rewardsError === 'load'
        ? t.storageErrors.rewardsLoadFailed
        : goalsError === 'save'
          ? t.storageErrors.saveFailed
          : rewardsError === 'save'
            ? t.storageErrors.rewardsSaveFailed
            : null;
  // Said alongside any error, not instead of one or after it: it happens once,
  // and hidden behind an error it was dismissed with it, unseen.
  const setAside = goalsSetAside || rewardsSetAside ? t.storageErrors.unreadable : null;
  const message = [error, setAside].filter(Boolean).join('\n\n');

  if (!message) {
    return null;
  }

  // Data set aside has already been dealt with: only an error has a Retry.
  const canRetry = error !== null;

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

        {canRetry ? (
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
        ) : null}

        <Pressable
          onPress={handleDismiss}
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
