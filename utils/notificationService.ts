import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  assignmentReminders: boolean;
  dueTodayAlerts: boolean;
  dueTomorrowAlerts: boolean;
  weeklyDigest: boolean;
  reminderTime: string; // Format: "HH:MM"
}

export interface ScheduledNotification {
  id: string;
  assignmentId: number;
  courseId: number;
  assignmentName: string;
  courseName: string;
  dueDate: Date;
  notificationDate: Date;
  type: 'due_today' | 'due_tomorrow' | 'due_soon' | 'weekly_digest';
}

const STORAGE_KEYS = {
  NOTIFICATION_SETTINGS: 'notification_settings',
  SCHEDULED_NOTIFICATIONS: 'scheduled_notifications',
  PUSH_TOKEN: 'push_token',
};

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  assignmentReminders: true,
  dueTodayAlerts: true,
  dueTomorrowAlerts: true,
  weeklyDigest: true,
  reminderTime: '09:00',
};

class NotificationService {
  private static instance: NotificationService;
  private pushToken: string | null = null;
  private settings: NotificationSettings = DEFAULT_SETTINGS;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize the notification service
   */
  public async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      await this.registerForPushNotifications();
      await this.createNotificationChannels();
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Register for push notifications and get permission
   */
  public async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Permission for push notifications was denied');
        throw new Error('Notification permission denied');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your actual Expo project ID
      });

      this.pushToken = token.data;
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token.data);
      console.log('Push token:', token.data);

      return token.data;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      throw error;
    }
  }

  /**
   * Create notification channels for Android
   */
  private async createNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('assignment-alerts', {
        name: 'Assignment Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('weekly-digest', {
        name: 'Weekly Digest',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
    }
  }

  /**
   * Load notification settings from storage
   */
  public async loadSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
      return this.settings;
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save notification settings to storage
   */
  public async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      this.settings = settings;
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  /**
   * Get current notification settings
   */
  public getSettings(): NotificationSettings {
    return this.settings;
  }

  /**
   * Schedule a notification for an assignment
   */
  public async scheduleAssignmentNotification(
    assignmentId: number,
    courseId: number,
    assignmentName: string,
    courseName: string,
    dueDate: Date,
    type: 'due_today' | 'due_tomorrow' | 'due_soon' = 'due_soon'
  ): Promise<string | null> {
    if (!this.settings.enabled || !this.settings.assignmentReminders) {
      return null;
    }

    try {
      const now = new Date();
      let notificationDate: Date;
      let title: string;
      let body: string;

      switch (type) {
        case 'due_today':
          if (!this.settings.dueTodayAlerts) return null;
          notificationDate = new Date(dueDate);
          notificationDate.setHours(parseInt(this.settings.reminderTime.split(':')[0]));
          notificationDate.setMinutes(parseInt(this.settings.reminderTime.split(':')[1]));
          notificationDate.setSeconds(0);
          title = '📚 Assignment Due Today!';
          body = `${assignmentName} in ${courseName} is due today`;
          break;

        case 'due_tomorrow':
          if (!this.settings.dueTomorrowAlerts) return null;
          notificationDate = new Date(dueDate);
          notificationDate.setDate(notificationDate.getDate() - 1);
          notificationDate.setHours(parseInt(this.settings.reminderTime.split(':')[0]));
          notificationDate.setMinutes(parseInt(this.settings.reminderTime.split(':')[1]));
          notificationDate.setSeconds(0);
          title = '⏰ Assignment Due Tomorrow';
          body = `${assignmentName} in ${courseName} is due tomorrow`;
          break;

        case 'due_soon':
          notificationDate = new Date(dueDate);
          notificationDate.setDate(notificationDate.getDate() - 2);
          notificationDate.setHours(parseInt(this.settings.reminderTime.split(':')[0]));
          notificationDate.setMinutes(parseInt(this.settings.reminderTime.split(':')[1]));
          notificationDate.setSeconds(0);
          title = '📋 Upcoming Assignment';
          body = `${assignmentName} in ${courseName} is due in 2 days`;
          break;
      }

      // Don't schedule notifications for past dates
      if (notificationDate <= now) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            assignmentId,
            courseId,
            assignmentName,
            courseName,
            dueDate: dueDate.toISOString(),
            type,
          },
        },
        trigger: { 
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate 
        } as Notifications.DateTriggerInput,
      });

      // Store the scheduled notification
      await this.storeScheduledNotification({
        id: notificationId,
        assignmentId,
        courseId,
        assignmentName,
        courseName,
        dueDate,
        notificationDate,
        type,
      });

      console.log(`Scheduled ${type} notification for ${assignmentName} at ${notificationDate}`);
      return notificationId;
    } catch (error) {
      console.error('Failed to schedule assignment notification:', error);
      return null;
    }
  }

  /**
   * Schedule multiple notifications for an assignment (due soon, tomorrow, today)
   */
  public async scheduleAllAssignmentNotifications(
    assignmentId: number,
    courseId: number,
    assignmentName: string,
    courseName: string,
    dueDate: Date
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    // Schedule "due soon" notification (2 days before)
    const dueSoonId = await this.scheduleAssignmentNotification(
      assignmentId,
      courseId,
      assignmentName,
      courseName,
      dueDate,
      'due_soon'
    );
    if (dueSoonId) notificationIds.push(dueSoonId);

    // Schedule "due tomorrow" notification
    const dueTomorrowId = await this.scheduleAssignmentNotification(
      assignmentId,
      courseId,
      assignmentName,
      courseName,
      dueDate,
      'due_tomorrow'
    );
    if (dueTomorrowId) notificationIds.push(dueTomorrowId);

    // Schedule "due today" notification
    const dueTodayId = await this.scheduleAssignmentNotification(
      assignmentId,
      courseId,
      assignmentName,
      courseName,
      dueDate,
      'due_today'
    );
    if (dueTodayId) notificationIds.push(dueTodayId);

    return notificationIds;
  }

  /**
   * Cancel a scheduled notification
   */
  public async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.removeScheduledNotification(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Cancel all notifications for a specific assignment
   */
  public async cancelAssignmentNotifications(assignmentId: number): Promise<void> {
    try {
      const scheduled = await this.getScheduledNotifications();
      const assignmentNotifications = scheduled.filter(n => n.assignmentId === assignmentId);
      
      for (const notification of assignmentNotifications) {
        await this.cancelNotification(notification.id);
      }
    } catch (error) {
      console.error('Failed to cancel assignment notifications:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Store a scheduled notification record
   */
  private async storeScheduledNotification(notification: ScheduledNotification): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
      const notifications: ScheduledNotification[] = stored ? JSON.parse(stored) : [];
      notifications.push(notification);
      await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to store scheduled notification:', error);
    }
  }

  /**
   * Remove a scheduled notification record
   */
  private async removeScheduledNotification(notificationId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
      if (stored) {
        const notifications: ScheduledNotification[] = JSON.parse(stored);
        const filtered = notifications.filter(n => n.id !== notificationId);
        await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS, JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('Failed to remove scheduled notification:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  public async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_NOTIFICATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Clean up expired notifications
   */
  public async cleanupExpiredNotifications(): Promise<void> {
    try {
      const now = new Date();
      const scheduled = await this.getScheduledNotifications();
      const expired = scheduled.filter(n => new Date(n.dueDate) < now);
      
      for (const notification of expired) {
        await this.cancelNotification(notification.id);
      }
    } catch (error) {
      console.error('Failed to cleanup expired notifications:', error);
    }
  }

  /**
   * Send an immediate notification (for testing)
   */
  public async sendImmediateNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send immediate notification:', error);
    }
  }

  /**
   * Get the push token
   */
  public getPushToken(): string | null {
    return this.pushToken;
  }
}

export default NotificationService.getInstance();
