import { describe, it, expect, vi } from 'vitest';
import { IslamicCalendarService } from '../../../services/IslamicCalendarService';
import { Location, PrayerTimes } from '../../../types';

describe('IslamicCalendarService', () => {
  const mockLocation: Location = {
    latitude: 21.4225,
    longitude: 39.8262,
    city: 'Mecca',
    country: 'Saudi Arabia'
  };

  const mockPrayerTimes: PrayerTimes = {
    fajr: new Date('2024-01-01T05:30:00Z'),
    sunrise: new Date('2024-01-01T07:00:00Z'),
    dhuhr: new Date('2024-01-01T12:30:00Z'),
    asr: new Date('2024-01-01T15:45:00Z'),
    maghrib: new Date('2024-01-01T18:15:00Z'),
    isha: new Date('2024-01-01T19:45:00Z'),
    date: new Date('2024-01-01'),
    location: 'Mecca, Saudi Arabia'
  };

  describe('convertToHijri', () => {
    it('should convert Gregorian date to Hijri date', () => {
      const gregorianDate = new Date('2024-01-01');
      const hijriDate = IslamicCalendarService.convertToHijri(gregorianDate);

      expect(hijriDate).toHaveProperty('hijriDay');
      expect(hijriDate).toHaveProperty('hijriMonth');
      expect(hijriDate).toHaveProperty('hijriYear');
      expect(hijriDate).toHaveProperty('gregorianDate');
      expect(hijriDate.gregorianDate).toEqual(gregorianDate);
      expect(typeof hijriDate.hijriDay).toBe('number');
      expect(typeof hijriDate.hijriMonth).toBe('string');
      expect(typeof hijriDate.hijriYear).toBe('number');
    });

    it('should include events if they exist for the date', () => {
      // Test with Islamic New Year (1st Muharram)
      // We need to find a Gregorian date that corresponds to 1st Muharram
      const gregorianDate = new Date('2023-07-19'); // Approximate 1st Muharram 1445
      const hijriDate = IslamicCalendarService.convertToHijri(gregorianDate);

      expect(hijriDate.events).toBeDefined();
      expect(Array.isArray(hijriDate.events)).toBe(true);
    });
  });

  describe('convertToGregorian', () => {
    it('should convert Hijri date to Gregorian date', () => {
      const gregorianDate = IslamicCalendarService.convertToGregorian(1445, 1, 1);
      
      expect(gregorianDate).toBeInstanceOf(Date);
      expect(gregorianDate.getFullYear()).toBeGreaterThan(2020);
    });
  });

  describe('getIslamicEventsForDate', () => {
    it('should return events for Islamic New Year', () => {
      const events = IslamicCalendarService.getIslamicEventsForDate(1, 1);
      
      expect(events).toContain('Islamic New Year');
    });

    it('should return events for Day of Ashura', () => {
      const events = IslamicCalendarService.getIslamicEventsForDate(1, 10);
      
      expect(events).toContain('Day of Ashura');
    });

    it('should return events for Eid al-Fitr', () => {
      const events = IslamicCalendarService.getIslamicEventsForDate(10, 1);
      
      expect(events).toContain('Eid al-Fitr');
    });

    it('should return events for Eid al-Adha', () => {
      const events = IslamicCalendarService.getIslamicEventsForDate(12, 10);
      
      expect(events).toContain('Eid al-Adha');
    });

    it('should return empty array for dates without events', () => {
      const events = IslamicCalendarService.getIslamicEventsForDate(2, 15);
      
      expect(events).toEqual([]);
    });
  });

  describe('getDetailedIslamicEventsForDate', () => {
    it('should return detailed events with Arabic names', () => {
      const events = IslamicCalendarService.getDetailedIslamicEventsForDate(1, 1);
      
      expect(events).toHaveLength(1);
      expect(events[0]).toHaveProperty('name', 'Islamic New Year');
      expect(events[0]).toHaveProperty('nameAr', 'رأس السنة الهجرية');
      expect(events[0]).toHaveProperty('isHoliday', true);
    });

    it('should return empty array for dates without events', () => {
      const events = IslamicCalendarService.getDetailedIslamicEventsForDate(2, 15);
      
      expect(events).toEqual([]);
    });
  });

  describe('isRamadan', () => {
    it('should return true for month 9 (Ramadan)', () => {
      expect(IslamicCalendarService.isRamadan(9)).toBe(true);
    });

    it('should return false for other months', () => {
      expect(IslamicCalendarService.isRamadan(1)).toBe(false);
      expect(IslamicCalendarService.isRamadan(8)).toBe(false);
      expect(IslamicCalendarService.isRamadan(10)).toBe(false);
    });
  });

  describe('getCurrentIslamicDate', () => {
    it('should return current Islamic date', () => {
      const currentDate = IslamicCalendarService.getCurrentIslamicDate();
      
      expect(currentDate).toHaveProperty('hijriDay');
      expect(currentDate).toHaveProperty('hijriMonth');
      expect(currentDate).toHaveProperty('hijriYear');
      expect(currentDate.gregorianDate).toBeInstanceOf(Date);
    });
  });

  describe('getIslamicDateRange', () => {
    it('should return array of Islamic dates for specified range', () => {
      const startDate = new Date('2024-01-01');
      const days = 7;
      const dateRange = IslamicCalendarService.getIslamicDateRange(startDate, days);
      
      expect(dateRange).toHaveLength(days);
      expect(dateRange[0].gregorianDate).toEqual(startDate);
      
      // Check that dates are consecutive
      for (let i = 1; i < dateRange.length; i++) {
        const prevDate = dateRange[i - 1].gregorianDate;
        const currentDate = dateRange[i].gregorianDate;
        const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        expect(dayDiff).toBe(1);
      }
    });
  });

  describe('calculateRamadanTimes', () => {
    it('should calculate Suhoor and Iftar times correctly', async () => {
      const date = new Date('2024-01-01');
      const ramadanTimes = await IslamicCalendarService.calculateRamadanTimes(
        mockLocation,
        date,
        mockPrayerTimes
      );
      
      expect(ramadanTimes.suhoorTime).toEqual(mockPrayerTimes.fajr);
      expect(ramadanTimes.iftarTime).toEqual(mockPrayerTimes.maghrib);
      expect(ramadanTimes.date).toEqual(date);
    });
  });

  describe('calculateRamadanTimesRange', () => {
    it('should calculate Ramadan times for multiple days', async () => {
      const startDate = new Date('2024-01-01');
      const days = 3;
      const mockGetPrayerTimes = vi.fn().mockResolvedValue(mockPrayerTimes);
      
      const ramadanTimesRange = await IslamicCalendarService.calculateRamadanTimesRange(
        mockLocation,
        startDate,
        days,
        mockGetPrayerTimes
      );
      
      expect(ramadanTimesRange).toHaveLength(days);
      expect(mockGetPrayerTimes).toHaveBeenCalledTimes(days);
      
      ramadanTimesRange.forEach((ramadanTime, index) => {
        expect(ramadanTime.suhoorTime).toEqual(mockPrayerTimes.fajr);
        expect(ramadanTime.iftarTime).toEqual(mockPrayerTimes.maghrib);
        
        const expectedDate = new Date(startDate);
        expectedDate.setDate(startDate.getDate() + index);
        expect(ramadanTime.date).toEqual(expectedDate);
      });
    });
  });

  describe('getHijriMonthName', () => {
    it('should return English month names by default', () => {
      expect(IslamicCalendarService.getHijriMonthName(1)).toBe('Muharram');
      expect(IslamicCalendarService.getHijriMonthName(9)).toBe('Ramadan');
      expect(IslamicCalendarService.getHijriMonthName(12)).toBe('Dhul Hijjah');
    });

    it('should return Arabic month names when specified', () => {
      expect(IslamicCalendarService.getHijriMonthName(1, 'ar')).toBe('محرم');
      expect(IslamicCalendarService.getHijriMonthName(9, 'ar')).toBe('رمضان');
      expect(IslamicCalendarService.getHijriMonthName(12, 'ar')).toBe('ذو الحجة');
    });

    it('should throw error for invalid month numbers', () => {
      expect(() => IslamicCalendarService.getHijriMonthName(0)).toThrow();
      expect(() => IslamicCalendarService.getHijriMonthName(13)).toThrow();
      expect(() => IslamicCalendarService.getHijriMonthName(-1)).toThrow();
    });
  });

  describe('hasEvents', () => {
    it('should return true for dates with events', () => {
      expect(IslamicCalendarService.hasEvents(1, 1)).toBe(true); // Islamic New Year
      expect(IslamicCalendarService.hasEvents(10, 1)).toBe(true); // Eid al-Fitr
    });

    it('should return false for dates without events', () => {
      expect(IslamicCalendarService.hasEvents(2, 15)).toBe(false);
      expect(IslamicCalendarService.hasEvents(5, 20)).toBe(false);
    });
  });

  describe('getHolidaysInYear', () => {
    it('should return all holidays in a given Hijri year', () => {
      const holidays = IslamicCalendarService.getHolidaysInYear(1445);
      
      expect(holidays.length).toBeGreaterThan(0);
      
      // Check that all returned events are holidays
      holidays.forEach(holiday => {
        holiday.events.forEach(event => {
          expect(event.isHoliday).toBe(true);
        });
      });
      
      // Check for specific holidays
      const holidayNames = holidays.flatMap(h => h.events.map(e => e.name));
      expect(holidayNames).toContain('Islamic New Year');
      expect(holidayNames).toContain('Eid al-Fitr');
      expect(holidayNames).toContain('Eid al-Adha');
    });
  });

  describe('formatIslamicDate', () => {
    it('should format Islamic date in English', () => {
      const islamicDate = {
        hijriDay: 1,
        hijriMonth: 'Muharram',
        hijriYear: 1445,
        gregorianDate: new Date('2023-07-19'),
        events: []
      };
      
      const formatted = IslamicCalendarService.formatIslamicDate(islamicDate, 'en');
      expect(formatted).toBe('1 Muharram 1445 AH');
    });

    it('should format Islamic date in Arabic', () => {
      const islamicDate = {
        hijriDay: 1,
        hijriMonth: 'Muharram',
        hijriYear: 1445,
        gregorianDate: new Date('2023-07-19'),
        events: []
      };
      
      const formatted = IslamicCalendarService.formatIslamicDate(islamicDate, 'ar');
      expect(formatted).toBe('1 محرم 1445 هـ');
    });
  });
});