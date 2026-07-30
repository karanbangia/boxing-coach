import type { ComponentType } from 'react';
import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';

type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'pro';
type TrainingMode = 'shadowboxing' | 'heavy_bag';
type OnboardingStepKey =
  | 'gender'
  | 'nickname'
  | 'experience'
  | 'goal'
  | 'training_mode'
  | 'routine'
  | 'weight'
  | 'height';

interface WorkoutConfigurationProperties {
  difficulty: Difficulty;
  training_mode: TrainingMode;
  total_rounds: number;
  round_duration_seconds: number;
  rest_duration_seconds: number;
}

export interface AnalyticsEventMap {
  onboarding_started: {
    entry: 'new' | 'resumed';
  };
  onboarding_step_completed: {
    step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    step_key: OnboardingStepKey;
  };
  recommended_workout_shown: WorkoutConfigurationProperties;
  onboarding_completed: {
    path: 'guest' | 'account' | 'skipped';
    experience: 'beginner' | 'intermediate' | 'advanced' | 'professional';
    goal: 'fitness' | 'fundamentals' | 'heavy_bag' | 'competition';
    training_mode: TrainingMode;
  };
  workout_started: WorkoutConfigurationProperties & {
    audio_cues_enabled: boolean;
    combo_instructions_enabled: boolean;
  };
  first_round_completed: WorkoutConfigurationProperties;
  workout_completed: WorkoutConfigurationProperties & {
    punches: number;
  };
  app_store_review_requested: {
    completed_workouts: number;
  };
  workout_abandoned: WorkoutConfigurationProperties & {
    phase: 'prep' | 'round' | 'rest';
    rounds_started: number;
  };
  training_reminder_permission_resolved: {
    result: 'granted' | 'denied' | 'not_requested' | 'unavailable';
  };
  program_viewed: {
    program: 'beginner_fundamentals' | 'heavy_bag_conditioning' | 'fight_camp';
  };
  program_session_loaded: {
    program: 'beginner_fundamentals' | 'heavy_bag_conditioning' | 'fight_camp';
    week: number;
    session: number;
  };
  program_session_completed: {
    program: 'beginner_fundamentals' | 'heavy_bag_conditioning' | 'fight_camp';
    week: number;
    session: number;
  };
  completion_rating_submitted: {
    rating: 'too_easy' | 'just_right' | 'too_hard';
  };
  next_workout_loaded: {
    source: 'adaptive' | 'program';
    difficulty: Difficulty;
    total_rounds: number;
  };
  punch_guide_opened: {
    source: 'setup' | 'profile';
  };
  punch_guide_prompt_dismissed: {
    source: 'setup';
  };
  paywall_viewed: {
    source: 'difficulty' | 'program' | 'progress' | 'preset' | 'profile';
  };
  purchase_completed: {
    product: 'lifetime';
  };
  purchase_restored: {
    entitlement_active: boolean;
  };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;

const ANALYTICS_EVENT_NAMES = new Set<AnalyticsEventName>([
  'onboarding_started',
  'onboarding_step_completed',
  'recommended_workout_shown',
  'onboarding_completed',
  'workout_started',
  'first_round_completed',
  'workout_completed',
  'app_store_review_requested',
  'workout_abandoned',
  'training_reminder_permission_resolved',
  'program_viewed',
  'program_session_loaded',
  'program_session_completed',
  'completion_rating_submitted',
  'next_workout_loaded',
  'punch_guide_opened',
  'punch_guide_prompt_dismissed',
  'paywall_viewed',
  'purchase_completed',
  'purchase_restored',
]);

type ErrorContext =
  | 'app_render'
  | 'app_store_review'
  | 'audio_configuration'
  | 'audio_playback'
  | 'authentication'
  | 'external_link'
  | 'profile_sync'
  | 'purchases'
  | 'training_reminders'
  | 'workout_history';

type ErrorTagValue = string | number | boolean;

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim() ?? '';
const POSTHOG_HOST = normalizeHttpsUrl(
  process.env.EXPO_PUBLIC_POSTHOG_HOST,
  'https://eu.i.posthog.com',
);
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? '';
const TELEMETRY_DEBUG_ENABLED = __DEV__
  && process.env.EXPO_PUBLIC_TELEMETRY_DEBUG_ENABLED === 'true';

let initialized = false;
let errorMonitoringEnabled = false;
let analyticsClient: PostHog | null = null;
const reportedAudioFailures = new Set<string>();

function normalizeHttpsUrl(value: string | undefined, fallback: string) {
  const candidate = value?.trim() || fallback;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.origin : fallback;
  } catch {
    return fallback;
  }
}

function isValidSentryDsn(value: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.username) && Boolean(url.host);
  } catch {
    return false;
  }
}

function scrubText(value: string | undefined) {
  if (!value) return value;
  return value.replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    '[redacted-email]',
  );
}

function scrubSentryEvent<EventType extends Sentry.Event>(event: EventType): EventType {
  const scrubbed = {
    ...event,
    user: undefined,
    request: undefined,
    extra: undefined,
    message: scrubText(event.message),
  } as EventType;

  if (scrubbed.exception?.values) {
    scrubbed.exception = {
      ...scrubbed.exception,
      values: scrubbed.exception.values.map(value => ({
        ...value,
        value: scrubText(value.value),
      })),
    };
  }

  if (scrubbed.breadcrumbs) {
    scrubbed.breadcrumbs = scrubbed.breadcrumbs.map(breadcrumb => ({
      ...breadcrumb,
      data: undefined,
      message: scrubText(breadcrumb.message),
    }));
  }

  return scrubbed;
}

export function initializeObservability() {
  if (initialized) return;
  initialized = true;

  if (isValidSentryDsn(SENTRY_DSN)) {
    Sentry.init({
      dsn: SENTRY_DSN,
      enabled: true,
      environment: __DEV__ ? 'development' : 'production',
      sendDefaultPii: false,
      attachScreenshot: false,
      enableNative: true,
      enableNativeCrashHandling: true,
      enableAutoSessionTracking: true,
      enableAutoPerformanceTracing: false,
      enableCaptureFailedRequests: false,
      sampleRate: 1,
      tracesSampleRate: 0,
      beforeSend: event => scrubSentryEvent(event),
    });
    errorMonitoringEnabled = true;
  }

  if (POSTHOG_API_KEY) {
    analyticsClient = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      captureAppLifecycleEvents: false,
      disableGeoip: true,
      disableRemoteFeatureFlags: true,
      disableSurveys: true,
      enableSessionReplay: false,
      errorTracking: {
        autocapture: false,
        exceptionSteps: { enabled: false },
      },
      personProfiles: 'identified_only',
      preloadFeatureFlags: false,
      sendFeatureFlagEvent: false,
      setDefaultPersonProperties: false,
      before_send: event => {
        if (
          !event
          || (
            event.event !== '$identify'
            && !ANALYTICS_EVENT_NAMES.has(event.event as AnalyticsEventName)
          )
        ) {
          return null;
        }

        const scrubbedEvent = { ...event };
        delete scrubbedEvent.$set;
        delete scrubbedEvent.$set_once;
        return scrubbedEvent;
      },
    });
  }
}

export function withErrorMonitoring<P extends Record<string, unknown>>(
  component: ComponentType<P>,
): ComponentType<P> {
  return errorMonitoringEnabled ? Sentry.wrap(component) : component;
}

export function trackEvent<Name extends AnalyticsEventName>(
  name: Name,
  properties: AnalyticsEventMap[Name],
) {
  if (TELEMETRY_DEBUG_ENABLED) {
    console.info(`[telemetry] ${name}`, properties);
  }
  analyticsClient?.capture(
    name,
    properties as unknown as Record<string, string | number | boolean>,
  );
}

export function identifyAnalyticsUser(firebaseUid: string) {
  analyticsClient?.identify(firebaseUid);
}

export function resetAnalyticsUser() {
  analyticsClient?.reset();
}

export function reportError(
  error: unknown,
  context: ErrorContext,
  tags: Record<string, ErrorTagValue> = {},
) {
  if (__DEV__) {
    console.warn(`[observability] ${context}`, error);
  }

  if (!errorMonitoringEnabled) return;
  const normalized = error instanceof Error ? error : new Error(String(error));
  Sentry.withScope(scope => {
    scope.setTag('boxing_coach.error_context', context);
    Object.entries(tags).forEach(([key, value]) => {
      scope.setTag(`boxing_coach.${key}`, String(value));
    });
    Sentry.captureException(normalized);
  });
}

export function reportAudioFailure(
  error: unknown,
  cue:
    | 'coach'
    | 'freestyle'
    | 'prep_tick'
    | 'rest_countdown'
    | 'round_end'
    | 'round_start'
    | 'session',
  operation: 'configure' | 'pause' | 'play' | 'replace' | 'resume' | 'seek',
) {
  const dedupeKey = `${cue}:${operation}`;
  if (reportedAudioFailures.has(dedupeKey)) return;
  reportedAudioFailures.add(dedupeKey);
  reportError(error, operation === 'configure' ? 'audio_configuration' : 'audio_playback', {
    cue,
    operation,
  });
}
