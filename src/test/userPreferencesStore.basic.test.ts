import { describe, it, expect } from 'vitest';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { Madhab, CalculationMethod } from '../../types';

describe('Enhanced User Preferences Store - Basic Tests', () => {
  it('should initialize with default preferences', () => {
    const store = useUserPreferencesStore.getState();
    
    expect(store.preferences.language).toBe('ar');
    expect(store.preferences.madhab).toBe(Madhab.HANAFI);
    expect(store.preferences.calculationMethod).toBe(CalculationMethod.ISNA);
    expect(store.isInitialized).toBe(false);
    expect(store.isLoading).toBe(false);
    expect(store.isSyncing).toBe(false);
    expect(store.initializationError).toBeNull();
    expect(store.syncError).toBeNull();
  });

  it('should have comprehensive preferences structure', () => {
    const store = useUserPreferencesStore.getState();
    const prefs = store.preferences;
    
    // Check all sections exist
    expect(prefs.notifications).toBeDefined();
    expect(prefs.display).toBeDefined();
    expect(prefs.calculation).toBeDefined();
    expect(prefs.privacy).toBeDefined();
    expect(prefs.accessibility).toBeDefined();
    
    // Check notification preferences
    expect(prefs.notifications.enabled).toBe(true);
    expect(prefs.notifications.offsetMinutes).toBe(5);
    expect(prefs.notifications.sound).toBe('default');
    
    // Check display preferences
    expect(prefs.display.theme).toBe('auto');
    expect(prefs.display.fontSize).toBe('medium');
    
    // Check calculation preferences
    expect(prefs.calculation.calculationMethod).toBe(CalculationMethod.ISNA);
    expect(prefs.calculation.madhab).toBe(Madhab.HANAFI);
  });

  it('should have all required methods', () => {
    const store = useUserPreferencesStore.getState();
    
    // Core methods
    expect(typeof store.updatePreferences).toBe('function');
    expect(typeof store.setLanguage).toBe('function');
    expect(typeof store.setMadhab).toBe('function');
    expect(typeof store.setCalculationMethod).toBe('function');
    expect(typeof store.setNotificationSettings).toBe('function');
    expect(typeof store.setLocation).toBe('function');
    
    // Enhanced methods
    expect(typeof store.updateNotificationPreferences).toBe('function');
    expect(typeof store.updateDisplayPreferences).toBe('function');
    expect(typeof store.updateCalculationPreferences).toBe('function');
    expect(typeof store.updatePrivacyPreferences).toBe('function');
    expect(typeof store.updateAccessibilityPreferences).toBe('function');
    
    // Initialization and sync methods
    expect(typeof store.initializeFromStorage).toBe('function');
    expect(typeof store.syncWithStorage).toBe('function');
    expect(typeof store.validateAndUpdate).toBe('function');
    
    // Error handling
    expect(typeof store.clearErrors).toBe('function');
    expect(typeof store.resetToDefaults).toBe('function');
    
    // Event system
    expect(typeof store.onSettingsChange).toBe('function');
  });

  it('should manage event listeners', () => {
    const store = useUserPreferencesStore.getState();
    
    const listener1 = () => {};
    const listener2 = () => {};
    
    // Add listeners
    const unsubscribe1 = store.onSettingsChange(listener1);
    const unsubscribe2 = store.onSettingsChange(listener2);
    
    // Check listeners are added
    expect(store._eventListeners.size).toBe(2);
    expect(store._eventListeners.has(listener1)).toBe(true);
    expect(store._eventListeners.has(listener2)).toBe(true);
    
    // Remove one listener
    unsubscribe1();
    expect(store._eventListeners.size).toBe(1);
    expect(store._eventListeners.has(listener1)).toBe(false);
    expect(store._eventListeners.has(listener2)).toBe(true);
    
    // Remove second listener
    unsubscribe2();
    expect(store._eventListeners.size).toBe(0);
  });

  it('should clear errors', () => {
    const store = useUserPreferencesStore.getState();
    
    // Set some errors
    useUserPreferencesStore.setState({
      initializationError: new Error('Init error'),
      syncError: new Error('Sync error')
    });
    
    // Verify errors are set
    expect(useUserPreferencesStore.getState().initializationError).toBeTruthy();
    expect(useUserPreferencesStore.getState().syncError).toBeTruthy();
    
    // Clear errors
    store.clearErrors();
    
    // Verify errors are cleared
    const updatedStore = useUserPreferencesStore.getState();
    expect(updatedStore.initializationError).toBeNull();
    expect(updatedStore.syncError).toBeNull();
  });
});