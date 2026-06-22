import { router } from 'expo-router';

/**
 * Go back, but fall back to Home when there's no history to pop — e.g. after a
 * router.replace() (Scan) or when a screen was opened via a deep link. Plain
 * router.back() silently does nothing in those cases, which reads as a
 * "broken" back button.
 */
export const goBack = () => {
  if (router.canGoBack()) router.back();
  else router.replace('/');
};
