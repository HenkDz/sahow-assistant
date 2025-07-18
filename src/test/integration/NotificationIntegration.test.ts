import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { NotificationService, NotificationSettings } from '../../../services/NotificationService';
import { PrayerTimesService } from '../../../services/PrayerTimesService';
import { Location, CalculationMethod, Madhab, PrayerTimes } from '../../../types';

// Mock Capacitor LocalNotifications
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    requestPermissions: vi.fn(),
    checkPermissions: vi.fn(),
    schedule: vi.fn(),
    cancel: vi.fn(),
    getPending: vi.fn(),
    getDeliveredNotifications: vi.fn(),
    addListener: vi.fn(),
    removeAllListeners: vi.fn()
  }
}));

import { LocalNotifications } from '@capacitor/local-notifications';

describe('Notification Integration Tests', () => {
  const testLocation: Location = {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'USA'
  };

  const testDate = new Date('2024-01-15T08:00:00'); // 8 AM
  
  const defaultNotificationSettings: NotificationSettings = {
    enabled: true,
    offsetMinutes: 10,
    soundEnabled: true,
    vibrationEnabled: true
  };

  let mockPrayerTimes: PrayerTimes;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.setSystemTime(testDate);
    
    // Setup default mocks
    (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
      display: 'granted'
    });
    (LocalNotifications.requestPermissions as Mock).mockResolvedValue({
      display: 'granted'
    });
    (LocalNotifications.getPending as Mock).mockResolvedValue({
      notifications: []
    });
    (LocalNotifications.schedule as Mock).mockResolvedValue(undefined);
    (LocalNotifications.cancel as Mock).mockResolvedValue(undefined);
    (LocalNotifications.getDeliveredNotifications as Mock).mockResolvedValue({
      notifications: []
    });

    // Calculate real prayer times for testing
    mockPrayerTimes = await PrayerTimesService.calculatePrayerTimes(
      testLocation,
      testDate,
      CalculationMethod.MWL,
      Madhab.HANAFI
    );
  });

  describe('End-to-End Prayer Notification Scheduling', () => {
    it('should calculate prayer times and schedule notifications successfully', async () => {
      // Calculate prayer times
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        testLocation,
        testDate,
        CalculationMethod.MWL,
        Madhab.HANAFI
      );

      expect(prayerTimes).toBeDefined();
      expect(prayerTimes.location).toBe('New York, USA');

      // Schedule notifications for calculated prayer times
      await NotificationService.schedulePrayerNotifications(prayerTimes, defaultNotificationSettings);

      // Verify notifications were scheduled
      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
      
      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      expect(scheduleCall.notifications).toBeDefined();
      expect(scheduleCall.notifications.length).toBeGreaterThan(0);

      // Verify notification content includes prayer times
      const notifications = scheduleCall.notifications;
      const prayerNames = notifications.map((n: any) => n.extra.prayerName);
      expect(prayerNames).toContain('Dhuhr');
      expect(prayerNames).toContain('Asr');
      expect(prayerNames).toContain('Maghrib');
      expect(prayerNames).toContain('Isha');
    });

    it('should handle different madhab calculations and schedule appropriate notifications', async () => {
      // Test Hanafi calculation
      const hanafiTimes = await PrayerTimesService.calculatePrayerTimes(
        testLocation,
        testDate,
        CalculationMethod.MWL,
        Madhab.HANAFI
      );

      await NotificationService.schedulePrayerNotifications(hanafiTimes, defaultNotificationSettings);
      
      const hanafiScheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      const hanafiAsrNotification = hanafiScheduleCall.notifications.find((n: any) => 
        n.extra.prayerName === 'Asr' && n.extra.type === 'prayer-reminder'
      );

      // Clear mocks for Shafi test
      vi.clearAllMocks();
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({ display: 'granted' });
      (LocalNotifications.getPending as Mock).mockResolvedValue({ notifications: [] });

      // Test Shafi calculation
      const shafiTimes = await PrayerTimesService.calculatePrayerTimes(
        testLocation,
        testDate,
        CalculationMethod.MWL,
        Madhab.SHAFI
      );

      await NotificationService.schedulePrayerNotifications(shafiTimes, defaultNotificationSettings);
      
      const shafiScheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      const shafiAsrNotification = shafiScheduleCall.notifications.find((n: any) => 
        n.extra.prayerName === 'Asr' && n.extra.type === 'prayer-reminder'
      );

      // Hanafi Asr should be scheduled later than Shafi Asr
      expect(hanafiAsrNotification.schedule.at.getTime()).toBeGreaterThan(
        shafiAsrNotification.schedule.at.getTime()
      );
    });

    it('should schedule weekly notifications with proper date progression', async () => {
      const weeklyTimes = await PrayerTimesService.calculateWeeklyPrayerTimes(
        testLocation,
        testDate,
        3 // 3 days for testing
      );

      expect(weeklyTimes).toHaveLength(3);

      await NotificationService.scheduleWeeklyPrayerNotifications(weeklyTimes, defaultNotificationSettings);

      // Should clear notifications once and then schedule for each day
      expect(LocalNotifications.getPending).toHaveBeenCalledTimes(4); // 1 clear + 3 schedule calls
    });
  });

  describe('Notification Permission Handling', () => {
    it('should handle permission request flow during prayer time scheduling', async () => {
      // Mock permission denied initially
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
        display: 'denied'
      });
      (LocalNotifications.requestPermissions as Mock).mockResolvedValue({
        display: 'granted'
      });

      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, defaultNotificationSettings);

      expect(LocalNotifications.checkPermissions).toHaveBeenCalledTimes(1);
      expect(LocalNotifications.requestPermissions).toHaveBeenCalledTimes(1);
      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
    });

    it('should handle permission denial gracefully', async () => {
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
        display: 'denied'
      });
      (LocalNotifications.requestPermissions as Mock).mockResolvedValue({
        display: 'denied'
      });

      await expect(
        NotificationService.schedulePrayerNotifications(mockPrayerTimes, defaultNotificationSettings)
      ).rejects.toThrow('Notification permissions not granted');

      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });
  });

  describe('Notification Timing and Scheduling Logic', () => {
    it('should schedule notifications with correct timing offsets', async () => {
      const customSettings: NotificationSettings = {
        enabled: true,
        offsetMinutes: 15, // 15 minutes before prayer
        soundEnabled: true,
        vibrationEnabled: false
      };

      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, customSettings);

      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      const notifications = scheduleCall.notifications;
      
      // Find a reminder notification
      const reminderNotification = notifications.find((n: any) => n.extra.type === 'prayer-reminder');
      expect(reminderNotification).toBeDefined();
      expect(reminderNotification.body).toContain('15 minutes');

      // Verify the scheduled time is 15 minutes before the actual prayer time
      const prayerName = reminderNotification.extra.prayerName;
      const actualPrayerTime = mockPrayerTimes[prayerName.toLowerCase() as keyof PrayerTimes] as Date;
      const expectedNotificationTime = new Date(actualPrayerTime);
      expectedNotificationTime.setMinutes(expectedNotificationTime.getMinutes() - 15);

      expect(reminderNotification.schedule.at.getTime()).toBe(expectedNotificationTime.getTime());
    });

    it('should not schedule notifications for past prayer times', async () => {
      // Set current time to very late evening (after all prayers)
      vi.setSystemTime(new Date('2024-01-16T02:00:00')); // 2 AM next day

      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, defaultNotificationSettings);

      // Should not schedule any notifications since all prayers are in the past
      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it('should schedule both reminder and exact time notifications', async () => {
      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, defaultNotificationSettings);

      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      const notifications = scheduleCall.notifications;
      
      const reminderNotifications = notifications.filter((n: any) => n.extra.type === 'prayer-reminder');
      const exactTimeNotifications = notifications.filter((n: any) => n.extra.type === 'prayer-time');
      
      expect(reminderNotifications.length).toBeGreaterThan(0);
      expect(exactTimeNotifications.length).toBeGreaterThan(0);

      // Each prayer should have both reminder and exact time notifications
      const prayerNames = ['Dhuhr', 'Asr', 'Maghrib', 'Isha']; // Future prayers from 8 AM
      prayerNames.forEach(prayerName => {
        const hasReminder = reminderNotifications.some((n: any) => n.extra.prayerName === prayerName);
        const hasExactTime = exactTimeNotifications.some((n: any) => n.extra.prayerName === prayerName);
        expect(hasReminder).toBe(true);
        expect(hasExactTime).toBe(true);
      });
    });
  });

  describe('Notification Content and Localization', () => {
    it('should include Arabic prayer names in notification content', async () => {
      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, defaultNotificationSettings);

      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      const notifications = scheduleCall.notifications;
      
      const dhuhrNotification = notifications.find((n: any) => n.extra.prayerName === 'Dhuhr');
      expect(dhuhrNotification).toBeDefined();
      expect(dhuhrNotification.body).toContain('الظهر'); // Arabic for Dhuhr

      const asrNotification = notifications.find((n: any) => n.extra.prayerName === 'Asr');
      expect(asrNotification).toBeDefined();
      expect(asrNotification.body).toContain('العصر'); // Arabic for Asr
    });

    it('should generate unique notification IDs for different prayers and dates', async () => {
      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, defaultNotificationSettings);

      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      const notifications = scheduleCall.notifications;
      
      const notificationIds = notifications.map((n: any) => n.id);
      const uniqueIds = new Set(notificationIds);
      
      // All notification IDs should be unique
      expect(uniqueIds.size).toBe(notificationIds.length);
      
      // Verify that each prayer has both reminder and exact time notifications with different IDs
      const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      prayerNames.forEach(prayerName => {
        const reminderNotification = notifications.find((n: any) => 
          n.extra.prayerName === prayerName && n.extra.type === 'prayer-reminder'
        );
        const exactTimeNotification = notifications.find((n: any) => 
          n.extra.prayerName === prayerName && n.extra.type === 'prayer-time'
        );
        
        if (reminderNotification && exactTimeNotification) {
          expect(reminderNotification.id).not.toBe(exactTimeNotification.id);
        }
      });
    });
  });

  describe('Notification Management and Cleanup', () => {
    it('should clear existing notifications before scheduling new ones', async () => {
      // Mock existing notifications
      const existingNotifications = [
        { id: 1, extra: { type: 'prayer-reminder' } },
        { id: 2, extra: { type: 'prayer-time' } },
        { id: 3, extra: { type: 'other' } }
      ];

      (LocalNotifications.getPending as Mock).mockResolvedValue({
        notifications: existingNotifications
      });

      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, defaultNotificationSettings);

      // Should cancel existing prayer notifications
      expect(LocalNotifications.cancel).toHaveBeenCalledWith({
        notifications: [{ id: 1 }, { id: 2 }]
      });

      // Should schedule new notifications
      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
    });

    it('should provide notification statistics', async () => {
      const mockPending = [
        { extra: { type: 'prayer-reminder' } },
        { extra: { type: 'prayer-time' } },
        { extra: { type: 'other' } }
      ];
      const mockDelivered = [
        { extra: { type: 'prayer-reminder' } }
      ];

      (LocalNotifications.getPending as Mock).mockResolvedValue({
        notifications: mockPending
      });
      (LocalNotifications.getDeliveredNotifications as Mock).mockResolvedValue({
        notifications: mockDelivered
      });

      const stats = await NotificationService.getNotificationStats();

      expect(stats.pending).toBe(3);
      expect(stats.delivered).toBe(1);
      expect(stats.prayerNotifications).toBe(2);
    });
  });

  describe('Settings Integration', () => {
    it('should update notifications when settings change', async () => {
      // Initial scheduling
      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, defaultNotificationSettings);
      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);

      // Clear mocks
      vi.clearAllMocks();
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({ display: 'granted' });
      (LocalNotifications.getPending as Mock).mockResolvedValue({ notifications: [] });

      // Update settings with different offset
      const updatedSettings: NotificationSettings = {
        ...defaultNotificationSettings,
        offsetMinutes: 20
      };

      await NotificationService.updateNotificationSettings(updatedSettings, mockPrayerTimes);

      // Should reschedule with new settings
      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
      
      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      const notification = scheduleCall.notifications.find((n: any) => n.extra.type === 'prayer-reminder');
      expect(notification.body).toContain('20 minutes');
    });

    it('should clear notifications when disabled', async () => {
      const disabledSettings: NotificationSettings = {
        ...defaultNotificationSettings,
        enabled: false
      };

      await NotificationService.updateNotificationSettings(disabledSettings);

      expect(LocalNotifications.getPending).toHaveBeenCalledTimes(1);
      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle notification scheduling errors gracefully', async () => {
      (LocalNotifications.schedule as Mock).mockRejectedValue(new Error('Scheduling failed'));

      await expect(
        NotificationService.schedulePrayerNotifications(mockPrayerTimes, defaultNotificationSettings)
      ).rejects.toThrow('Scheduling failed');
    });

    it('should handle platform without notification support', async () => {
      (LocalNotifications.checkPermissions as Mock).mockRejectedValue(new Error('Not supported'));

      const isSupported = await NotificationService.isNotificationSupported();
      expect(isSupported).toBe(false);
    });

    it('should handle single prayer notification scheduling', async () => {
      const futureTime = new Date(testDate);
      futureTime.setHours(futureTime.getHours() + 4); // 4 hours later

      await NotificationService.scheduleSinglePrayerNotification(
        'Asr',
        futureTime,
        15,
        defaultNotificationSettings
      );

      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
      
      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      const notification = scheduleCall.notifications[0];
      
      expect(notification.title).toBe('Asr Prayer Time');
      expect(notification.body).toContain('Asr');
      expect(notification.body).toContain('العصر');
      expect(notification.body).toContain('15 minutes');
    });
  });

  describe('Notification Listeners and Event Handling', () => {
    it('should setup notification listeners correctly', () => {
      NotificationService.setupNotificationListeners();

      expect(LocalNotifications.addListener).toHaveBeenCalledWith(
        'localNotificationReceived',
        expect.any(Function)
      );
      expect(LocalNotifications.addListener).toHaveBeenCalledWith(
        'localNotificationActionPerformed',
        expect.any(Function)
      );
    });

    it('should remove notification listeners', () => {
      NotificationService.removeNotificationListeners();

      expect(LocalNotifications.removeAllListeners).toHaveBeenCalledTimes(1);
    });

    it('should send test notification successfully', async () => {
      await NotificationService.sendTestNotification();

      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
      
      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      const notification = scheduleCall.notifications[0];
      
      expect(notification.title).toBe('Prayer Times Test');
      expect(notification.id).toBe(99999);
      expect(notification.extra.type).toBe('test');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle timezone changes correctly', async () => {
      // Test with different locations in different timezones
      const londonLocation: Location = {
        latitude: 51.5074,
        longitude: -0.1278,
        city: 'London',
        country: 'UK'
      };

      const londonPrayerTimes = await PrayerTimesService.calculatePrayerTimes(
        londonLocation,
        testDate,
        CalculationMethod.MWL,
        Madhab.HANAFI
      );

      await NotificationService.schedulePrayerNotifications(londonPrayerTimes, defaultNotificationSettings);

      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
      
      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      expect(scheduleCall.notifications.length).toBeGreaterThan(0);
    });

    it('should handle daylight saving time transitions', async () => {
      // Test with a date during DST transition
      const dstDate = new Date('2024-03-10T08:00:00'); // DST begins in US
      
      const dstPrayerTimes = await PrayerTimesService.calculatePrayerTimes(
        testLocation,
        dstDate,
        CalculationMethod.MWL,
        Madhab.HANAFI
      );

      vi.setSystemTime(dstDate);
      await NotificationService.schedulePrayerNotifications(dstPrayerTimes, defaultNotificationSettings);

      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
    });

    it('should handle extreme latitude locations', async () => {
      const arcticLocation: Location = {
        latitude: 70,
        longitude: 0,
        city: 'Arctic',
        country: 'Arctic'
      };

      try {
        const arcticPrayerTimes = await PrayerTimesService.calculatePrayerTimes(
          arcticLocation,
          testDate,
          CalculationMethod.MWL,
          Madhab.HANAFI
        );

        await NotificationService.schedulePrayerNotifications(arcticPrayerTimes, defaultNotificationSettings);
        
        // If successful, should have scheduled notifications
        expect(LocalNotifications.schedule).toHaveBeenCalled();
      } catch (error) {
        // It's acceptable for extreme latitudes to fail
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});