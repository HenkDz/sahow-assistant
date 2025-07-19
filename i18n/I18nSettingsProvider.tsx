import React, { useEffect } from 'react';
import { I18nProvider } from './I18nProvider';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';
import { initializeWithSettingsLanguage, setSettingsStoreReference } from './index';

interface I18nSettingsProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that integrates I18n with the settings store
 * Ensures language preferences are synchronized between i18n and settings
 */
export const I18nSettingsProvider: React.FC<I18nSettingsProviderProps> = ({ children }) => {
  const {
    preferences,
    isInitialized,
    onSettingsChange
  } = useUserPreferencesStore();

  // Set up settings store reference for i18n integration
  useEffect(() => {
    setSettingsStoreReference(useUserPreferencesStore);
  }, []);

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

  return (
    <I18nProvider>
      {children}
    </I18nProvider>
  );
};

export default I18nSettingsProvider;