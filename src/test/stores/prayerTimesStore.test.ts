import { describe, it, expect, beforeEach } from 'vitest';
import { usePrayerTimesStore } from '../../../stores/prayerTimesStore';
import { PrayerTimes } from '../../../types';

describe('PrayerTimesStore', () => {
  const mockPrayerTimes: PrayerTimes = {
    fajr: new Date('2024-01-01T05:30:00'),
    sunrise: new Date('2024-01-01T07:00:00'),
    dhuhr: new Date('2024-01-01T12:30:00'),
    asr: new Date('2024-01-01T15:30:00'),
    maghrib: new Date('2024-01-01T18:00:00'),
    isha: new Date('2024-01-01T19:30:00'),
    date: new Date('2024-01-01'),
    location: 'Test City',
  };

  beforeEach(() => {
    // Reset store state before each test
    usePrayerTimesStore.setState({
      currentPrayerTimes: null,
      cachedPrayerTimes: new Map(),
      isLoading: false,
      error: null,
      lastUpdated: null,
    });
  });

  it('should have initial state', () => {
    const state = usePrayerTimesStore.getState();
    
    expect(state.currentPrayerTimes).toBeNull();
    expect(state.cachedPrayerTimes.size).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastUpdated).toBeNull();
  });

  it('should set prayer times', () => {
    const { setPrayerTimes } = usePrayerTimesStore.getState();
    
    setPrayerTimes(mockPrayerTimes);
    
    const state = usePrayerTimesStore.getState();
    expect(state.currentPrayerTimes).toEqual(mockPrayerTimes);
    expect(state.lastUpdated).toBeInstanceOf(Date);
    expect(state.error).toBeNull();
  });

  it('should cache prayer times', () => {
    const { cachePrayerTimes, getCachedPrayerTimes } = usePrayerTimesStore.getState();
    const cacheKey = 'test-location-2024-01-01';
    
    cachePrayerTimes(cacheKey, mockPrayerTimes);
    
    const cachedTimes = getCachedPrayerTimes(cacheKey);
    expect(cachedTimes).toEqual(mockPrayerTimes);
  });

  it('should return null for non-existent cached prayer times', () => {
    const { getCachedPrayerTimes } = usePrayerTimesStore.getState();
    
    const cachedTimes = getCachedPrayerTimes('non-existent-key');
    expect(cachedTimes).toBeNull();
  });

  it('should set loading state', () => {
    const { setLoading } = usePrayerTimesStore.getState();
    
    setLoading(true);
    
    const state = usePrayerTimesStore.getState();
    expect(state.isLoading).toBe(true);
  });

  it('should set error state', () => {
    const { setError } = usePrayerTimesStore.getState();
    const errorMessage = 'Failed to fetch prayer times';
    
    setError(errorMessage);
    
    const state = usePrayerTimesStore.getState();
    expect(state.error).toBe(errorMessage);
  });

  it('should clear cache', () => {
    const { cachePrayerTimes, setPrayerTimes, clearCache } = usePrayerTimesStore.getState();
    
    // Set up some data
    cachePrayerTimes('test-key', mockPrayerTimes);
    setPrayerTimes(mockPrayerTimes);
    
    clearCache();
    
    const state = usePrayerTimesStore.getState();
    expect(state.cachedPrayerTimes.size).toBe(0);
    expect(state.currentPrayerTimes).toBeNull();
    expect(state.lastUpdated).toBeNull();
  });

  it('should get next prayer correctly', () => {
    const { setPrayerTimes, getNextPrayer } = usePrayerTimesStore.getState();
    
    // Mock current time to be between Fajr and Sunrise
    const mockCurrentTime = new Date('2024-01-01T06:00:00');
    const originalDate = Date;
    global.Date = class extends Date {
      constructor() {
        super();
        return mockCurrentTime;
      }
      static now() {
        return mockCurrentTime.getTime();
      }
    } as any;
    
    setPrayerTimes(mockPrayerTimes);
    
    const nextPrayer = getNextPrayer();
    expect(nextPrayer?.name).toBe('Sunrise');
    expect(nextPrayer?.time).toEqual(mockPrayerTimes.sunrise);
    
    // Restore original Date
    global.Date = originalDate;
  });

  it('should return null for next prayer when no prayer times are set', () => {
    const { getNextPrayer } = usePrayerTimesStore.getState();
    
    const nextPrayer = getNextPrayer();
    expect(nextPrayer).toBeNull();
  });
});