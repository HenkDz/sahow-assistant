import { describe, it, expect, beforeEach } from 'vitest';
import { useUserPreferencesStore } from '../../../stores/userPreferencesStore';
import { Madhab, CalculationMethod } from '../../../types';

describe('UserPreferencesStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUserPreferencesStore.setState({
      preferences: {
        language: 'en',
        madhab: Madhab.HANAFI,
        calculationMethod: CalculationMethod.MWL,
        notificationsEnabled: true,
        notificationOffset: 10,
        location: undefined,
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
          calculationMethod: CalculationMethod.MWL,
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
      },
      isInitialized: false,
      isLoading: false,
      initializationError: null,
      lastSyncTime: null,
      isSyncing: false,
      syncError: null,
      _eventListeners: new Set()
    });
  });

  it('should have default preferences', () => {
    const { preferences } = useUserPreferencesStore.getState();
    
    expect(preferences.language).toBe('en');
    expect(preferences.madhab).toBe(Madhab.HANAFI);
    expect(preferences.calculationMethod).toBe(CalculationMethod.MWL);
    expect(preferences.notificationsEnabled).toBe(true);
    expect(preferences.notificationOffset).toBe(10);
  });

  it('should update language preference', () => {
    const { setLanguage } = useUserPreferencesStore.getState();
    
    setLanguage('ar');
    
    const { preferences } = useUserPreferencesStore.getState();
    expect(preferences.language).toBe('ar');
  });

  it('should update madhab preference', () => {
    const { setMadhab } = useUserPreferencesStore.getState();
    
    setMadhab(Madhab.SHAFI);
    
    const { preferences } = useUserPreferencesStore.getState();
    expect(preferences.madhab).toBe(Madhab.SHAFI);
  });

  it('should update calculation method', () => {
    const { setCalculationMethod } = useUserPreferencesStore.getState();
    
    setCalculationMethod(CalculationMethod.ISNA);
    
    const { preferences } = useUserPreferencesStore.getState();
    expect(preferences.calculationMethod).toBe(CalculationMethod.ISNA);
  });

  it('should update notification settings', () => {
    const { setNotificationSettings } = useUserPreferencesStore.getState();
    
    setNotificationSettings(false, 15);
    
    const { preferences } = useUserPreferencesStore.getState();
    expect(preferences.notificationsEnabled).toBe(false);
    expect(preferences.notificationOffset).toBe(15);
  });

  it('should update location', () => {
    const { setLocation } = useUserPreferencesStore.getState();
    const testLocation = {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      country: 'USA',
    };
    
    setLocation(testLocation);
    
    const { preferences } = useUserPreferencesStore.getState();
    expect(preferences.location).toEqual(testLocation);
  });

  it('should update multiple preferences at once', () => {
    const { updatePreferences } = useUserPreferencesStore.getState();
    
    updatePreferences({
      language: 'ar',
      madhab: Madhab.MALIKI,
      notificationsEnabled: false,
    });
    
    const { preferences } = useUserPreferencesStore.getState();
    expect(preferences.language).toBe('ar');
    expect(preferences.madhab).toBe(Madhab.MALIKI);
    expect(preferences.notificationsEnabled).toBe(false);
    // Other preferences should remain unchanged
    expect(preferences.calculationMethod).toBe(CalculationMethod.MWL);
    expect(preferences.notificationOffset).toBe(10);
  });
});