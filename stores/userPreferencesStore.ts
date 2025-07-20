import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserPreferences, Madhab, CalculationMethod, Language } from '../types';
import { SettingsService, ComprehensiveUserPreferences } from '../services/SettingsService';

// Enhanced state interface with initialization and error management
interface EnhancedUserPreferencesState {
  // Core preferences (comprehensive)
  preferences: ComprehensiveUserPreferences;
  
  // Initialization state
  isInitialized: boolean;
  isLoading: boolean;
  initializationError: Error | null;
  
  // Synchronization state
  lastSyncTime: Date | null;
  isSyncing: boolean;
  syncError: Error | null;
  
  // Core preference update methods
  updatePreferences: (updates: Partial<ComprehensiveUserPreferences>) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  setMadhab: (madhab: Madhab) => Promise<void>;
  setCalculationMethod: (method: CalculationMethod) => Promise<void>;
  setNotificationSettings: (enabled: boolean, offset?: number) => Promise<void>;
  setLocation: (location: UserPreferences['location']) => Promise<void>;
  
  // Enhanced methods for comprehensive settings
  updateNotificationPreferences: (updates: Partial<ComprehensiveUserPreferences['notifications']>) => Promise<void>;
  updateDisplayPreferences: (updates: Partial<ComprehensiveUserPreferences['display']>) => Promise<void>;
  updateCalculationPreferences: (updates: Partial<ComprehensiveUserPreferences['calculation']>) => Promise<void>;
  updateQiblaPreferences: (updates: Partial<ComprehensiveUserPreferences['qibla']>) => Promise<void>;
  updatePrivacyPreferences: (updates: Partial<ComprehensiveUserPreferences['privacy']>) => Promise<void>;
  updateAccessibilityPreferences: (updates: Partial<ComprehensiveUserPreferences['accessibility']>) => Promise<void>;
  
  // Initialization and synchronization methods
  initializeFromStorage: () => Promise<void>;
  syncWithStorage: () => Promise<void>;
  validateAndUpdate: (updates: Partial<ComprehensiveUserPreferences>) => Promise<boolean>;
  
  // Error handling and recovery
  clearErrors: () => void;
  resetToDefaults: () => Promise<void>;
  
  // Event system for UnifiedSettingsManager integration
  onSettingsChange: (callback: (settings: ComprehensiveUserPreferences) => void) => () => void;
  
  // Internal state and helper methods
  _eventListeners: Set<(settings: ComprehensiveUserPreferences) => void>;
  _notifyListeners: (preferences: ComprehensiveUserPreferences) => void;
  _validateAndSync: (updates: Partial<ComprehensiveUserPreferences>) => Promise<boolean>;
}

// Default preferences matching SettingsService defaults
const getDefaultPreferences = (): ComprehensiveUserPreferences => ({
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
  qibla: {
    compassMode: 'automatic',
    preferManualWhenSensorsFail: true
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
});

export const useUserPreferencesStore = create<EnhancedUserPreferencesState>()(
  persist(
    (set, get) => ({
      // Initial state
      preferences: getDefaultPreferences(),
      isInitialized: false,
      isLoading: false,
      initializationError: null,
      lastSyncTime: null,
      isSyncing: false,
      syncError: null,
      _eventListeners: new Set(),
      
      // Helper function to notify event listeners
      _notifyListeners: (preferences: ComprehensiveUserPreferences) => {
        const { _eventListeners } = get();
        _eventListeners.forEach(callback => {
          try {
            callback(preferences);
          } catch (error) {
            console.error('Error in settings change listener:', error);
          }
        });
      },
      
      // Helper function to validate and sync with storage
      _validateAndSync: async (updates: Partial<ComprehensiveUserPreferences>): Promise<boolean> => {
        try {
          const currentPreferences = get().preferences;
          const newPreferences = { ...currentPreferences, ...updates };
          
          // Validate using SettingsService
          const validation = SettingsService.validatePreferences(newPreferences);
          if (!validation.isValid) {
            console.error('Settings validation failed:', validation.errors);
            set({ syncError: new Error(`Validation failed: ${validation.errors.join(', ')}`) });
            return false;
          }
          
          // Save to storage
          await SettingsService.savePreferences(newPreferences);
          
          // Update store state
          set({
            preferences: newPreferences,
            lastSyncTime: new Date(),
            syncError: null
          });
          
          // Notify listeners
          get()._notifyListeners(newPreferences);
          
          return true;
        } catch (error) {
          console.error('Error syncing settings:', error);
          set({ syncError: error as Error });
          return false;
        }
      },
      
      // Core preference update methods (enhanced with validation and sync)
      updatePreferences: async (updates) => {
        set({ isSyncing: true });
        await get()._validateAndSync(updates);
        set({ isSyncing: false });
      },
      
      setLanguage: async (language) => {
        set({ isSyncing: true });
        await get()._validateAndSync({ language });
        set({ isSyncing: false });
      },
      
      setMadhab: async (madhab) => {
        set({ isSyncing: true });
        await get()._validateAndSync({ 
          madhab,
          calculation: { ...get().preferences.calculation, madhab }
        });
        set({ isSyncing: false });
      },
      
      setCalculationMethod: async (calculationMethod) => {
        set({ isSyncing: true });
        await get()._validateAndSync({ 
          calculationMethod,
          calculation: { ...get().preferences.calculation, calculationMethod }
        });
        set({ isSyncing: false });
      },
      
      setNotificationSettings: async (notificationsEnabled, notificationOffset) => {
        set({ isSyncing: true });
        const updates: Partial<ComprehensiveUserPreferences> = {
          notificationsEnabled,
          notifications: {
            ...get().preferences.notifications,
            enabled: notificationsEnabled,
            ...(notificationOffset !== undefined && { offsetMinutes: notificationOffset })
          }
        };
        if (notificationOffset !== undefined) {
          updates.notificationOffset = notificationOffset;
        }
        await get()._validateAndSync(updates);
        set({ isSyncing: false });
      },
      
      setLocation: async (location) => {
        set({ isSyncing: true });
        await get()._validateAndSync({ location });
        set({ isSyncing: false });
      },
      
      // Enhanced methods for comprehensive settings
      updateNotificationPreferences: async (updates) => {
        set({ isSyncing: true });
        const currentNotifications = get().preferences.notifications;
        const newNotifications = { ...currentNotifications, ...updates };
        await get()._validateAndSync({ 
          notifications: newNotifications,
          notificationsEnabled: newNotifications.enabled,
          notificationOffset: newNotifications.offsetMinutes
        });
        set({ isSyncing: false });
      },
      
      updateDisplayPreferences: async (updates) => {
        set({ isSyncing: true });
        const currentDisplay = get().preferences.display;
        await get()._validateAndSync({ 
          display: { ...currentDisplay, ...updates }
        });
        set({ isSyncing: false });
      },
      
      updateCalculationPreferences: async (updates) => {
        set({ isSyncing: true });
        const currentCalculation = get().preferences.calculation;
        const newCalculation = { ...currentCalculation, ...updates };
        await get()._validateAndSync({ 
          calculation: newCalculation,
          calculationMethod: newCalculation.calculationMethod,
          madhab: newCalculation.madhab
        });
        set({ isSyncing: false });
      },
      
      updateQiblaPreferences: async (updates) => {
        set({ isSyncing: true });
        const currentQibla = get().preferences.qibla;
        await get()._validateAndSync({ 
          qibla: { ...currentQibla, ...updates }
        });
        set({ isSyncing: false });
      },
      
      updatePrivacyPreferences: async (updates) => {
        set({ isSyncing: true });
        const currentPrivacy = get().preferences.privacy;
        await get()._validateAndSync({ 
          privacy: { ...currentPrivacy, ...updates }
        });
        set({ isSyncing: false });
      },
      
      updateAccessibilityPreferences: async (updates) => {
        set({ isSyncing: true });
        const currentAccessibility = get().preferences.accessibility;
        await get()._validateAndSync({ 
          accessibility: { ...currentAccessibility, ...updates }
        });
        set({ isSyncing: false });
      },
      
      // Initialization from storage
      initializeFromStorage: async () => {
        set({ isLoading: true, initializationError: null });
        
        try {
          const preferences = await SettingsService.getPreferences();
          set({
            preferences,
            isInitialized: true,
            isLoading: false,
            lastSyncTime: new Date(),
            initializationError: null
          });
          
          // Notify listeners
          get()._notifyListeners(preferences);
        } catch (error) {
          console.error('Error initializing settings from storage:', error);
          set({
            isLoading: false,
            initializationError: error as Error,
            // Keep default preferences if initialization fails
            preferences: getDefaultPreferences()
          });
        }
      },
      
      // Manual synchronization with storage
      syncWithStorage: async () => {
        set({ isSyncing: true, syncError: null });
        
        try {
          const currentPreferences = get().preferences;
          await SettingsService.savePreferences(currentPreferences);
          set({
            isSyncing: false,
            lastSyncTime: new Date(),
            syncError: null
          });
        } catch (error) {
          console.error('Error syncing with storage:', error);
          set({
            isSyncing: false,
            syncError: error as Error
          });
        }
      },
      
      // Validation and update with comprehensive error handling
      validateAndUpdate: async (updates) => {
        set({ isSyncing: true });
        const success = await get()._validateAndSync(updates);
        set({ isSyncing: false });
        return success;
      },
      
      // Error handling and recovery
      clearErrors: () => {
        set({
          initializationError: null,
          syncError: null
        });
      },
      
      resetToDefaults: async () => {
        set({ isSyncing: true });
        try {
          const defaultPrefs = getDefaultPreferences();
          await SettingsService.savePreferences(defaultPrefs);
          set({
            preferences: defaultPrefs,
            isSyncing: false,
            lastSyncTime: new Date(),
            syncError: null
          });
          
          // Notify listeners
          get()._notifyListeners(defaultPrefs);
        } catch (error) {
          console.error('Error resetting to defaults:', error);
          set({
            isSyncing: false,
            syncError: error as Error
          });
        }
      },
      
      // Event system for UnifiedSettingsManager integration
      onSettingsChange: (callback) => {
        const { _eventListeners } = get();
        _eventListeners.add(callback);
        
        // Return unsubscribe function
        return () => {
          _eventListeners.delete(callback);
        };
      }
    }),
    {
      name: 'enhanced-user-preferences-storage',
      // Only persist essential state, not loading/error states
      partialize: (state) => ({
        preferences: state.preferences,
        lastSyncTime: state.lastSyncTime,
        isInitialized: state.isInitialized
      })
    }
  )
);