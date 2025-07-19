import { useState, useEffect, useCallback } from 'react';
import { OfflineStorageService } from '../services/OfflineStorageService';

interface SmartRefreshState {
  shouldShowPrompt: boolean;
  cacheFreshness: {
    status: 'fresh' | 'stale' | 'outdated' | 'critical';
    lastSync: Date | null;
    hoursOld: number;
    shouldPromptRefresh: boolean;
    criticallyOutdated: boolean;
  } | null;
  isOnline: boolean;
  loading: boolean;
}

interface SmartRefreshActions {
  dismissPrompt: (duration?: 'temporary' | 'session' | 'extended') => Promise<void>;
  checkRefreshStatus: () => Promise<void>;
  updateRefreshPreferences: (preferences: {
    enableAutoPrompts: boolean;
    promptFrequency: 'conservative' | 'normal' | 'aggressive';
  }) => Promise<void>;
}

export function useSmartRefresh(): SmartRefreshState & SmartRefreshActions {
  const [state, setState] = useState<SmartRefreshState>({
    shouldShowPrompt: false,
    cacheFreshness: null,
    isOnline: navigator.onLine,
    loading: true
  });

  const checkRefreshStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const [freshness, shouldShow] = await Promise.all([
        OfflineStorageService.getCacheFreshness(),
        OfflineStorageService.shouldShowRefreshPrompt()
      ]);

      setState(prev => ({
        ...prev,
        cacheFreshness: freshness,
        shouldShowPrompt: shouldShow && prev.isOnline,
        loading: false
      }));
    } catch (error) {
      console.error('Error checking refresh status:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const dismissPrompt = useCallback(async (duration: 'temporary' | 'session' | 'extended' = 'session') => {
    try {
      await OfflineStorageService.recordPromptDismissal(duration);
      setState(prev => ({ ...prev, shouldShowPrompt: false }));
    } catch (error) {
      console.error('Error dismissing prompt:', error);
    }
  }, []);

  const updateRefreshPreferences = useCallback(async (preferences: {
    enableAutoPrompts: boolean;
    promptFrequency: 'conservative' | 'normal' | 'aggressive';
  }) => {
    try {
      await OfflineStorageService.setRefreshPreferences(preferences);
      // Re-check status after updating preferences
      await checkRefreshStatus();
    } catch (error) {
      console.error('Error updating refresh preferences:', error);
    }
  }, [checkRefreshStatus]);

  useEffect(() => {
    const handleOnlineStatusChange = () => {
      const online = navigator.onLine;
      setState(prev => ({ ...prev, isOnline: online }));
      
      if (online) {
        // Re-check refresh status when coming back online
        checkRefreshStatus();
      } else {
        // Hide prompt when going offline
        setState(prev => ({ ...prev, shouldShowPrompt: false }));
      }
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Initial check
    checkRefreshStatus();

    // Set up periodic checks (every 30 minutes)
    const interval = setInterval(checkRefreshStatus, 30 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      clearInterval(interval);
    };
  }, [checkRefreshStatus]);

  return {
    ...state,
    dismissPrompt,
    checkRefreshStatus,
    updateRefreshPreferences
  };
}

export default useSmartRefresh;