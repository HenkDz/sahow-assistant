import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TasbihService, DEFAULT_DHIKR_OPTIONS } from '../../../services/TasbihService';

// Mock Capacitor Haptics
vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn().mockResolvedValue({}),
  },
  ImpactStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock Capacitor Preferences
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('TasbihService', () => {
  const mockPreferences = {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock implementation
    const { Preferences } = require('@capacitor/preferences');
    Object.assign(Preferences, mockPreferences);
  });

  describe('getCurrentTasbihData', () => {
    it('should return default data when no stored data exists', async () => {
      mockPreferences.get.mockResolvedValue({ value: null });

      const result = await TasbihService.getCurrentTasbihData();

      expect(result).toEqual({
        count: 0,
        goal: 33,
        dhikrText: 'Glory be to Allah',
        dhikrTextArabic: 'سُبْحَانَ اللَّهِ',
        lastUpdated: expect.any(Date),
      });
    });

    it('should return stored data when it exists', async () => {
      const storedData = {
        count: 15,
        goal: 99,
        dhikrText: 'Praise be to Allah',
        dhikrTextArabic: 'الْحَمْدُ لِلَّهِ',
        lastUpdated: '2024-01-01T10:00:00.000Z',
      };
      
      mockPreferences.get.mockResolvedValue({ value: JSON.stringify(storedData) });

      const result = await TasbihService.getCurrentTasbihData();

      expect(result).toEqual({
        count: 15,
        goal: 99,
        dhikrText: 'Praise be to Allah',
        dhikrTextArabic: 'الْحَمْدُ لِلَّهِ',
        lastUpdated: new Date('2024-01-01T10:00:00.000Z'),
      });
    });

    it('should return default data when stored data is invalid', async () => {
      mockPreferences.get.mockResolvedValue({ value: 'invalid json' });

      const result = await TasbihService.getCurrentTasbihData();

      expect(result).toEqual({
        count: 0,
        goal: 33,
        dhikrText: 'Glory be to Allah',
        dhikrTextArabic: 'سُبْحَانَ اللَّهِ',
        lastUpdated: expect.any(Date),
      });
    });
  });

  describe('saveTasbihData', () => {
    it('should save tasbih data to preferences', async () => {
      const data = {
        count: 25,
        goal: 33,
        dhikrText: 'Glory be to Allah',
        dhikrTextArabic: 'سُبْحَانَ اللَّهِ',
        lastUpdated: new Date('2024-01-01T10:00:00.000Z'),
      };

      await TasbihService.saveTasbihData(data);

      expect(mockPreferences.set).toHaveBeenCalledWith({
        key: 'tasbih_data',
        value: JSON.stringify({
          ...data,
          lastUpdated: '2024-01-01T10:00:00.000Z',
        }),
      });
    });
  });

  describe('incrementCount', () => {
    it('should increment count by 1', async () => {
      const currentData = {
        count: 10,
        goal: 33,
        dhikrText: 'Glory be to Allah',
        dhikrTextArabic: 'سُبْحَانَ اللَّهِ',
        lastUpdated: new Date('2024-01-01T10:00:00.000Z'),
      };

      mockPreferences.set.mockResolvedValue({});

      const result = await TasbihService.incrementCount(currentData);

      expect(result.count).toBe(11);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should provide haptic feedback for regular increments', async () => {
      const { Haptics } = require('@capacitor/haptics');
      const currentData = {
        count: 10,
        goal: 33,
        dhikrText: 'Glory be to Allah',
        dhikrTextArabic: 'سُبْحَانَ اللَّهِ',
        lastUpdated: new Date(),
      };

      mockPreferences.set.mockResolvedValue({});

      await TasbihService.incrementCount(currentData);

      expect(Haptics.impact).toHaveBeenCalledWith({ style: 'light' });
    });

    it('should provide special haptic feedback for milestones', async () => {
      const { Haptics } = require('@capacitor/haptics');
      const currentData = {
        count: 32,
        goal: 33,
        dhikrText: 'Glory be to Allah',
        dhikrTextArabic: 'سُبْحَانَ اللَّهِ',
        lastUpdated: new Date(),
      };

      mockPreferences.set.mockResolvedValue({});

      await TasbihService.incrementCount(currentData);

      // Should call medium impact for milestone 33
      expect(Haptics.impact).toHaveBeenCalledWith({ style: 'medium' });
    });
  });

  describe('resetCount', () => {
    it('should reset count to 0', async () => {
      const currentData = {
        count: 25,
        goal: 33,
        dhikrText: 'Glory be to Allah',
        dhikrTextArabic: 'سُبْحَانَ اللَّهِ',
        lastUpdated: new Date(),
      };

      mockPreferences.set.mockResolvedValue({});
      mockPreferences.get.mockResolvedValue({ value: '[]' });

      const result = await TasbihService.resetCount(currentData);

      expect(result.count).toBe(0);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should save current progress to history before resetting', async () => {
      const currentData = {
        count: 25,
        goal: 33,
        dhikrText: 'Glory be to Allah',
        dhikrTextArabic: 'سُبْحَانَ اللَّهِ',
        lastUpdated: new Date(),
      };

      mockPreferences.set.mockResolvedValue({});
      mockPreferences.get.mockResolvedValue({ value: '[]' });

      await TasbihService.resetCount(currentData);

      // Should save to history
      expect(mockPreferences.set).toHaveBeenCalledWith({
        key: 'tasbih_history',
        value: expect.stringContaining('"count":25'),
      });
    });
  });

  describe('updateDhikr', () => {
    it('should update dhikr text and goal', async () => {
      const currentData = {
        count: 10,
        goal: 33,
        dhikrText: 'Glory be to Allah',
        dhikrTextArabic: 'سُبْحَانَ اللَّهِ',
        lastUpdated: new Date(),
      };

      const newDhikr = DEFAULT_DHIKR_OPTIONS[1]; // Alhamdulillah

      mockPreferences.set.mockResolvedValue({});

      const result = await TasbihService.updateDhikr(currentData, newDhikr);

      expect(result.dhikrText).toBe('Praise be to Allah');
      expect(result.dhikrTextArabic).toBe('الْحَمْدُ لِلَّهِ');
      expect(result.goal).toBe(33);
    });
  });

  describe('updateGoal', () => {
    it('should update goal', async () => {
      const currentData = {
        count: 10,
        goal: 33,
        dhikrText: 'Glory be to Allah',
        dhikrTextArabic: 'سُبْحَانَ اللَّهِ',
        lastUpdated: new Date(),
      };

      mockPreferences.set.mockResolvedValue({});

      const result = await TasbihService.updateGoal(currentData, 99);

      expect(result.goal).toBe(99);
    });
  });

  describe('isMilestone', () => {
    it('should return true for milestone numbers', () => {
      expect(TasbihService.isMilestone(33)).toBe(true);
      expect(TasbihService.isMilestone(99)).toBe(true);
      expect(TasbihService.isMilestone(100)).toBe(true);
      expect(TasbihService.isMilestone(200)).toBe(true);
    });

    it('should return false for non-milestone numbers', () => {
      expect(TasbihService.isMilestone(1)).toBe(false);
      expect(TasbihService.isMilestone(25)).toBe(false);
      expect(TasbihService.isMilestone(50)).toBe(false);
      expect(TasbihService.isMilestone(75)).toBe(false);
    });
  });

  describe('getTasbihHistory', () => {
    it('should return empty array when no history exists', async () => {
      mockPreferences.get.mockResolvedValue({ value: null });

      const result = await TasbihService.getTasbihHistory();

      expect(result).toEqual([]);
    });

    it('should return parsed history data', async () => {
      const historyData = [
        {
          count: 33,
          goal: 33,
          dhikrText: 'Glory be to Allah',
          dhikrTextArabic: 'سُبْحَانَ اللَّهِ',
          lastUpdated: '2024-01-01T10:00:00.000Z',
          completedAt: '2024-01-01T10:05:00.000Z',
        },
      ];

      mockPreferences.get.mockResolvedValue({ value: JSON.stringify(historyData) });

      const result = await TasbihService.getTasbihHistory();

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(33);
      expect(result[0].completedAt).toBeInstanceOf(Date);
    });
  });

  describe('clearHistory', () => {
    it('should remove history from preferences', async () => {
      await TasbihService.clearHistory();

      expect(mockPreferences.remove).toHaveBeenCalledWith({ key: 'tasbih_history' });
    });
  });
});
