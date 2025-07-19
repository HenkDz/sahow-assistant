import { useEffect, useCallback } from 'react';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';
import { initializeWithSettingsLanguage } from '../i18n/index';
import { Language } from '../types';

/**
 * Hook that integrates i18n system with settings store
 * Ensures language preferences are synchronized between both systems
 */
export function useI18nSettingsIntegration() {
  const {
    preferences,
    isInitialized,
    setLanguage,
    onSettingsChange
  } = useUserPreferencesStore();

  // Initialize i18n with settings language when settings are loaded
  useEffect(() => {
    if (isInitialized && preferences.language) {
      initializeWithSettingsLanguage(preferences.language).catch((error) => {
        console.error('Failed to initialize i18n with settings language:', error);
      });
    }
  }, [isInitialized, preferences.language]);

  // Listen for settings changes and update i18n accordingly
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = onSettingsChange((settings) => {
      if (settings.language) {
        initializeWithSettingsLanguage(settings.language).catch((error) => {
          console.error('Failed to update i18n language from settings change:', error);
        });
      }
    });

    return unsubscribe;
  }, [isInitialized, onSettingsChange]);

  // Function to change language through settings (which will trigger i18n update)
  const changeLanguageViaSettings = useCallback(async (language: Language) => {
    try {
      await setLanguage(language);
    } catch (error) {
      console.error('Failed to change language via settings:', error);
      throw error;
    }
  }, [setLanguage]);

  return {
    currentLanguage: preferences.language,
    changeLanguage: changeLanguageViaSettings,
    isInitialized
  };
}