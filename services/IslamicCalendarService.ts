import * as hijriDateLib from 'hijri-date';
import { IslamicDate, Location, PrayerTimes } from '../types';
import { OfflineStorageService } from './OfflineStorageService';

const HijriDate = hijriDateLib.default;

export interface RamadanTimes {
  suhoorTime: Date;
  iftarTime: Date;
  date: Date;
}

export interface IslamicEvent {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  isHoliday: boolean;
}

export class IslamicCalendarService {
  static hijriMonthNames = [
    'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhul Qi\'dah', 'Dhul Hijjah'
  ];

  private static islamicEvents: Map<string, IslamicEvent[]> = new Map([
    // Muharram events
    ['1-1', [{ name: 'Islamic New Year', nameAr: 'رأس السنة الهجرية', isHoliday: true }]],
    ['1-10', [{ name: 'Day of Ashura', nameAr: 'يوم عاشوراء', isHoliday: true }]],
    
    // Rabi' al-Awwal events
    ['3-12', [{ name: 'Mawlid an-Nabi', nameAr: 'المولد النبوي الشريف', isHoliday: true }]],
    
    // Rajab events
    ['7-27', [{ name: 'Isra and Mi\'raj', nameAr: 'الإسراء والمعراج', isHoliday: true }]],
    
    // Sha'ban events
    ['8-15', [{ name: 'Laylat al-Bara\'at', nameAr: 'ليلة البراءة', isHoliday: false }]],
    
    // Ramadan events
    ['9-1', [{ name: 'First Day of Ramadan', nameAr: 'أول يوم رمضان', isHoliday: true }]],
    ['9-27', [{ name: 'Laylat al-Qadr (Night of Power)', nameAr: 'ليلة القدر', isHoliday: false }]],
    
    // Shawwal events
    ['10-1', [{ name: 'Eid al-Fitr', nameAr: 'عيد الفطر', isHoliday: true }]],
    
    // Dhul Hijjah events
    ['12-8', [{ name: 'Day of Tarwiyah', nameAr: 'يوم التروية', isHoliday: false }]],
    ['12-9', [{ name: 'Day of Arafah', nameAr: 'يوم عرفة', isHoliday: true }]],
    ['12-10', [{ name: 'Eid al-Adha', nameAr: 'عيد الأضحى', isHoliday: true }]],
    ['12-11', [{ name: 'Eid al-Adha (2nd day)', nameAr: 'عيد الأضحى (اليوم الثاني)', isHoliday: true }]],
    ['12-12', [{ name: 'Eid al-Adha (3rd day)', nameAr: 'عيد الأضحى (اليوم الثالث)', isHoliday: true }]],
    ['12-13', [{ name: 'Eid al-Adha (4th day)', nameAr: 'عيد الأضحى (اليوم الرابع)', isHoliday: true }]],
  ]);

  private static hijriMonthNamesAr = [
    'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
    'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
    'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
  ];

  /**
   * Convert Gregorian date to Islamic (Hijri) date
   */
  static convertToHijri(gregorianDate: Date): IslamicDate {
    // Create a new HijriDate and calculate the difference from today
    const today = new Date();
    const todayHijri = HijriDate.today();
    
    // Calculate the difference in days
    const diffTime = gregorianDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Create a new hijri date and add/subtract the difference
    const hijriDate = todayHijri.clone();
    if (diffDays > 0) {
      hijriDate.addDays(diffDays);
    } else if (diffDays < 0) {
      hijriDate.subtractDays(Math.abs(diffDays));
    }
    
    const monthIndex = hijriDate.month - 1; // HijriDate months are 1-based
    
    return {
      hijriDay: hijriDate.date,
      hijriMonth: this.hijriMonthNames[monthIndex],
      hijriYear: hijriDate.year,
      gregorianDate,
      events: this.getIslamicEventsForDate(hijriDate.month, hijriDate.date)
    };
  }

  /**
   * Convert Islamic (Hijri) date to Gregorian date
   */
  static convertToGregorian(hijriYear: number, hijriMonth: number, hijriDay: number): Date {
    const hijriDate = new HijriDate();
    hijriDate.init(hijriYear, hijriMonth, hijriDay);
    return hijriDate.toGregorian();
  }

  /**
   * Get Islamic events for a specific Hijri date
   */
  static getIslamicEventsForDate(hijriMonth: number, hijriDay: number): string[] {
    const key = `${hijriMonth}-${hijriDay}`;
    const events = this.islamicEvents.get(key);
    return events ? events.map(event => event.name) : [];
  }

  /**
   * Get detailed Islamic events for a specific Hijri date
   */
  static getDetailedIslamicEventsForDate(hijriMonth: number, hijriDay: number): IslamicEvent[] {
    const key = `${hijriMonth}-${hijriDay}`;
    return this.islamicEvents.get(key) || [];
  }

  /**
   * Check if a given Hijri date is during Ramadan
   */
  static isRamadan(hijriMonth: number): boolean {
    return hijriMonth === 9; // Ramadan is the 9th month
  }

  /**
   * Get the current Islamic date
   */
  static getCurrentIslamicDate(): IslamicDate {
    return this.convertToHijri(new Date());
  }

  /**
   * Get Islamic date for a range of days
   */
  static getIslamicDateRange(startDate: Date, days: number): IslamicDate[] {
    const dates: IslamicDate[] = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      dates.push(this.convertToHijri(currentDate));
    }
    
    return dates;
  }

  /**
   * Calculate Ramadan times (Suhoor and Iftar) for a location
   * This uses the Fajr time for Suhoor end and Maghrib time for Iftar
   */
  static async calculateRamadanTimes(
    _location: Location, 
    date: Date,
    prayerTimes: PrayerTimes
  ): Promise<RamadanTimes> {
    // Suhoor ends at Fajr time
    const suhoorTime = new Date(prayerTimes.fajr);
    
    // Iftar begins at Maghrib time
    const iftarTime = new Date(prayerTimes.maghrib);
    
    return {
      suhoorTime,
      iftarTime,
      date
    };
  }

  /**
   * Get Ramadan times for multiple days
   */
  static async calculateRamadanTimesRange(
    location: Location,
    startDate: Date,
    days: number,
    getPrayerTimes: (date: Date) => Promise<PrayerTimes>
  ): Promise<RamadanTimes[]> {
    const ramadanTimes: RamadanTimes[] = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const prayerTimes = await getPrayerTimes(currentDate);
      const ramadanTime = await this.calculateRamadanTimes(location, currentDate, prayerTimes);
      ramadanTimes.push(ramadanTime);
    }
    
    return ramadanTimes;
  }

  /**
   * Get the name of a Hijri month
   */
  static getHijriMonthName(monthNumber: number, language: 'en' | 'ar' = 'en'): string {
    const index = monthNumber - 1; // Convert to 0-based index
    if (index < 0 || index >= 12) {
      throw new Error('Invalid month number. Must be between 1 and 12.');
    }
    
    return language === 'ar' 
      ? this.hijriMonthNamesAr[index] 
      : this.hijriMonthNames[index];
  }

  /**
   * Check if a date has any Islamic events
   */
  static hasEvents(hijriMonth: number, hijriDay: number): boolean {
    const key = `${hijriMonth}-${hijriDay}`;
    return this.islamicEvents.has(key);
  }

  /**
   * Get all Islamic holidays in a given Hijri year
   */
  static getHolidaysInYear(hijriYear: number): Array<{
    date: IslamicDate;
    events: IslamicEvent[];
  }> {
    const holidays: Array<{ date: IslamicDate; events: IslamicEvent[] }> = [];
    
    // Iterate through all months and days to find holidays
    for (let month = 1; month <= 12; month++) {
      for (let day = 1; day <= 30; day++) {
        const events = this.getDetailedIslamicEventsForDate(month, day);
        const holidayEvents = events.filter(event => event.isHoliday);
        
        if (holidayEvents.length > 0) {
          try {
            const gregorianDate = this.convertToGregorian(hijriYear, month, day);
            const islamicDate = this.convertToHijri(gregorianDate);
            holidays.push({
              date: islamicDate,
              events: holidayEvents
            });
          } catch (error) {
            // Skip invalid dates (e.g., 30th day of months with only 29 days)
            continue;
          }
        }
      }
    }
    
    return holidays;
  }

  /**
   * Format Islamic date as string
   */
  static formatIslamicDate(islamicDate: IslamicDate, language: 'en' | 'ar' = 'en'): string {
    const monthName = this.getHijriMonthName(
      this.hijriMonthNames.indexOf(islamicDate.hijriMonth) + 1,
      language
    );
    
    if (language === 'ar') {
      return `${islamicDate.hijriDay} ${monthName} ${islamicDate.hijriYear} هـ`;
    } else {
      return `${islamicDate.hijriDay} ${monthName} ${islamicDate.hijriYear} AH`;
    }
  }

  /**
   * Cache Islamic calendar data for offline use
   */
  static async cacheIslamicCalendarData(
    startDate: Date,
    endDate: Date,
    islamicDates: IslamicDate[]
  ): Promise<void> {
    try {
      const cacheData = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        islamicDates,
        cachedAt: new Date().toISOString()
      };

      // Use the existing cache method from OfflineStorageService
      await OfflineStorageService.cacheIslamicCalendar(cacheData);
    } catch (error) {
      console.error('Error caching Islamic calendar data:', error);
    }
  }

  /**
   * Get cached Islamic calendar data
   */
  static async getCachedIslamicCalendarData(
    startDate: Date,
    endDate: Date
  ): Promise<IslamicDate[] | null> {
    try {
      const cached = await OfflineStorageService.getCachedIslamicCalendar();
      
      if (!cached) return null;

      const cachedStartDate = new Date(cached.startDate);
      const cachedEndDate = new Date(cached.endDate);

      // Check if requested range is within cached range
      if (startDate >= cachedStartDate && endDate <= cachedEndDate) {
        // Filter the cached data to match the requested range
        return cached.islamicDates.filter((date: IslamicDate) => {
          const islamicDate = new Date(date.gregorianDate);
          return islamicDate >= startDate && islamicDate <= endDate;
        });
      }

      return null;
    } catch (error) {
      console.error('Error retrieving cached Islamic calendar data:', error);
      return null;
    }
  }

  /**
   * Get Islamic date range with offline support
   */
  static async getIslamicDateRangeWithCache(
    startDate: Date,
    days: number
  ): Promise<IslamicDate[]> {
    try {
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + days - 1);

      // Try to get from cache first
      const cachedData = await this.getCachedIslamicCalendarData(startDate, endDate);
      if (cachedData) {
        return cachedData;
      }

      // If not in cache, calculate fresh
      const islamicDates = this.getIslamicDateRange(startDate, days);
      
      // Cache the results
      await this.cacheIslamicCalendarData(startDate, endDate, islamicDates);
      
      return islamicDates;
    } catch (error) {
      console.error('Error getting Islamic date range with cache:', error);
      // Fallback to regular calculation
      return this.getIslamicDateRange(startDate, days);
    }
  }

  /**
   * Get Ramadan times with offline support
   */
  static async calculateRamadanTimesWithCache(
    location: Location,
    date: Date,
    prayerTimes: PrayerTimes
  ): Promise<RamadanTimes> {
    try {
      // For Ramadan times, we can use the prayer times directly
      // as they are already cached by the PrayerTimesService
      return this.calculateRamadanTimes(location, date, prayerTimes);
    } catch (error) {
      console.error('Error calculating Ramadan times with cache:', error);
      throw error;
    }
  }

  /**
   * Clear cached Islamic calendar data
   */
  static async clearIslamicCalendarCache(): Promise<void> {
    try {
      await OfflineStorageService.clearAllCache();
    } catch (error) {
      console.error('Error clearing Islamic calendar cache:', error);
    }
  }
}