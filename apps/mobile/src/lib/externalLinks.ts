import { Alert, Linking } from 'react-native';
import { reportError } from './observability';

const DEFAULT_SITE_URL = 'https://boxing-coach.netlify.app';
const configuredSiteUrl = process.env.EXPO_PUBLIC_WEBSITE_URL?.trim();

export const BOXING_COACH_SITE_URL = (
  configuredSiteUrl?.startsWith('https://') ? configuredSiteUrl : DEFAULT_SITE_URL
).replace(/\/+$/, '');

export const EXTERNAL_LINKS = {
  privacy: `${BOXING_COACH_SITE_URL}/privacy.html`,
  terms: `${BOXING_COACH_SITE_URL}/terms.html`,
  support: `${BOXING_COACH_SITE_URL}/support.html`,
} as const;

export async function openExternalLink(url: string, label: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) throw new Error('Unsupported URL');
    await Linking.openURL(url);
  } catch (error) {
    reportError(error, 'external_link', {
      destination: label.toLowerCase().replace(/\s+/g, '_'),
    });
    Alert.alert(
      `${label} unavailable`,
      `We could not open ${label.toLowerCase()}. Please try again when you are online.`,
    );
  }
}
