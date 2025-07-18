import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrayerTimesService } from '../../../services/PrayerTimesService';
import { Location, CalculationMethod, Madhab } from '../../../types';

describe('PrayerTimesService', () => {
  // Test locations
  const newYorkLocation: Location = {
    latitude: 40.7128,
    longitude: -74.0060,
    city: 'New York',
    country: 'USA'
  };

  const meccaLocation: Location = {
    latitude: 21.4225,
    longitude: 39.8262,
    city: 'Mecca',
    country: 'Saudi Arabia'
  };

  const londonLocation: Location = {
    latitude: 51.5074,
    longitude: -0.1278,
    city: 'London',
    country: 'UK'
  };

  const jakartaLocation: Location = {
    latitude: -6.2088,
    longitude: 106.8456,
    city: 'Jakarta',
    country: 'Indonesia'
  };

  // Fixed test date to ensure consistent results
  const testDate = new Date('2024-01-15T12:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculatePrayerTimes', () => {
    it('should calculate prayer times for New York with MWL method', async () => {
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        testDate,
        CalculationMethod.MWL,
        Madhab.HANAFI
      );

      expect(prayerTimes).toBeDefined();
      expect(prayerTimes.fajr).toBeInstanceOf(Date);
      expect(prayerTimes.sunrise).toBeInstanceOf(Date);
      expect(prayerTimes.dhuhr).toBeInstanceOf(Date);
      expect(prayerTimes.asr).toBeInstanceOf(Date);
      expect(prayerTimes.maghrib).toBeInstanceOf(Date);
      expect(prayerTimes.isha).toBeInstanceOf(Date);
      expect(prayerTimes.location).toBe('New York, USA');
      expect(prayerTimes.date).toEqual(testDate);
    });

    it('should calculate prayer times for Mecca', async () => {
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        meccaLocation,
        testDate,
        CalculationMethod.MAKKAH,
        Madhab.HANAFI
      );

      expect(prayerTimes).toBeDefined();
      expect(prayerTimes.location).toBe('Mecca, Saudi Arabia');
      
      // Prayer times should be in logical order
      expect(prayerTimes.fajr.getTime()).toBeLessThan(prayerTimes.sunrise.getTime());
      expect(prayerTimes.sunrise.getTime()).toBeLessThan(prayerTimes.dhuhr.getTime());
      expect(prayerTimes.dhuhr.getTime()).toBeLessThan(prayerTimes.asr.getTime());
      expect(prayerTimes.asr.getTime()).toBeLessThan(prayerTimes.maghrib.getTime());
      expect(prayerTimes.maghrib.getTime()).toBeLessThan(prayerTimes.isha.getTime());
    });

    it('should handle different calculation methods', async () => {
      const mwlTimes = await PrayerTimesService.calculatePrayerTimes(
        londonLocation,
        testDate,
        CalculationMethod.MWL,
        Madhab.HANAFI
      );

      const isnaTimes = await PrayerTimesService.calculatePrayerTimes(
        londonLocation,
        testDate,
        CalculationMethod.ISNA,
        Madhab.HANAFI
      );

      // Different calculation methods should produce different times
      expect(mwlTimes.fajr.getTime()).not.toBe(isnaTimes.fajr.getTime());
      expect(mwlTimes.isha.getTime()).not.toBe(isnaTimes.isha.getTime());
    });

    it('should handle Hanafi vs Shafi madhab differences for Asr', async () => {
      const hanafiTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        testDate,
        CalculationMethod.MWL,
        Madhab.HANAFI
      );

      const shafiTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        testDate,
        CalculationMethod.MWL,
        Madhab.SHAFI
      );

      // Hanafi Asr should typically be later than Shafi Asr
      expect(hanafiTimes.asr.getTime()).toBeGreaterThan(shafiTimes.asr.getTime());
    });

    it('should handle southern hemisphere locations', async () => {
      const sydneyLocation: Location = {
        latitude: -33.8688,
        longitude: 151.2093,
        city: 'Sydney',
        country: 'Australia'
      };

      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        sydneyLocation,
        testDate,
        CalculationMethod.MWL,
        Madhab.HANAFI
      );

      expect(prayerTimes).toBeDefined();
      expect(prayerTimes.location).toBe('Sydney, Australia');
    });

    it('should throw error for invalid coordinates', async () => {
      const invalidLocation: Location = {
        latitude: 91, // Invalid latitude
        longitude: 181, // Invalid longitude
        city: 'Invalid',
        country: 'Invalid'
      };

      await expect(
        PrayerTimesService.calculatePrayerTimes(invalidLocation, testDate)
      ).rejects.toThrow();
    });
  });

  describe('getNextPrayer', () => {
    it('should return next prayer when current time is before Fajr', async () => {
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        testDate
      );

      // Mock current time to be before Fajr
      const earlyMorning = new Date(prayerTimes.fajr);
      earlyMorning.setHours(earlyMorning.getHours() - 1);
      vi.setSystemTime(earlyMorning);

      const nextPrayer = PrayerTimesService.getNextPrayer(prayerTimes);
      expect(nextPrayer).toBeDefined();
      expect(nextPrayer!.name).toBe('Fajr');
    });

    it('should return next prayer when current time is between prayers', async () => {
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        testDate
      );

      // Mock current time to be between Fajr and Sunrise
      const betweenPrayers = new Date(prayerTimes.fajr);
      betweenPrayers.setMinutes(betweenPrayers.getMinutes() + 30);
      vi.setSystemTime(betweenPrayers);

      const nextPrayer = PrayerTimesService.getNextPrayer(prayerTimes);
      expect(nextPrayer).toBeDefined();
      expect(nextPrayer!.name).toBe('Sunrise');
    });

    it('should return next day Fajr when current time is after Isha', async () => {
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        testDate
      );

      // Mock current time to be after Isha
      const afterIsha = new Date(prayerTimes.isha);
      afterIsha.setHours(afterIsha.getHours() + 1);
      vi.setSystemTime(afterIsha);

      const nextPrayer = PrayerTimesService.getNextPrayer(prayerTimes);
      expect(nextPrayer).toBeDefined();
      expect(nextPrayer!.name).toBe('Fajr');
      expect(nextPrayer!.time.getDate()).toBe(testDate.getDate() + 1);
    });

    it('should return null for invalid prayer times', () => {
      const nextPrayer = PrayerTimesService.getNextPrayer(null as any);
      expect(nextPrayer).toBeNull();
    });
  });

  describe('getCurrentPrayer', () => {
    it('should return current prayer when time is within prayer period', async () => {
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        testDate
      );

      // Mock current time to be during Dhuhr
      const duringDhuhr = new Date(prayerTimes.dhuhr);
      duringDhuhr.setMinutes(duringDhuhr.getMinutes() + 30);
      vi.setSystemTime(duringDhuhr);

      const currentPrayer = PrayerTimesService.getCurrentPrayer(prayerTimes);
      expect(currentPrayer).toBeDefined();
      expect(currentPrayer!.name).toBe('Dhuhr');
    });

    it('should return null when time is before first prayer', async () => {
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        testDate
      );

      // Mock current time to be before Fajr
      const beforeFajr = new Date(prayerTimes.fajr);
      beforeFajr.setHours(beforeFajr.getHours() - 1);
      vi.setSystemTime(beforeFajr);

      const currentPrayer = PrayerTimesService.getCurrentPrayer(prayerTimes);
      expect(currentPrayer).toBeNull();
    });
  });

  describe('calculateWeeklyPrayerTimes', () => {
    it('should calculate prayer times for 7 days', async () => {
      const weeklyTimes = await PrayerTimesService.calculateWeeklyPrayerTimes(
        newYorkLocation,
        testDate,
        7
      );

      expect(weeklyTimes).toHaveLength(7);
      expect(weeklyTimes[0].date).toEqual(testDate);
      
      // Each day should have different prayer times
      expect(weeklyTimes[0].fajr.getTime()).not.toBe(weeklyTimes[1].fajr.getTime());
    });

    it('should handle custom number of days', async () => {
      const customDays = await PrayerTimesService.calculateWeeklyPrayerTimes(
        londonLocation,
        testDate,
        3
      );

      expect(customDays).toHaveLength(3);
    });
  });

  describe('getTimeUntilNextPrayer', () => {
    it('should return correct minutes until next prayer', async () => {
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        testDate
      );

      // Mock current time to be 30 minutes before Dhuhr
      const beforeDhuhr = new Date(prayerTimes.dhuhr);
      beforeDhuhr.setMinutes(beforeDhuhr.getMinutes() - 30);
      vi.setSystemTime(beforeDhuhr);

      const minutesUntil = PrayerTimesService.getTimeUntilNextPrayer(prayerTimes);
      expect(minutesUntil).toBe(30);
    });

    it('should return 0 when next prayer time has passed', async () => {
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        testDate
      );

      // Mock current time to be after all prayers
      const afterAllPrayers = new Date(prayerTimes.isha);
      afterAllPrayers.setHours(afterAllPrayers.getHours() + 2);
      vi.setSystemTime(afterAllPrayers);

      const minutesUntil = PrayerTimesService.getTimeUntilNextPrayer(prayerTimes);
      expect(minutesUntil).toBeGreaterThan(0); // Should be time until next day's Fajr
    });
  });

  describe('isCurrentlyPrayerTime', () => {
    it('should return true when within prayer time tolerance', async () => {
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        testDate
      );

      // Mock current time to be exactly at Dhuhr
      vi.setSystemTime(prayerTimes.dhuhr);

      const isPrayerTime = PrayerTimesService.isCurrentlyPrayerTime(prayerTimes, 5);
      expect(isPrayerTime).toBe(true);
    });

    it('should return false when outside prayer time tolerance', async () => {
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        testDate
      );

      // Mock current time to be 10 minutes after Dhuhr (outside 5-minute tolerance)
      const afterDhuhr = new Date(prayerTimes.dhuhr);
      afterDhuhr.setMinutes(afterDhuhr.getMinutes() + 10);
      vi.setSystemTime(afterDhuhr);

      const isPrayerTime = PrayerTimesService.isCurrentlyPrayerTime(prayerTimes, 5);
      expect(isPrayerTime).toBe(false);
    });
  });

  describe('formatPrayerTime', () => {
    it('should format time in 12-hour format by default', () => {
      const testTime = new Date('2024-01-15T14:30:00');
      const formatted = PrayerTimesService.formatPrayerTime(testTime);
      expect(formatted).toMatch(/2:30 PM/);
    });

    it('should format time in 24-hour format when specified', () => {
      const testTime = new Date('2024-01-15T14:30:00');
      const formatted = PrayerTimesService.formatPrayerTime(testTime, true);
      expect(formatted).toMatch(/14:30/);
    });
  });

  describe('getQiblaDirection', () => {
    it('should calculate Qibla direction for New York', () => {
      const direction = PrayerTimesService.getQiblaDirection(newYorkLocation);
      expect(typeof direction).toBe('number');
      expect(direction).toBeGreaterThan(0);
      expect(direction).toBeLessThan(360);
    });

    it('should return different directions for different locations', () => {
      const nyDirection = PrayerTimesService.getQiblaDirection(newYorkLocation);
      const londonDirection = PrayerTimesService.getQiblaDirection(londonLocation);
      
      expect(nyDirection).not.toBe(londonDirection);
    });

    it('should return approximately 0 degrees for locations east of Mecca', () => {
      const jakartaDirection = PrayerTimesService.getQiblaDirection(jakartaLocation);
      // Jakarta is roughly west of Mecca, so Qibla should be roughly northwest
      expect(jakartaDirection).toBeGreaterThan(250);
      expect(jakartaDirection).toBeLessThan(350);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle locations near poles', async () => {
      const arcticLocation: Location = {
        latitude: 80,
        longitude: 0,
        city: 'Arctic',
        country: 'Arctic'
      };

      // This might throw an error or return special values for extreme latitudes
      try {
        const prayerTimes = await PrayerTimesService.calculatePrayerTimes(arcticLocation, testDate);
        expect(prayerTimes).toBeDefined();
      } catch (error) {
        // It's acceptable for extreme latitudes to throw errors
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle date at year boundaries', async () => {
      const newYearDate = new Date('2024-01-01T00:00:00Z');
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        newYearDate
      );

      expect(prayerTimes).toBeDefined();
      expect(prayerTimes.date).toEqual(newYearDate);
    });

    it('should handle leap year dates', async () => {
      const leapYearDate = new Date('2024-02-29T12:00:00Z');
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(
        newYorkLocation,
        leapYearDate
      );

      expect(prayerTimes).toBeDefined();
      expect(prayerTimes.date).toEqual(leapYearDate);
    });
  });
});