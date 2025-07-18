import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { NotificationService, NotificationSettings } from '../../../services/NotificationService';
import { PrayerTimes } from '../../../types';

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

const mockPrayerTimes: PrayerTimes = {
  fajr: new Date('2024-01-15T05:30:00'),
  sunrise: new Date('2024-01-15T07:00:00'),
  dhuhr: new Date('2024-01-15T12:15:00'),
  asr: new Date('2024-01-15T15:30:00'),
  maghrib: new Date('2024-01-15T17:45:00'),
  isha: new Date('2024-01-15T19:15:00'),
  date: new Date('2024-01-15'),
  location: 'New York, USA'
};

const mockNotificationSettings: NotificationSettings = {
  enabled: true,
  offsetMinutes: 10,
  soundEnabled: true,
  vibrationEnabled: true
};

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2024-01-15T10:00:00')); // Set time to 10 AM
  });

  describe('requestPermissions', () => {
    it('should request notification permissions successfully', async () => {
      (LocalNotifications.requestPermissions as Mock).mockResolvedValue({
        display: 'granted'
      });

      const result = await NotificationService.requestPermissions();
      
      expect(result).toBe(true);
      expect(LocalNotifications.requestPermissions).toHaveBeenCalledTimes(1);
    });

    it('should handle permission denial', async () => {
      (LocalNotifications.requestPermissions as Mock).mockResolvedValue({
        display: 'denied'
      });

      const result = await NotificationService.requestPermissions();
      
      expect(result).toBe(false);
    });

    it('should handle permission request errors', async () => {
      (LocalNotifications.requestPermissions as Mock).mockRejectedValue(new Error('Permission error'));

      const result = await NotificationService.requestPermissions();
      
      expect(result).toBe(false);
    });
  });

  describe('checkPermissions', () => {
    it('should check notification permissions successfully', async () => {
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
        display: 'granted'
      });

      const result = await NotificationService.checkPermissions();
      
      expect(result).toBe(true);
      expect(LocalNotifications.checkPermissions).toHaveBeenCalledTimes(1);
    });

    it('should return false for denied permissions', async () => {
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
        display: 'denied'
      });

      const result = await NotificationService.checkPermissions();
      
      expect(result).toBe(false);
    });

    it('should handle permission check errors', async () => {
      (LocalNotifications.checkPermissions as Mock).mockRejectedValue(new Error('Check error'));

      const result = await NotificationService.checkPermissions();
      
      expect(result).toBe(false);
    });
  });

  describe('schedulePrayerNotifications', () => {
    beforeEach(() => {
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
        display: 'granted'
      });
      (LocalNotifications.getPending as Mock).mockResolvedValue({
        notifications: []
      });
      (LocalNotifications.schedule as Mock).mockResolvedValue(undefined);
      (LocalNotifications.cancel as Mock).mockResolvedValue(undefined);
    });

    it('should schedule prayer notifications when enabled', async () => {
      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, mockNotificationSettings);

      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
      
      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      expect(scheduleCall.notifications).toBeDefined();
      expect(scheduleCall.notifications.length).toBeGreaterThan(0);
      
      // Check that notifications are scheduled for future prayers
      const notifications = scheduleCall.notifications;
      const prayerNames = notifications.map((n: any) => n.extra.prayerName);
      expect(prayerNames).toContain('Dhuhr');
      expect(prayerNames).toContain('Asr');
      expect(prayerNames).toContain('Maghrib');
      expect(prayerNames).toContain('Isha');
    });

    it('should not schedule notifications when disabled', async () => {
      const disabledSettings = { ...mockNotificationSettings, enabled: false };
      
      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, disabledSettings);

      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it('should request permissions if not granted', async () => {
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
        display: 'denied'
      });
      (LocalNotifications.requestPermissions as Mock).mockResolvedValue({
        display: 'granted'
      });

      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, mockNotificationSettings);

      expect(LocalNotifications.requestPermissions).toHaveBeenCalledTimes(1);
      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
    });

    it('should throw error if permissions not granted', async () => {
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
        display: 'denied'
      });
      (LocalNotifications.requestPermissions as Mock).mockResolvedValue({
        display: 'denied'
      });

      await expect(
        NotificationService.schedulePrayerNotifications(mockPrayerTimes, mockNotificationSettings)
      ).rejects.toThrow('Notification permissions not granted');
    });

    it('should include correct notification content', async () => {
      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, mockNotificationSettings);

      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      const notifications = scheduleCall.notifications;
      
      // Find a specific prayer notification
      const dhuhrNotification = notifications.find((n: any) => 
        n.extra.prayerName === 'Dhuhr' && n.extra.type === 'prayer-reminder'
      );
      
      expect(dhuhrNotification).toBeDefined();
      expect(dhuhrNotification.title).toBe('Dhuhr Prayer Time');
      expect(dhuhrNotification.body).toContain('Dhuhr');
      expect(dhuhrNotification.body).toContain('الظهر');
      expect(dhuhrNotification.body).toContain('10 minutes');
    });

    it('should schedule both reminder and exact time notifications', async () => {
      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, mockNotificationSettings);

      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      const notifications = scheduleCall.notifications;
      
      // Check for both reminder and exact time notifications
      const reminderNotifications = notifications.filter((n: any) => n.extra.type === 'prayer-reminder');
      const exactTimeNotifications = notifications.filter((n: any) => n.extra.type === 'prayer-time');
      
      expect(reminderNotifications.length).toBeGreaterThan(0);
      expect(exactTimeNotifications.length).toBeGreaterThan(0);
    });

    it('should not schedule notifications for past prayer times', async () => {
      // Set system time to evening
      vi.setSystemTime(new Date('2024-01-15T20:00:00'));
      
      await NotificationService.schedulePrayerNotifications(mockPrayerTimes, mockNotificationSettings);

      // When all prayers are in the past, schedule should not be called
      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });
  });

  describe('clearPrayerNotifications', () => {
    it('should clear existing prayer notifications', async () => {
      const mockPendingNotifications = [
        { id: 1, extra: { type: 'prayer-reminder' } },
        { id: 2, extra: { type: 'prayer-time' } },
        { id: 3, extra: { type: 'other' } }
      ];

      (LocalNotifications.getPending as Mock).mockResolvedValue({
        notifications: mockPendingNotifications
      });

      await NotificationService.clearPrayerNotifications();

      expect(LocalNotifications.cancel).toHaveBeenCalledWith({
        notifications: [{ id: 1 }, { id: 2 }]
      });
    });

    it('should handle empty pending notifications', async () => {
      (LocalNotifications.getPending as Mock).mockResolvedValue({
        notifications: []
      });

      await NotificationService.clearPrayerNotifications();

      expect(LocalNotifications.cancel).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (LocalNotifications.getPending as Mock).mockRejectedValue(new Error('Get pending error'));

      // Should not throw
      await expect(NotificationService.clearPrayerNotifications()).resolves.toBeUndefined();
    });
  });

  describe('scheduleSinglePrayerNotification', () => {
    beforeEach(() => {
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
        display: 'granted'
      });
    });

    it('should schedule single prayer notification', async () => {
      const futureTime = new Date('2024-01-15T15:30:00'); // 3:30 PM
      
      await NotificationService.scheduleSinglePrayerNotification(
        'Asr',
        futureTime,
        15,
        mockNotificationSettings
      );

      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
      
      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      const notification = scheduleCall.notifications[0];
      
      expect(notification.title).toBe('Asr Prayer Time');
      expect(notification.body).toContain('Asr');
      expect(notification.body).toContain('العصر');
      expect(notification.body).toContain('15 minutes');
    });

    it('should not schedule notification for past time', async () => {
      const pastTime = new Date('2024-01-15T08:00:00'); // 8 AM (past)
      
      await NotificationService.scheduleSinglePrayerNotification(
        'Fajr',
        pastTime,
        10,
        mockNotificationSettings
      );

      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it('should not schedule when notifications disabled', async () => {
      const disabledSettings = { ...mockNotificationSettings, enabled: false };
      const futureTime = new Date('2024-01-15T15:30:00');
      
      await NotificationService.scheduleSinglePrayerNotification(
        'Asr',
        futureTime,
        10,
        disabledSettings
      );

      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });
  });

  describe('sendTestNotification', () => {
    it('should send test notification', async () => {
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
        display: 'granted'
      });

      await NotificationService.sendTestNotification();

      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
      
      const scheduleCall = (LocalNotifications.schedule as Mock).mock.calls[0][0];
      const notification = scheduleCall.notifications[0];
      
      expect(notification.title).toBe('Prayer Times Test');
      expect(notification.body).toBe('This is a test notification for prayer times');
      expect(notification.id).toBe(99999);
      expect(notification.extra.type).toBe('test');
    });

    it('should request permissions for test notification', async () => {
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
        display: 'denied'
      });
      (LocalNotifications.requestPermissions as Mock).mockResolvedValue({
        display: 'granted'
      });

      await NotificationService.sendTestNotification();

      expect(LocalNotifications.requestPermissions).toHaveBeenCalledTimes(1);
      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics', async () => {
      const mockPending = [
        { extra: { type: 'prayer-reminder' } },
        { extra: { type: 'prayer-time' } },
        { extra: { type: 'other' } }
      ];
      const mockDelivered = [
        { extra: { type: 'prayer-reminder' } },
        { extra: { type: 'other' } }
      ];

      (LocalNotifications.getPending as Mock).mockResolvedValue({
        notifications: mockPending
      });
      (LocalNotifications.getDeliveredNotifications as Mock).mockResolvedValue({
        notifications: mockDelivered
      });

      const stats = await NotificationService.getNotificationStats();

      expect(stats.pending).toBe(3);
      expect(stats.delivered).toBe(2);
      expect(stats.prayerNotifications).toBe(2);
    });

    it('should handle errors in getting stats', async () => {
      (LocalNotifications.getPending as Mock).mockRejectedValue(new Error('Stats error'));

      const stats = await NotificationService.getNotificationStats();

      expect(stats.pending).toBe(0);
      expect(stats.delivered).toBe(0);
      expect(stats.prayerNotifications).toBe(0);
    });
  });

  describe('setupNotificationListeners', () => {
    it('should setup notification listeners', () => {
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
  });

  describe('removeNotificationListeners', () => {
    it('should remove all notification listeners', () => {
      NotificationService.removeNotificationListeners();

      expect(LocalNotifications.removeAllListeners).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateNotificationSettings', () => {
    beforeEach(() => {
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
        display: 'granted'
      });
      (LocalNotifications.getPending as Mock).mockResolvedValue({
        notifications: []
      });
    });

    it('should reschedule notifications when enabled with prayer times', async () => {
      await NotificationService.updateNotificationSettings(
        mockNotificationSettings,
        mockPrayerTimes
      );

      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
    });

    it('should clear notifications when disabled', async () => {
      const disabledSettings = { ...mockNotificationSettings, enabled: false };
      
      await NotificationService.updateNotificationSettings(disabledSettings);

      expect(LocalNotifications.getPending).toHaveBeenCalledTimes(1);
    });

    it('should not schedule without prayer times', async () => {
      await NotificationService.updateNotificationSettings(mockNotificationSettings);

      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });
  });

  describe('isNotificationSupported', () => {
    it('should return true when notifications are supported', async () => {
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
        display: 'granted'
      });

      const isSupported = await NotificationService.isNotificationSupported();

      expect(isSupported).toBe(true);
    });

    it('should return false when notifications are not supported', async () => {
      (LocalNotifications.checkPermissions as Mock).mockRejectedValue(new Error('Not supported'));

      const isSupported = await NotificationService.isNotificationSupported();

      expect(isSupported).toBe(false);
    });
  });

  describe('scheduleWeeklyPrayerNotifications', () => {
    beforeEach(() => {
      (LocalNotifications.checkPermissions as Mock).mockResolvedValue({
        display: 'granted'
      });
      (LocalNotifications.getPending as Mock).mockResolvedValue({
        notifications: []
      });
    });

    it('should schedule notifications for multiple days', async () => {
      const weeklyTimes = [
        mockPrayerTimes,
        { ...mockPrayerTimes, date: new Date('2024-01-16') },
        { ...mockPrayerTimes, date: new Date('2024-01-17') }
      ];

      await NotificationService.scheduleWeeklyPrayerNotifications(weeklyTimes, mockNotificationSettings);

      // Should clear once and schedule for each day
      expect(LocalNotifications.getPending).toHaveBeenCalledTimes(4); // 1 clear + 3 schedule calls
    });

    it('should not schedule when disabled', async () => {
      const disabledSettings = { ...mockNotificationSettings, enabled: false };
      const weeklyTimes = [mockPrayerTimes];

      await NotificationService.scheduleWeeklyPrayerNotifications(weeklyTimes, disabledSettings);

      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });
  });
});