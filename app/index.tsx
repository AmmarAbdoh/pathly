/**
 * App entry point
 * Redirects to the home tab
 */

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}