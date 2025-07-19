import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { Language, Madhab, CalculationMethod } from '../../types';

// Create manual mocks for SettingsService
const mockGetPreferences = vi.fn();
const mockSavePreferences = vi.fn();
const mockValidatePreferences = vi.fn();

// Mock the SettingsService module
vi.doMock('../../services/SettingsService', () => ({
  SettingsService: {
    getPreferences: mockGetPreferences,
    savePreferences: mockSavePreferences,
    validatePreferences: mockValidatePreferences
  }
}));

describe('Enhanced User Preferences Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUserPreferencesStore.setState({
      preferences: useUserPreferencesStore.getState().preferences,
      isInitialized: false,
      isLoading: false,
      initializationError: null,
      lastSyncTime: null,
      isSyncing: false,
      syncError: null,
      _eventListeners: new Set()
    });
    
    // Reset mocks
    vi.clearAllMocks();
    mockValidatePreferences.mockReturnValue({ isValid: true, errors: [] });
  });

  describe('Initialization', () => {
    it('should initialize with default preferences', () => {
      const store = useUserPreferencesStore.getState();
      
      expect(store.preferences.language).toBe('ar');
      expect(store.preferences.madhab).toBe(Madhab.HANAFI);
      expect(store.preferences.calculationMethod).toBe(CalculationMethod.ISNA);
      expect(store.isInitialized).toBe(false);
      expect(store.isLoading).toBe(false);
    });

    it('should initialize from storage successfully', async () => {
      const mockPreferences = {
        ...useUserPreferencesStore.getState().preferences,
        language: 'en' as Language
      };
      
      mockGetPreferences.mockResolvedValue(mockPreferences);
      
      const store = useUserPreferencesStore.getState();
      await store.initializeFromStorage();
      
      const updatedStore = useUserPreferencesStore.getState();
      expect(updatedStore.isInitialized).toBe(true);
      expect(updatedStore.isLoading).toBe(false);
      expect(updatedStore.preferences.language).toBe('en');
      expect(updatedStore.initializationError).toBeNull();
    });

    it('should handle initialization errors gracefully', async () => {
      const error = new Error('Storage error');
      mockGetPreferences.mockRejectedValue(error);
      
      const store = useUserPreferencesStore.getState();
      await store.initializeFromStorage();
      
      const updatedStore = useUserPreferencesStore.getState();
      expect(updatedStore.isLoading).toBe(false);
      expect(updatedStore.initializationError).toBe(error);
      expect(updatedStore.isInitialized).toBe(false);
    });
  });

  describe('Settings Updates', () => {
    it('should update language and sync with storage', async () => {
      mockSavePreferences.mockResolvedValue();
      
      const store = useUserPreferencesStore.getState();
      await store.setLanguage('en');
      
      const updatedStore = useUserPreferencesStore.getState();
      expect(updatedStore.preferences.language).toBe('en');
      expect(mockSavePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'en' })
      );
      expect(updatedStore.lastSyncTime).toBeTruthy();
    });

    it('should update notification preferences', async () => {
      mockSavePreferences.mockResolvedValue();
      
      const store = useUserPreferencesStore.getState();
      await store.updateNotificationPreferences({
        enabled: false,
        offsetMinutes: 15
      });
      
      const updatedStore = useUserPreferencesStore.getState();
      expect(updatedStore.preferences.notifications.enabled).toBe(false);
      expect(updatedStore.preferences.notifications.offsetMinutes).toBe(15);
      expect(updatedStore.preferences.notificationsEnabled).toBe(false);
      expect(updatedStore.preferences.notificationOffset).toBe(15);
    });

    it('should handle validation errors', async () => {
      mockValidatePreferences.mockReturnValue({
        isValid: false,
        errors: ['Invalid setting']
      });
      
      const store = useUserPreferencesStore.getState();
      const success = await store.validateAndUpdate({ language: 'en' });
      
      expect(success).toBe(false);
      const updatedStore = useUserPreferencesStore.getState();
      expect(updatedStore.syncError).toBeTruthy();
    });
  });

  describe('Event System', () => {
    it('should notify listeners on settings change', async () => {
      mockSavePreferences.mockResolvedValue();
      
      const listener = vi.fn();
      const store = useUserPreferencesStore.getState();
      const unsubscribe = store.onSettingsChange(listener);
      
      await store.setLanguage('en');
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'en' })
      );
      
      unsubscribe();
    });

    it('should handle listener errors gracefully', async () => {
      mockSavePreferences.mockResolvedValue();
      
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      
      const store = useUserPreferencesStore.getState();
      store.onSettingsChange(errorListener);
      
      // Should not throw despite listener error
      await expect(store.setLanguage('en')).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should clear errors', () => {
      useUserPreferencesStore.setState({
        initializationError: new Error('Init error'),
        syncError: new Error('Sync error')
      });
      
      const store = useUserPreferencesStore.getState();
      store.clearErrors();
      
      const updatedStore = useUserPreferencesStore.getState();
      expect(updatedStore.initializationError).toBeNull();
      expect(updatedStore.syncError).toBeNull();
    });

    it('should reset to defaults', async () => {
      mockSavePreferences.mockResolvedValue();
      
      // First change some settings
      const store = useUserPreferencesStore.getState();
      await store.setLanguage('en');
      
      // Then reset to defaults
      await store.resetToDefaults();
      
      const updatedStore = useUserPreferencesStore.getState();
      expect(updatedStore.preferences.language).toBe('ar'); // Default language
      expect(mockSavePreferences).toHaveBeenCalledWith(
        expect.objectContaining({ language: 'ar' })
      );
    });
  });

  describe('Synchronization', () => {
    it('should sync with storage manually', async () => {
      mockSavePreferences.mockResolvedValue();
      
      const store = useUserPreferencesStore.getState();
      await store.syncWithStorage();
      
      const updatedStore = useUserPreferencesStore.getState();
      expect(mockSavePreferences).toHaveBeenCalledWith(
        updatedStore.preferences
      );
      expect(updatedStore.lastSyncTime).toBeTruthy();
      expect(updatedStore.syncError).toBeNull();
    });

    it('should handle sync errors', async () => {
      const error = new Error('Sync failed');
      mockSavePreferences.mockRejectedValue(error);
      
      const store = useUserPreferencesStore.getState();
      await store.syncWithStorage();
      
      const updatedStore = useUserPreferencesStore.getState();
      expect(updatedStore.syncError).toBe(error);
      expect(updatedStore.isSyncing).toBe(false);
    });
  });
});