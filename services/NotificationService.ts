import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { PrayerTimes } from '../types';
import { PrayerTimesService } from './PrayerTimesService';

export interface NotificationSettings {
  enabled: boolean;
  offsetMinutes: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export class NotificationService {
  private static readonly NOTIFICATION_CHANNEL_ID = 'prayer-times';
  private static readonly NOTIFICATION_GROUP_ID = 'prayer-notifications';

  /**
   * Request notification permissions from the user
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Check if notification permissions are granted
   */
  static async checkPermissions(): Promise<boolean> {
    try {
      const result = await LocalNotifications.checkPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Failed to check notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule notifications for all prayer times
   */
  static async schedulePrayerNotifications(
    prayerTimes: PrayerTimes,
    settings: NotificationSettings
  ): Promise<void> {
    if (!settings.enabled) {
      return;
    }

    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Notification permissions not granted');
      }
    }

    // Clear existing prayer notifications
    await this.clearPrayerNotifications();

    const notifications: ScheduleOptions[] = [];
    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr, arabicName: 'الفجر' },
      { name: 'Dhuhr', time: prayerTimes.dhuhr, arabicName: 'الظهر' },
      { name: 'Asr', time: prayerTimes.asr, arabicName: 'العصر' },
      { name: 'Maghrib', time: prayerTimes.maghrib, arabicName: 'المغرب' },
      { name: 'Isha', time: prayerTimes.isha, arabicName: 'العشاء' }
    ];

    prayers.forEach((prayer, index) => {
      const notificationTime = new Date(prayer.time);
      notificationTime.setMinutes(notificationTime.getMinutes() - settings.offsetMinutes);

      // Only schedule if the notification time is in the future
      if (notificationTime > new Date()) {
        notifications.push({
          title: `${prayer.name} Prayer Time`,
          body: `${prayer.name} (${prayer.arabicName}) prayer time is in ${settings.offsetMinutes} minutes`,
          id: this.getPrayerNotificationId(`${prayer.name}-reminder`, prayerTimes.date),
          schedule: { at: notificationTime },
          sound: settings.soundEnabled ? 'default' : undefined,
          attachments: undefined,
          actionTypeId: '',
          extra: {
            prayerName: prayer.name,
            prayerTime: prayer.time.toISOString(),
            type: 'prayer-reminder'
          }
        });

        // Schedule exact prayer time notification
        if (prayer.time > new Date()) {
          notifications.push({
            title: `${prayer.name} Prayer Time`,
            body: `It's time for ${prayer.name} (${prayer.arabicName}) prayer`,
            id: this.getPrayerNotificationId(`${prayer.name}-exact`, prayerTimes.date),
            schedule: { at: prayer.time },
            sound: settings.soundEnabled ? 'default' : undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: {
              prayerName: prayer.name,
              prayerTime: prayer.time.toISOString(),
              type: 'prayer-time'
            }
          });
        }
      }
    });

    if (notifications.length > 0) {
      await LocalNotifications.schedule({
        notifications
      });
    }
  }

  /**
   * Schedule notifications for multiple days
   */
  static async scheduleWeeklyPrayerNotifications(
    weeklyPrayerTimes: PrayerTimes[],
    settings: NotificationSettings
  ): Promise<void> {
    if (!settings.enabled) {
      return;
    }

    // Clear existing notifications
    await this.clearPrayerNotifications();

    // Schedule notifications for each day
    for (const dayPrayerTimes of weeklyPrayerTimes) {
      await this.schedulePrayerNotifications(dayPrayerTimes, settings);
    }
  }

  /**
   * Clear all prayer-related notifications
   */
  static async clearPrayerNotifications(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      const prayerNotificationIds = pending.notifications
        .filter(notification => 
          notification.extra?.type === 'prayer-reminder' || 
          notification.extra?.type === 'prayer-time'
        )
        .map(notification => notification.id);

      if (prayerNotificationIds.length > 0) {
        await LocalNotifications.cancel({
          notifications: prayerNotificationIds.map(id => ({ id }))
        });
      }
    } catch (error) {
      console.error('Failed to clear prayer notifications:', error);
    }
  }

  /**
   * Get pending prayer notifications
   */
  static async getPendingPrayerNotifications(): Promise<any[]> {
    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications.filter(notification => 
        notification.extra?.type === 'prayer-reminder' || 
        notification.extra?.type === 'prayer-time'
      );
    } catch (error) {
      console.error('Failed to get pending notifications:', error);
      return [];
    }
  }

  /**
   * Schedule a single prayer notification
   */
  static async scheduleSinglePrayerNotification(
    prayerName: string,
    prayerTime: Date,
    offsetMinutes: number,
    settings: NotificationSettings
  ): Promise<void> {
    if (!settings.enabled) {
      return;
    }

    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Notification permissions not granted');
      }
    }

    const notificationTime = new Date(prayerTime);
    notificationTime.setMinutes(notificationTime.getMinutes() - offsetMinutes);

    if (notificationTime > new Date()) {
      const arabicNames: { [key: string]: string } = {
        'Fajr': 'الفجر',
        'Dhuhr': 'الظهر',
        'Asr': 'العصر',
        'Maghrib': 'المغرب',
        'Isha': 'العشاء'
      };

      await LocalNotifications.schedule({
        notifications: [{
          title: `${prayerName} Prayer Time`,
          body: `${prayerName} (${arabicNames[prayerName] || ''}) prayer time is in ${offsetMinutes} minutes`,
          id: this.getPrayerNotificationId(prayerName, new Date()),
          schedule: { at: notificationTime },
          sound: settings.soundEnabled ? 'default' : undefined,
          attachments: undefined,
          actionTypeId: '',
          extra: {
            prayerName,
            prayerTime: prayerTime.toISOString(),
            type: 'prayer-reminder'
          }
        }]
      });
    }
  }

  /**
   * Test notification functionality
   */
  static async sendTestNotification(): Promise<void> {
    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Notification permissions not granted');
      }
    }

    const testTime = new Date();
    testTime.setSeconds(testTime.getSeconds() + 5); // 5 seconds from now

    await LocalNotifications.schedule({
      notifications: [{
        title: 'Prayer Times Test',
        body: 'This is a test notification for prayer times',
        id: 99999,
        schedule: { at: testTime },
        sound: 'default',
        attachments: undefined,
        actionTypeId: '',
        extra: {
          type: 'test'
        }
      }]
    });
  }

  /**
   * Handle notification actions and clicks
   */
  static setupNotificationListeners(): void {
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Notification received:', notification);
      
      if (notification.extra?.type === 'prayer-time' || notification.extra?.type === 'prayer-reminder') {
        // Handle prayer notification received
        this.handlePrayerNotification(notification);
      }
    });

    LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
      console.log('Notification action performed:', notificationAction);
      
      if (notificationAction.notification.extra?.type === 'prayer-time' || 
          notificationAction.notification.extra?.type === 'prayer-reminder') {
        // Handle prayer notification action
        this.handlePrayerNotificationAction(notificationAction);
      }
    });
  }

  /**
   * Remove notification listeners
   */
  static removeNotificationListeners(): void {
    LocalNotifications.removeAllListeners();
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(): Promise<{
    pending: number;
    delivered: number;
    prayerNotifications: number;
  }> {
    try {
      const pending = await LocalNotifications.getPending();
      const delivered = await LocalNotifications.getDeliveredNotifications();
      
      const prayerNotifications = pending.notifications.filter(n => 
        n.extra?.type === 'prayer-reminder' || n.extra?.type === 'prayer-time'
      ).length;

      return {
        pending: pending.notifications.length,
        delivered: delivered.notifications.length,
        prayerNotifications
      };
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return { pending: 0, delivered: 0, prayerNotifications: 0 };
    }
  }

  /**
   * Generate unique notification ID for prayer
   */
  private static getPrayerNotificationId(prayerName: string, date: Date): number {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '').substring(2); // Use last 6 digits of date (YYMMDD)
    const basePrayerName = prayerName.replace('-reminder', '').replace('-exact', '');
    
    // Create a simple hash for prayer name
    let prayerHash = 0;
    for (let i = 0; i < basePrayerName.length; i++) {
      prayerHash += basePrayerName.charCodeAt(i);
    }
    prayerHash = prayerHash % 1000; // Keep it to 3 digits
    
    // Add a suffix to differentiate between different types of notifications
    let suffix = 0;
    if (prayerName.includes('-reminder')) {
      suffix = 1;
    } else if (prayerName.includes('-exact')) {
      suffix = 2;
    }
    
    // Create ID: YYMMDD + prayer hash (3 digits) + suffix (1 digit)
    return parseInt(`${dateStr}${prayerHash.toString().padStart(3, '0')}${suffix}`);
  }

  /**
   * Handle prayer notification received
   */
  private static handlePrayerNotification(notification: any): void {
    // Custom logic for when prayer notification is received
    console.log(`Prayer notification received for ${notification.extra?.prayerName}`);
    
    // You can add custom logic here, such as:
    // - Playing custom sounds
    // - Showing in-app alerts
    // - Updating UI state
    // - Logging prayer notification events
  }

  /**
   * Handle prayer notification action performed
   */
  private static handlePrayerNotificationAction(notificationAction: any): void {
    // Custom logic for when user interacts with prayer notification
    console.log(`Prayer notification action performed for ${notificationAction.notification.extra?.prayerName}`);
    
    // You can add custom logic here, such as:
    // - Opening specific app screens
    // - Marking prayers as completed
    // - Showing prayer guidance
    // - Tracking user engagement
  }

  /**
   * Update notification settings and reschedule if needed
   */
  static async updateNotificationSettings(
    newSettings: NotificationSettings,
    currentPrayerTimes?: PrayerTimes
  ): Promise<void> {
    if (currentPrayerTimes && newSettings.enabled) {
      await this.schedulePrayerNotifications(currentPrayerTimes, newSettings);
    } else if (!newSettings.enabled) {
      await this.clearPrayerNotifications();
    }
  }

  /**
   * Check if notifications are supported on the current platform
   */
  static async isNotificationSupported(): Promise<boolean> {
    try {
      // Try to check permissions to see if notifications are supported
      await LocalNotifications.checkPermissions();
      return true;
    } catch (error) {
      console.error('Notifications not supported:', error);
      return false;
    }
  }
}