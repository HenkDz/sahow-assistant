import { Preferences } from '@capacitor/preferences';
import { CalculationMethod, Madhab, UserPreferences } from '../types';

export interface NotificationPreferences {
  enabled: boolean;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  offsetMinutes: number; // minutes before prayer time
  sound: 'default' | 'adhan' | 'silent';
  vibration: boolean;
}

export interface DisplayPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  showSeconds: boolean;
  show24Hour: boolean;
  showHijriDate: boolean;
  showQiblaDistance: boolean;
}

export interface CalculationPreferences {
  calculationMethod: CalculationMethod;
  madhab: Madhab;
  fajrAngle?: number;
  ishaAngle?: number;
  maghribAngle?: number;
  elevationRule: 'none' | 'night-middle' | 'angle-based' | 'one-seventh' | 'angle-based-night-middle';
  highLatRule: 'none' | 'night-middle' | 'angle-based' | 'one-seventh' | 'angle-based-night-middle';
}

export interface ComprehensiveUserPreferences extends UserPreferences {
  notifications: NotificationPreferences;
  display: DisplayPreferences;
  calculation: CalculationPreferences;
  privacy: {
    analyticsEnabled: boolean;
    crashReportingEnabled: boolean;
    locationDataSharing: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
  };
}

export class SettingsService {
  private static readonly STORAGE_KEY = 'comprehensive_user_preferences';
  private static readonly DEFAULTS: ComprehensiveUserPreferences = {
    language: 'ar',
    location: undefined,
    calculationMethod: CalculationMethod.ISNA,
    madhab: Madhab.HANAFI,
    notificationsEnabled: true,
    notificationOffset: 5,
    notifications: {
      enabled: true,
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
      offsetMinutes: 5,
      sound: 'default',
      vibration: true
    },
    display: {
      theme: 'auto',
      fontSize: 'medium',
      showSeconds: false,
      show24Hour: false,
      showHijriDate: true,
      showQiblaDistance: true
    },
    calculation: {
      calculationMethod: CalculationMethod.ISNA,
      madhab: Madhab.HANAFI,
      elevationRule: 'none',
      highLatRule: 'none'
    },
    privacy: {
      analyticsEnabled: true,
      crashReportingEnabled: true,
      locationDataSharing: false
    },
    accessibility: {
      highContrast: false,
      largeText: false,
      reduceMotion: false,
      screenReader: false
    }
  };

  /**
   * Get all user preferences
   */
  static async getPreferences(): Promise<ComprehensiveUserPreferences> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      
      if (!value) {
        return { ...this.DEFAULTS };
      }

      const stored = JSON.parse(value);
      
      // Merge with defaults to ensure all properties exist
      return {
        ...this.DEFAULTS,
        ...stored,
        notifications: { ...this.DEFAULTS.notifications, ...stored.notifications },
        display: { ...this.DEFAULTS.display, ...stored.display },
        calculation: { ...this.DEFAULTS.calculation, ...stored.calculation },
        privacy: { ...this.DEFAULTS.privacy, ...stored.privacy },
        accessibility: { ...this.DEFAULTS.accessibility, ...stored.accessibility }
      };
    } catch (error) {
      console.error('Error loading preferences:', error);
      return { ...this.DEFAULTS };
    }
  }

  /**
   * Save all user preferences
   */
  static async savePreferences(preferences: ComprehensiveUserPreferences): Promise<void> {
    try {
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(preferences)
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  /**
   * Update specific preference section
   */
  static async updatePreferences<T extends keyof ComprehensiveUserPreferences>(
    section: T,
    updates: Partial<ComprehensiveUserPreferences[T]>
  ): Promise<void> {
    try {
      const current = await this.getPreferences();
      
      if (typeof current[section] === 'object' && current[section] !== null && !Array.isArray(current[section])) {
        const updated = {
          ...current,
          [section]: { ...current[section] as object, ...updates as object }
        };
        await this.savePreferences(updated);
      } else {
        const updated = {
          ...current,
          [section]: updates
        };
        await this.savePreferences(updated);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error(`Failed to update ${section} preferences`);
    }
  }

  /**
   * Reset preferences to defaults
   */
  static async resetToDefaults(): Promise<void> {
    try {
      await this.savePreferences({ ...this.DEFAULTS });
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw new Error('Failed to reset preferences');
    }
  }

  /**
   * Get calculation method key for translation lookup
   */
  static getCalculationMethodKey(method: CalculationMethod): string {
    const methodKeys = {
      [CalculationMethod.ISNA]: 'ISNA',
      [CalculationMethod.MWL]: 'MWL',
      [CalculationMethod.EGYPT]: 'EGYPT',
      [CalculationMethod.MAKKAH]: 'MAKKAH',
      [CalculationMethod.KARACHI]: 'KARACHI',
      [CalculationMethod.TEHRAN]: 'TEHRAN',
      [CalculationMethod.JAFARI]: 'JAFARI'
    };

    return methodKeys[method] || methodKeys[CalculationMethod.ISNA];
  }

  /**
   * Get madhab key for translation lookup
   */
  static getMadhabKey(madhab: Madhab): string {
    const madhabKeys = {
      [Madhab.HANAFI]: 'HANAFI',
      [Madhab.SHAFI]: 'SHAFI',
      [Madhab.MALIKI]: 'MALIKI',
      [Madhab.HANBALI]: 'HANBALI'
    };

    return madhabKeys[madhab] || madhabKeys[Madhab.HANAFI];
  }

  /**
   * Validate preferences before saving
   */
  static validatePreferences(preferences: ComprehensiveUserPreferences): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate notification offset
    if (preferences.notifications.offsetMinutes < 0 || preferences.notifications.offsetMinutes > 60) {
      errors.push('Notification offset must be between 0 and 60 minutes');
    }

    // Validate custom angles if provided
    if (preferences.calculation.fajrAngle && (preferences.calculation.fajrAngle < 10 || preferences.calculation.fajrAngle > 20)) {
      errors.push('Fajr angle must be between 10 and 20 degrees');
    }

    if (preferences.calculation.ishaAngle && (preferences.calculation.ishaAngle < 10 || preferences.calculation.ishaAngle > 20)) {
      errors.push('Isha angle must be between 10 and 20 degrees');
    }

    // Validate location if provided
    if (preferences.location) {
      if (preferences.location.latitude < -90 || preferences.location.latitude > 90) {
        errors.push('Invalid latitude value');
      }
      if (preferences.location.longitude < -180 || preferences.location.longitude > 180) {
        errors.push('Invalid longitude value');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Export preferences for backup
   */
  static async exportPreferences(): Promise<string> {
    try {
      const preferences = await this.getPreferences();
      return JSON.stringify(preferences, null, 2);
    } catch (error) {
      console.error('Error exporting preferences:', error);
      throw new Error('Failed to export preferences');
    }
  }

  /**
   * Import preferences from backup
   */
  static async importPreferences(data: string): Promise<void> {
    try {
      const preferences = JSON.parse(data) as ComprehensiveUserPreferences;
      
      // Validate imported preferences
      const validation = this.validatePreferences(preferences);
      if (!validation.isValid) {
        throw new Error(`Invalid preferences: ${validation.errors.join(', ')}`);
      }

      await this.savePreferences(preferences);
    } catch (error) {
      console.error('Error importing preferences:', error);
      throw new Error('Failed to import preferences');
    }
  }

  /**
   * Get preferences optimized for prayer time calculation
   */
  static async getPrayerCalculationPreferences(): Promise<{
    calculationMethod: CalculationMethod;
    madhab: Madhab;
    fajrAngle?: number;
    ishaAngle?: number;
    maghribAngle?: number;
    elevationRule: string;
    highLatRule: string;
  }> {
    const preferences = await this.getPreferences();
    return {
      calculationMethod: preferences.calculation.calculationMethod,
      madhab: preferences.calculation.madhab,
      fajrAngle: preferences.calculation.fajrAngle,
      ishaAngle: preferences.calculation.ishaAngle,
      maghribAngle: preferences.calculation.maghribAngle,
      elevationRule: preferences.calculation.elevationRule,
      highLatRule: preferences.calculation.highLatRule
    };
  }
}
