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
  const { storageError: goalsError, retryStorage, dismissStorageError: dismissGoalsError } =
    useGoals();
  const {
    storageError: rewardsError,
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
      // Independent stores: retry whichever failed. (Unreadable data has
      // already been dealt with; there is nothing to retry.)
      await Promise.all([
        goalsError === 'load' || goalsError === 'save' ? retryStorage() : null,
        rewardsError === 'load' || rewardsError === 'save' ? retryRewards() : null,
      ]);
    } finally {
      setIsRetrying(false);
    }
  }, [goalsError, rewardsError, retryStorage, retryRewards]);

  const handleDismiss = useCallback(() => {
    dismissGoalsError();
    dismissRewardsError();
  }, [dismissGoalsError, dismissRewardsError]);

  // A failed load comes first: until it is fixed, nothing is being saved.
  const message =
    goalsError === 'load'
      ? t.storageErrors.loadFailed
      : rewardsError === 'load'
        ? t.storageErrors.rewardsLoadFailed
        : goalsError === 'save'
          ? t.storageErrors.saveFailed
          : rewardsError === 'save'
            ? t.storageErrors.rewardsSaveFailed
            : goalsError === 'unreadable' || rewardsError === 'unreadable'
              ? t.storageErrors.unreadable
              : null;

  if (!message) {
    return null;
  }

  // Unreadable data has already been set aside: there is nothing to retry.
  const canRetry = [goalsError, rewardsError].some((e) => e === 'load' || e === 'save');

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
