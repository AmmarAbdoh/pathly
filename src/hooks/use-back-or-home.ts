/**
 * useBackOrHome
 *
 * Pops the navigation stack, falling back to the home tab when there is
 * nothing to pop.
 *
 * Every screen in this app is reachable directly - by deep link via the
 * `pathly` scheme, or as the first route of a cold start - and in that case
 * `router.back()` silently does nothing and strands the user with a back
 * button that appears broken.
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/** Where to land when there is no history to return to. */
const FALLBACK_ROUTE = '/(tabs)/home' as const;

export function useBackOrHome(): () => void {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(FALLBACK_ROUTE);
    }
  }, [router]);
}
