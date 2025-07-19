import { useState, useEffect, useCallback } from 'react';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';
import { ComprehensiveUserPreferences } from '../services/SettingsService';

export interface UseSettingsInitialization {
  isLoading: boolean;
  isError: boolean;
  settings: ComprehensiveUserPreferences | null;
  error: Error | null;
  retry: () => void;
}

/**
 * Hook for initializing user settings on app startup
 * Handles loading states, error handling, and retry functionality
 */
export function useSettingsInitialization(): UseSettingsInitialization {
  const {
    preferences,
    isInitialized,
    isLoading: storeLoading,
    initializationError,
    initializeFromStorage,
    clearErrors
  } = useUserPreferencesStore();

  const [localError, setLocalError] = useState<Error | null>(null);
  const [hasAttemptedInit, setHasAttemptedInit] = useState(false);

  // Initialize settings on mount
  useEffect(() => {
    if (!isInitialized && !hasAttemptedInit && !storeLoading) {
      setHasAttemptedInit(true);
      initializeFromStorage().catch((error) => {
        console.error('Settings initialization failed:', error);
        setLocalError(error);
      });
    }
  }, [isInitialized, hasAttemptedInit, storeLoading, initializeFromStorage]);

  // Retry function
  const retry = useCallback(() => {
    setLocalError(null);
    clearErrors();
    setHasAttemptedInit(false);
  }, [clearErrors]);

  // Determine final error state
  const finalError = localError || initializationError;
  const isError = Boolean(finalError);
  const isLoading = storeLoading || (!isInitialized && !isError && hasAttemptedInit);

  return {
    isLoading,
    isError,
    settings: isInitialized ? preferences : null,
    error: finalError,
    retry
  };
}