import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfflineStorageService } from '../../services/OfflineStorageService';

// Mock Capacitor Preferences
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn()
  }
}));

describe('Smart Refresh Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCacheFreshness', () => {
    it('should return fresh status for recent data', async () => {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 2); // 2 hours ago
      
      const { Preferences } = await import('@capacitor/preferences');
      (Preferences.get as any).mockResolvedValue({
        value: recentDate.toISOString()
      });

      const freshness = await OfflineStorageService.getCacheFreshness();
      
      expect(freshness.status).toBe('fresh');
      expect(freshness.shouldPromptRefresh).toBe(false);
      expect(freshness.criticallyOutdated).toBe(false);
    });

    it('should return stale status for moderately old data', async () => {
      const staleDate = new Date();
      staleDate.setHours(staleDate.getHours() - 12); // 12 hours ago
      
      const { Preferences } = await import('@capacitor/preferences');
      (Preferences.get as any).mockResolvedValue({
        value: staleDate.toISOString()
      });

      const freshness = await OfflineStorageService.getCacheFreshness();
      
      expect(freshness.status).toBe('stale');
      expect(freshness.shouldPromptRefresh).toBe(false);
      expect(freshness.criticallyOutdated).toBe(false);
    });

    it('should return outdated status for day-old data', async () => {
      const outdatedDate = new Date();
      outdatedDate.setDate(outdatedDate.getDate() - 2); // 2 days ago
      
      const { Preferences } = await import('@capacitor/preferences');
      (Preferences.get as any).mockResolvedValue({
        value: outdatedDate.toISOString()
      });

      const freshness = await OfflineStorageService.getCacheFreshness();
      
      expect(freshness.status).toBe('outdated');
      expect(freshness.shouldPromptRefresh).toBe(true);
      expect(freshness.criticallyOutdated).toBe(false);
    });

    it('should return critical status for very old data', async () => {
      const criticalDate = new Date();
      criticalDate.setDate(criticalDate.getDate() - 5); // 5 days ago
      
      const { Preferences } = await import('@capacitor/preferences');
      (Preferences.get as any).mockResolvedValue({
        value: criticalDate.toISOString()
      });

      const freshness = await OfflineStorageService.getCacheFreshness();
      
      expect(freshness.status).toBe('critical');
      expect(freshness.shouldPromptRefresh).toBe(true);
      expect(freshness.criticallyOutdated).toBe(true);
    });
  });

  describe('shouldShowRefreshPrompt', () => {
    it('should not show prompt when auto prompts are disabled', async () => {
      const { Preferences } = await import('@capacitor/preferences');
      
      // Mock preferences with auto prompts disabled
      (Preferences.get as any).mockImplementation((key) => {
        if (key.key === 'refresh_preferences') {
          return Promise.resolve({
            value: JSON.stringify({
              enableAutoPrompts: false,
              promptFrequency: 'normal'
            })
          });
        }
        if (key.key === 'last_sync') {
          const oldDate = new Date();
          oldDate.setDate(oldDate.getDate() - 5); // 5 days ago
          return Promise.resolve({ value: oldDate.toISOString() });
        }
        return Promise.resolve({ value: null });
      });

      const shouldShow = await OfflineStorageService.shouldShowRefreshPrompt();
      expect(shouldShow).toBe(false);
    });

    it('should respect conservative frequency setting', async () => {
      const { Preferences } = await import('@capacitor/preferences');
      
      // Mock preferences with conservative frequency
      (Preferences.get as any).mockImplementation((key) => {
        if (key.key === 'refresh_preferences') {
          return Promise.resolve({
            value: JSON.stringify({
              enableAutoPrompts: true,
              promptFrequency: 'conservative'
            })
          });
        }
        if (key.key === 'last_sync') {
          const outdatedDate = new Date();
          outdatedDate.setDate(outdatedDate.getDate() - 2); // 2 days ago (outdated but not critical)
          return Promise.resolve({ value: outdatedDate.toISOString() });
        }
        return Promise.resolve({ value: null });
      });

      const shouldShow = await OfflineStorageService.shouldShowRefreshPrompt();
      expect(shouldShow).toBe(false); // Conservative should only show for critical
    });

    it('should show prompt for critical data with conservative setting', async () => {
      const { Preferences } = await import('@capacitor/preferences');
      
      // Mock preferences with conservative frequency
      (Preferences.get as any).mockImplementation((key) => {
        if (key.key === 'refresh_preferences') {
          return Promise.resolve({
            value: JSON.stringify({
              enableAutoPrompts: true,
              promptFrequency: 'conservative'
            })
          });
        }
        if (key.key === 'last_sync') {
          const criticalDate = new Date();
          criticalDate.setDate(criticalDate.getDate() - 5); // 5 days ago (critical)
          return Promise.resolve({ value: criticalDate.toISOString() });
        }
        return Promise.resolve({ value: null });
      });

      const shouldShow = await OfflineStorageService.shouldShowRefreshPrompt();
      expect(shouldShow).toBe(true);
    });

    it('should respect dismissal period', async () => {
      const { Preferences } = await import('@capacitor/preferences');
      
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2); // 2 hours in future
      
      // Mock preferences with dismissal period
      (Preferences.get as any).mockImplementation((key) => {
        if (key.key === 'refresh_preferences') {
          return Promise.resolve({
            value: JSON.stringify({
              enableAutoPrompts: true,
              promptFrequency: 'normal',
              dismissedUntil: futureDate.toISOString()
            })
          });
        }
        if (key.key === 'last_sync') {
          const oldDate = new Date();
          oldDate.setDate(oldDate.getDate() - 2); // 2 days ago
          return Promise.resolve({ value: oldDate.toISOString() });
        }
        return Promise.resolve({ value: null });
      });

      const shouldShow = await OfflineStorageService.shouldShowRefreshPrompt();
      expect(shouldShow).toBe(false);
    });
  });

  describe('needsSync', () => {
    it('should return true for data older than 24 hours', async () => {
      const { Preferences } = await import('@capacitor/preferences');
      
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 2); // 2 days ago
      
      (Preferences.get as any).mockResolvedValue({
        value: oldDate.toISOString()
      });

      const needsSync = await OfflineStorageService.needsSync();
      expect(needsSync).toBe(true);
    });

    it('should return false for recent data', async () => {
      const { Preferences } = await import('@capacitor/preferences');
      
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 12); // 12 hours ago
      
      (Preferences.get as any).mockResolvedValue({
        value: recentDate.toISOString()
      });

      const needsSync = await OfflineStorageService.needsSync();
      expect(needsSync).toBe(false);
    });
  });
});