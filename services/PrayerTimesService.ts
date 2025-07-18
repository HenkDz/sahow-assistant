import { 
  Coordinates, 
  PrayerTimes as AdhanPrayerTimes, 
  CalculationMethod as AdhanCalculationMethod,
  CalculationParameters,
  Madhab as AdhanMadhab,
  Prayer,
  Qibla
} from 'adhan';
import { PrayerTimes, Location, CalculationMethod, Madhab } from '../types';

export class PrayerTimesService {
  /**
   * Calculate prayer times for a given location and date
   */
  static async calculatePrayerTimes(
    location: Location,
    date: Date = new Date(),
    calculationMethod: CalculationMethod = CalculationMethod.MWL,
    madhab: Madhab = Madhab.HANAFI
  ): Promise<PrayerTimes> {
    try {
      // Validate coordinates
      if (location.latitude < -90 || location.latitude > 90) {
        throw new Error('Invalid latitude: must be between -90 and 90 degrees');
      }
      if (location.longitude < -180 || location.longitude > 180) {
        throw new Error('Invalid longitude: must be between -180 and 180 degrees');
      }

      const coordinates = new Coordinates(location.latitude, location.longitude);
      
      // Get calculation parameters based on method
      const params = this.getCalculationParameters(calculationMethod);
      
      // Apply madhab-specific adjustments
      this.applyMadhabAdjustments(params, madhab);
      
      // Calculate prayer times using adhan library
      const adhanPrayerTimes = new AdhanPrayerTimes(coordinates, date, params);
      
      // Validate that prayer times are valid dates
      const prayerTimes = {
        fajr: adhanPrayerTimes.fajr,
        sunrise: adhanPrayerTimes.sunrise,
        dhuhr: adhanPrayerTimes.dhuhr,
        asr: adhanPrayerTimes.asr,
        maghrib: adhanPrayerTimes.maghrib,
        isha: adhanPrayerTimes.isha,
        date: date,
        location: `${location.city}, ${location.country}`
      };

      // Check if any prayer time is invalid
      const times = [prayerTimes.fajr, prayerTimes.sunrise, prayerTimes.dhuhr, prayerTimes.asr, prayerTimes.maghrib, prayerTimes.isha];
      if (times.some(time => isNaN(time.getTime()))) {
        throw new Error('Unable to calculate prayer times for the given location and date');
      }
      
      return prayerTimes;
    } catch (error) {
      throw new Error(`Failed to calculate prayer times: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the next upcoming prayer from current prayer times
   */
  static getNextPrayer(prayerTimes: PrayerTimes): { name: string; time: Date } | null {
    if (!prayerTimes) return null;
    
    const now = new Date();
    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Sunrise', time: prayerTimes.sunrise },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha },
    ];
    
    // Find the next prayer time for today
    for (const prayer of prayers) {
      if (prayer.time > now) {
        return prayer;
      }
    }
    
    // If no prayer is found for today, return Fajr of next day
    const nextDay = new Date(prayerTimes.date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextFajr = new Date(prayerTimes.fajr);
    nextFajr.setDate(nextFajr.getDate() + 1);
    
    return { name: 'Fajr', time: nextFajr };
  }

  /**
   * Get current prayer based on current time
   */
  static getCurrentPrayer(prayerTimes: PrayerTimes): { name: string; time: Date } | null {
    if (!prayerTimes) return null;
    
    const now = new Date();
    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Sunrise', time: prayerTimes.sunrise },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha },
    ];
    
    // Find current prayer period
    for (let i = prayers.length - 1; i >= 0; i--) {
      if (now >= prayers[i].time) {
        return prayers[i];
      }
    }
    
    return null;
  }

  /**
   * Calculate prayer times for multiple days
   */
  static async calculateWeeklyPrayerTimes(
    location: Location,
    startDate: Date = new Date(),
    days: number = 7,
    calculationMethod: CalculationMethod = CalculationMethod.MWL,
    madhab: Madhab = Madhab.HANAFI
  ): Promise<PrayerTimes[]> {
    const prayerTimesArray: PrayerTimes[] = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const prayerTimes = await this.calculatePrayerTimes(
        location,
        currentDate,
        calculationMethod,
        madhab
      );
      
      prayerTimesArray.push(prayerTimes);
    }
    
    return prayerTimesArray;
  }

  /**
   * Get time remaining until next prayer in minutes
   */
  static getTimeUntilNextPrayer(prayerTimes: PrayerTimes): number {
    const nextPrayer = this.getNextPrayer(prayerTimes);
    if (!nextPrayer) return 0;
    
    const now = new Date();
    const timeDiff = nextPrayer.time.getTime() - now.getTime();
    return Math.max(0, Math.floor(timeDiff / (1000 * 60))); // Convert to minutes
  }

  /**
   * Check if it's currently prayer time (within 5 minutes of prayer time)
   */
  static isCurrentlyPrayerTime(prayerTimes: PrayerTimes, toleranceMinutes: number = 5): boolean {
    const now = new Date();
    const prayers = [
      prayerTimes.fajr,
      prayerTimes.dhuhr,
      prayerTimes.asr,
      prayerTimes.maghrib,
      prayerTimes.isha
    ];
    
    return prayers.some(prayerTime => {
      const timeDiff = Math.abs(now.getTime() - prayerTime.getTime());
      const diffMinutes = timeDiff / (1000 * 60);
      return diffMinutes <= toleranceMinutes;
    });
  }

  /**
   * Get calculation parameters based on calculation method
   */
  private static getCalculationParameters(method: CalculationMethod): CalculationParameters {
    switch (method) {
      case CalculationMethod.MWL:
        return AdhanCalculationMethod.MuslimWorldLeague();
      case CalculationMethod.ISNA:
        return AdhanCalculationMethod.NorthAmerica();
      case CalculationMethod.EGYPT:
        return AdhanCalculationMethod.Egyptian();
      case CalculationMethod.MAKKAH:
        return AdhanCalculationMethod.UmmAlQura();
      case CalculationMethod.KARACHI:
        return AdhanCalculationMethod.Karachi();
      case CalculationMethod.TEHRAN:
        return AdhanCalculationMethod.Tehran();
      case CalculationMethod.JAFARI:
        return AdhanCalculationMethod.Tehran(); // Using Tehran as closest to Jafari
      default:
        return AdhanCalculationMethod.MuslimWorldLeague();
    }
  }

  /**
   * Apply madhab-specific adjustments to calculation parameters
   */
  private static applyMadhabAdjustments(params: CalculationParameters, madhab: Madhab): void {
    switch (madhab) {
      case Madhab.HANAFI:
        params.madhab = AdhanMadhab.Hanafi;
        break;
      case Madhab.SHAFI:
      case Madhab.MALIKI:
      case Madhab.HANBALI:
        params.madhab = AdhanMadhab.Shafi;
        break;
      default:
        params.madhab = AdhanMadhab.Shafi;
    }
  }

  /**
   * Format prayer time for display
   */
  static formatPrayerTime(time: Date, use24Hour: boolean = false): string {
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !use24Hour
    };
    
    return time.toLocaleTimeString('en-US', options);
  }

  /**
   * Get Qibla direction for a location
   */
  static getQiblaDirection(location: Location): number {
    try {
      // Mecca coordinates
      const meccaLat = 21.4225;
      const meccaLng = 39.8262;
      
      // Convert degrees to radians
      const lat1 = location.latitude * Math.PI / 180;
      const lat2 = meccaLat * Math.PI / 180;
      const deltaLng = (meccaLng - location.longitude) * Math.PI / 180;
      
      // Calculate bearing using great circle formula
      const y = Math.sin(deltaLng) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
      
      let bearing = Math.atan2(y, x) * 180 / Math.PI;
      
      // Normalize to 0-360 degrees
      bearing = (bearing + 360) % 360;
      
      return bearing;
    } catch (error) {
      throw new Error(`Failed to calculate Qibla direction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}