import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { SessionDuration, TrainingDay } from '../features/profile/types';
import type { ReminderPermission } from './onboarding';

const REMINDER_CHANNEL_ID = 'training-reminders';
const REMINDER_IDENTIFIERS_KEY = 'boxing-coach-training-reminder-identifiers:v1';
const REMINDER_HOUR = 19;
const REMINDER_MINUTE = 0;

interface TrainingReminderMessage {
  title: string;
  body: (day: TrainingDay, duration: SessionDuration) => string;
}

const TRAINING_DAY_LABELS: Record<TrainingDay, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

export const TRAINING_REMINDER_MESSAGES: readonly TrainingReminderMessage[] = [
  {
    title: 'Your gloves are waiting 🥊',
    body: (_day, duration) =>
      `Time for today’s ${duration}-minute Boxing Coach session.`,
  },
  {
    title: 'Your corner is calling 🥊',
    body: (day, duration) =>
      `${TRAINING_DAY_LABELS[day]} training is ready. Give it ${duration} focused minutes.`,
  },
  {
    title: 'Time to put in the rounds',
    body: (_day, duration) =>
      `Your ${duration}-minute boxing session starts when you do.`,
  },
  {
    title: 'Stay sharp, boxer',
    body: (day, duration) =>
      `Keep your ${TRAINING_DAY_LABELS[day]} promise with a ${duration}-minute workout.`,
  },
  {
    title: 'Show up for yourself',
    body: (_day, duration) =>
      `${duration} minutes today can make the next round feel different.`,
  },
  {
    title: 'The bell is yours 🔔',
    body: (day, duration) =>
      `Step into your ${TRAINING_DAY_LABELS[day]} session and train for ${duration} minutes.`,
  },
] as const;

const WEEKDAY_BY_TRAINING_DAY: Record<TrainingDay, number> = {
  monday: 2,
  tuesday: 3,
  wednesday: 4,
  thursday: 5,
  friday: 6,
  saturday: 7,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function randomTrainingReminderMessage(
  day: TrainingDay,
  duration: SessionDuration,
): { title: string; body: string } {
  const message = TRAINING_REMINDER_MESSAGES[
    Math.floor(Math.random() * TRAINING_REMINDER_MESSAGES.length)
  ];
  return {
    title: message.title,
    body: message.body(day, duration),
  };
}

async function configureReminderChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Training reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180, 100, 180],
    lightColor: '#FF1414',
  });
}

async function loadReminderIdentifiers(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_IDENTIFIERS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function requestTrainingReminderPermission(): Promise<ReminderPermission> {
  try {
    await configureReminderChannel();

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return 'granted';

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

export async function cancelTrainingReminders(): Promise<void> {
  const identifiers = await loadReminderIdentifiers();
  await Promise.all(
    identifiers.map(identifier =>
      Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
    ),
  );
  await AsyncStorage.removeItem(REMINDER_IDENTIFIERS_KEY);
}

export async function scheduleTrainingReminders(
  trainingDays: TrainingDay[],
  duration: SessionDuration,
): Promise<string[]> {
  await cancelTrainingReminders();
  if (!trainingDays.length) return [];

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return [];

  await configureReminderChannel();
  const identifiers: string[] = [];
  try {
    for (const day of trainingDays) {
      const message = randomTrainingReminderMessage(day, duration);
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          sound: 'default',
          data: { type: 'training_reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: WEEKDAY_BY_TRAINING_DAY[day],
          hour: REMINDER_HOUR,
          minute: REMINDER_MINUTE,
          channelId: REMINDER_CHANNEL_ID,
        },
      });
      identifiers.push(identifier);
    }
  } finally {
    if (identifiers.length) {
      await AsyncStorage.setItem(REMINDER_IDENTIFIERS_KEY, JSON.stringify(identifiers));
    }
  }
  return identifiers;
}

export async function sendTestTrainingReminder(): Promise<{
  permission: ReminderPermission;
  message: { title: string; body: string } | null;
}> {
  const permission = await requestTrainingReminderPermission();
  if (permission !== 'granted') return { permission, message: null };

  const message = randomTrainingReminderMessage('monday', 20);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: message.title,
      body: message.body,
      sound: 'default',
      data: { type: 'training_reminder_test' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
  return { permission, message };
}
