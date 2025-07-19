import { useState, useEffect, useCallback } from 'react';
import { OfflineStorageService } from '../services/OfflineStorageService';

export interface OfflineFirstOptions {
  feature: string;
  fallbackMessage?: string;
  gracefulDegradation?: boolean;
  maxCacheAge?: number; // in hours
}

export interface OfflineFirstState {
  isOnline: boolean;
  hasCache: boolean;
  cacheAge: 'fresh' | 'stale' | 'expired';
  shouldFallback: boolean;
  showDegradedMessage: boolean;
  error: string | null;
}

export function useOfflineFirst(options: OfflineFirstOptions) {
  const [state, setState] = useState<OfflineFirstState>({
    isOnline: navigator.onLine,
    hasCache: false,
    cacheAge: 'fresh',
    shouldFallback: false,
    showDegradedMessage: false,
    error: null
  });

  const {
    feature,
    fallbackMessage = 'This feature requires an internet connection.',
    gracefulDegradation = true,
    maxCacheAge = 6
  } = options;

  const checkCacheStatus = useCallback(async () => {
    try {
      const lastSync = await OfflineStorageService.getLastSync();
      const hasCache = lastSync !== null;
      
      let cacheAge: 'fresh' | 'stale' | 'expired' = 'fresh';
      
      if (hasCache && lastSync) {
        const now = new Date();
        const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
        
        if (diffHours < 1) {
          cacheAge = 'fresh';
        } else if (diffHours < maxCacheAge) {
          cacheAge = 'stale';
        } else {
          cacheAge = 'expired';
        }
      } else {
        cacheAge = 'expired';
      }

      const isOnline = navigator.onLine;
      const shouldFallback = !isOnline && (!hasCache || cacheAge === 'expired');
      const showDegradedMessage = (!isOnline && gracefulDegradation) || 
                                  (isOnline && cacheAge === 'expired');

      setState({
        isOnline,
        hasCache,
        cacheAge,
        shouldFallback,
        showDegradedMessage,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [feature, maxCacheAge, gracefulDegradation]);

  useEffect(() => {
    const handleOnline = () => {
      checkCacheStatus();
    };

    const handleOffline = () => {
      checkCacheStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    checkCacheStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkCacheStatus]);

  const executeWithFallback = useCallback(async <T>(
    onlineAction: () => Promise<T>,
    offlineAction?: () => Promise<T>
  ): Promise<T> => {
    try {
      if (state.isOnline) {
        return await onlineAction();
      } else if (offlineAction && state.hasCache) {
        return await offlineAction();
      } else {
        throw new Error(fallbackMessage);
      }
    } catch (error) {
      if (offlineAction && state.hasCache) {
        try {
          return await offlineAction();
        } catch (fallbackError) {
          throw error; // Throw original error
        }
      }
      throw error;
    }
  }, [state.isOnline, state.hasCache, fallbackMessage]);

  const getCacheStatusMessage = useCallback(() => {
    if (!state.isOnline && !state.hasCache) {
      return 'No internet connection and no cached data available.';
    }
    
    if (!state.isOnline && state.hasCache) {
      switch (state.cacheAge) {
        case 'fresh':
          return 'Using fresh cached data while offline.';
        case 'stale':
          return 'Using cached data while offline. Data may be outdated.';
        case 'expired':
          return 'Using expired cached data while offline. Please connect to internet for updates.';
      }
    }
    
    if (state.isOnline && state.cacheAge === 'expired') {
      return 'Your cached data is outdated. Refreshing...';
    }
    
    return null;
  }, [state]);

  const getFeatureAvailability = useCallback(() => {
    if (state.shouldFallback) {
      return {
        available: false,
        reason: 'offline-no-cache',
        message: fallbackMessage
      };
    }
    
    if (!state.isOnline && state.hasCache) {
      return {
        available: true,
        reason: 'offline-cached',
        message: getCacheStatusMessage()
      };
    }
    
    return {
      available: true,
      reason: 'online',
      message: null
    };
  }, [state.shouldFallback, state.isOnline, state.hasCache, fallbackMessage, getCacheStatusMessage]);

  return {
    state,
    executeWithFallback,
    getCacheStatusMessage,
    getFeatureAvailability,
    refresh: checkCacheStatus
  };
}

// Hook for specific features
export function useOfflinePrayerTimes() {
  return useOfflineFirst({
    feature: 'prayer-times',
    fallbackMessage: 'Prayer times require location access and internet connection for accurate calculations.',
    gracefulDegradation: true,
    maxCacheAge: 24 // Prayer times can be cached for 24 hours
  });
}

export function useOfflineQibla() {
  return useOfflineFirst({
    feature: 'qibla',
    fallbackMessage: 'Qibla direction requires location access. Compass works offline with cached data.',
    gracefulDegradation: true,
    maxCacheAge: 168 // Qibla direction can be cached for 1 week
  });
}

export function useOfflineCalendar() {
  return useOfflineFirst({
    feature: 'calendar',
    fallbackMessage: 'Islamic calendar data is calculated locally but some events may require internet.',
    gracefulDegradation: true,
    maxCacheAge: 720 // Calendar data can be cached for 30 days
  });
}
