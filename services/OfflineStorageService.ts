import { Preferences } from '@capacitor/preferences';
import { PrayerTimes, UserPreferences, Location } from '../types';

export interface CachedPrayerTimes {
  data: PrayerTimes[];
  location: Location;
  cachedAt: Date;
  calculationMethod: string;
  madhab: string;
}

export interface OfflineData {
  prayerTimes: CachedPrayerTimes | null;
  userPreferences: UserPreferences | null;
  tasbihData: any | null;
  lastSync: Date | null;
  networkStatus: 'online' | 'offline';
}

export class OfflineStorageService {
  private static readonly STORAGE_KEYS = {
    PRAYER_TIMES: 'cached_prayer_times',
    USER_PREFERENCES: 'user_preferences',
    TASBIH_DATA: 'tasbih_data',
    LAST_SYNC: 'last_sync',
    NETWORK_STATUS: 'network_status',
    QIBLA_DIRECTION: 'cached_qibla_direction',
    ISLAMIC_CALENDAR: 'cached_islamic_calendar'
  };

  private static readonly CACHE_EXPIRY = {
    PRAYER_TIMES: 24 * 60 * 60 * 1000, // 24 hours
    QIBLA_DIRECTION: 7 * 24 * 60 * 60 * 1000, // 7 days
    ISLAMIC_CALENDAR: 30 * 24 * 60 * 60 * 1000 // 30 days
  };

  /**
   * Cache prayer times for offline access
   */
  static async cachePrayerTimes(
    prayerTimes: PrayerTimes[],
    location: Location,
    calculationMethod: string,
    madhab: string
  ): Promise<void> {
    try {
      const cachedData: CachedPrayerTimes = {
        data: prayerTimes,
        location,
        cachedAt: new Date(),
        calculationMethod,
        madhab
      };

      await Preferences.set({
        key: this.STORAGE_KEYS.PRAYER_TIMES,
        value: JSON.stringify({
          ...cachedData,
          cachedAt: cachedData.cachedAt.toISOString(),
          data: cachedData.data.map(pt => ({
            ...pt,
            date: pt.date.toISOString(),
            fajr: pt.fajr.toISOString(),
            sunrise: pt.sunrise.toISOString(),
            dhuhr: pt.dhuhr.toISOString(),
            asr: pt.asr.toISOString(),
            maghrib: pt.maghrib.toISOString(),
            isha: pt.isha.toISOString()
          }))
        })
      });
    } catch (error) {
      console.error('Error caching prayer times:', error);
    }
  }

  /**
   * Retrieve cached prayer times
   */
  static async getCachedPrayerTimes(): Promise<CachedPrayerTimes | null> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEYS.PRAYER_TIMES });
      
      if (!value) return null;

      const cached = JSON.parse(value);
      const cachedAt = new Date(cached.cachedAt);
      
      // Check if cache is expired
      const now = new Date();
      const cacheAge = now.getTime() - cachedAt.getTime();
      
      if (cacheAge > this.CACHE_EXPIRY.PRAYER_TIMES) {
        await this.clearCachedPrayerTimes();
        return null;
      }

      return {
        ...cached,
        cachedAt,
        data: cached.data.map((pt: any) => ({
          ...pt,
          date: new Date(pt.date),
          fajr: new Date(pt.fajr),
          sunrise: new Date(pt.sunrise),
          dhuhr: new Date(pt.dhuhr),
          asr: new Date(pt.asr),
          maghrib: new Date(pt.maghrib),
          isha: new Date(pt.isha)
        }))
      };
    } catch (error) {
      console.error('Error retrieving cached prayer times:', error);
      return null;
    }
  }

  /**
   * Clear cached prayer times
   */
  static async clearCachedPrayerTimes(): Promise<void> {
    try {
      await Preferences.remove({ key: this.STORAGE_KEYS.PRAYER_TIMES });
    } catch (error) {
      console.error('Error clearing cached prayer times:', error);
    }
  }

  /**
   * Cache user preferences
   */
  static async cacheUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      await Preferences.set({
        key: this.STORAGE_KEYS.USER_PREFERENCES,
        value: JSON.stringify(preferences)
      });
    } catch (error) {
      console.error('Error caching user preferences:', error);
    }
  }

  /**
   * Retrieve cached user preferences
   */
  static async getCachedUserPreferences(): Promise<UserPreferences | null> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEYS.USER_PREFERENCES });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error retrieving cached user preferences:', error);
      return null;
    }
  }

  /**
   * Cache Qibla direction data
   */
  static async cacheQiblaDirection(
    location: Location,
    direction: number,
    distance: number
  ): Promise<void> {
    try {
      const data = {
        location,
        direction,
        distance,
        cachedAt: new Date().toISOString()
      };

      await Preferences.set({
        key: this.STORAGE_KEYS.QIBLA_DIRECTION,
        value: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error caching Qibla direction:', error);
    }
  }

  /**
   * Retrieve cached Qibla direction
   */
  static async getCachedQiblaDirection(location: Location): Promise<{
    direction: number;
    distance: number;
    cachedAt: Date;
  } | null> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEYS.QIBLA_DIRECTION });
      
      if (!value) return null;

      const cached = JSON.parse(value);
      const cachedAt = new Date(cached.cachedAt);
      
      // Check if cache is expired
      const now = new Date();
      const cacheAge = now.getTime() - cachedAt.getTime();
      
      if (cacheAge > this.CACHE_EXPIRY.QIBLA_DIRECTION) {
        await Preferences.remove({ key: this.STORAGE_KEYS.QIBLA_DIRECTION });
        return null;
      }

      // Check if location is similar (within 1km)
      const locationDistance = this.calculateDistance(
        location.latitude,
        location.longitude,
        cached.location.latitude,
        cached.location.longitude
      );

      if (locationDistance > 1) {
        return null; // Location too different, invalidate cache
      }

      return {
        direction: cached.direction,
        distance: cached.distance,
        cachedAt
      };
    } catch (error) {
      console.error('Error retrieving cached Qibla direction:', error);
      return null;
    }
  }

  /**
   * Update last sync timestamp
   */
  static async updateLastSync(): Promise<void> {
    try {
      await Preferences.set({
        key: this.STORAGE_KEYS.LAST_SYNC,
        value: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating last sync:', error);
    }
  }

  /**
   * Get last sync timestamp
   */
  static async getLastSync(): Promise<Date | null> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEYS.LAST_SYNC });
      return value ? new Date(value) : null;
    } catch (error) {
      console.error('Error retrieving last sync:', error);
      return null;
    }
  }

  /**
   * Set network status
   */
  static async setNetworkStatus(status: 'online' | 'offline'): Promise<void> {
    try {
      await Preferences.set({
        key: this.STORAGE_KEYS.NETWORK_STATUS,
        value: status
      });
    } catch (error) {
      console.error('Error setting network status:', error);
    }
  }

  /**
   * Get network status
   */
  static async getNetworkStatus(): Promise<'online' | 'offline'> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEYS.NETWORK_STATUS });
      return (value as 'online' | 'offline') || 'online';
    } catch (error) {
      console.error('Error getting network status:', error);
      return 'online';
    }
  }

  /**
   * Get all offline data
   */
  static async getAllOfflineData(): Promise<OfflineData> {
    try {
      const [prayerTimes, userPreferences, lastSync, networkStatus] = await Promise.all([
        this.getCachedPrayerTimes(),
        this.getCachedUserPreferences(),
        this.getLastSync(),
        this.getNetworkStatus()
      ]);

      // Get tasbih data using the existing key
      const tasbihResult = await Preferences.get({ key: 'tasbih_data' });
      const tasbihData = tasbihResult.value ? JSON.parse(tasbihResult.value) : null;

      return {
        prayerTimes,
        userPreferences,
        tasbihData,
        lastSync,
        networkStatus
      };
    } catch (error) {
      console.error('Error getting offline data:', error);
      return {
        prayerTimes: null,
        userPreferences: null,
        tasbihData: null,
        lastSync: null,
        networkStatus: 'online'
      };
    }
  }

  /**
   * Clear all cached data
   */
  static async clearAllCache(): Promise<void> {
    try {
      await Promise.all([
        Preferences.remove({ key: this.STORAGE_KEYS.PRAYER_TIMES }),
        Preferences.remove({ key: this.STORAGE_KEYS.QIBLA_DIRECTION }),
        Preferences.remove({ key: this.STORAGE_KEYS.ISLAMIC_CALENDAR }),
        Preferences.remove({ key: this.STORAGE_KEYS.LAST_SYNC }),
        Preferences.remove({ key: this.STORAGE_KEYS.NETWORK_STATUS })
      ]);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    prayerTimesSize: number;
    qiblaDirectionSize: number;
    totalSize: number;
    lastSync: Date | null;
  }> {
    try {
      const [prayerTimes, qiblaDirection, lastSync] = await Promise.all([
        Preferences.get({ key: this.STORAGE_KEYS.PRAYER_TIMES }),
        Preferences.get({ key: this.STORAGE_KEYS.QIBLA_DIRECTION }),
        this.getLastSync()
      ]);

      const prayerTimesSize = prayerTimes.value ? prayerTimes.value.length : 0;
      const qiblaDirectionSize = qiblaDirection.value ? qiblaDirection.value.length : 0;
      const totalSize = prayerTimesSize + qiblaDirectionSize;

      return {
        prayerTimesSize,
        qiblaDirectionSize,
        totalSize,
        lastSync
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        prayerTimesSize: 0,
        qiblaDirectionSize: 0,
        totalSize: 0,
        lastSync: null
      };
    }
  }

  /**
   * Cache Islamic calendar data
   */
  static async cacheIslamicCalendar(data: any): Promise<void> {
    try {
      await Preferences.set({
        key: this.STORAGE_KEYS.ISLAMIC_CALENDAR,
        value: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error caching Islamic calendar data:', error);
    }
  }

  /**
   * Retrieve cached Islamic calendar data
   */
  static async getCachedIslamicCalendar(): Promise<any | null> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEYS.ISLAMIC_CALENDAR });
      
      if (!value) return null;

      const cached = JSON.parse(value);
      const cachedAt = new Date(cached.cachedAt);
      
      // Check if cache is expired
      const now = new Date();
      const cacheAge = now.getTime() - cachedAt.getTime();
      
      if (cacheAge > this.CACHE_EXPIRY.ISLAMIC_CALENDAR) {
        await Preferences.remove({ key: this.STORAGE_KEYS.ISLAMIC_CALENDAR });
        return null;
      }

      return cached;
    } catch (error) {
      console.error('Error retrieving cached Islamic calendar:', error);
      return null;
    }
  }

  /**
   * Check if data needs synchronization
   */
  static async needsSync(): Promise<boolean> {
    try {
      const lastSync = await this.getLastSync();
      if (!lastSync) return true;

      const now = new Date();
      const timeSinceSync = now.getTime() - lastSync.getTime();
      
      // Sync if more than 6 hours have passed
      return timeSinceSync > 6 * 60 * 60 * 1000;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return true;
    }
  }

  /**
   * Synchronize data when connection returns
   */
  static async syncWhenOnline(): Promise<void> {
    try {
      // This method should be called when network connectivity is restored
      // It will be implemented in the specific service classes
      await this.updateLastSync();
      await this.setNetworkStatus('online');
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
