import { useState, useEffect, useCallback } from 'react';
import { NetworkService, NetworkStatus } from '../services/NetworkService';
import { OfflineStorageService } from '../services/OfflineStorageService';

export interface OfflineState {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
  lastSync: Date | null;
  needsSync: boolean;
  isSyncing: boolean;
}

export function useOfflineStatus() {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    lastSync: null,
    needsSync: false,
    isSyncing: false
  });

  useEffect(() => {
    // Initialize network service
    NetworkService.initialize();

    // Load initial offline state
    const loadInitialState = async () => {
      const [lastSync, needsSync] = await Promise.all([
        OfflineStorageService.getLastSync(),
        OfflineStorageService.needsSync()
      ]);

      setState(prev => ({
        ...prev,
        lastSync,
        needsSync
      }));
    };

    loadInitialState();

    // Listen for network changes
    const unsubscribe = NetworkService.addListener((status: NetworkStatus) => {
      setState(prev => ({
        ...prev,
        isOnline: status.isOnline,
        isSlowConnection: status.isSlowConnection,
        connectionType: status.connectionType
      }));
    });

    return () => {
      unsubscribe();
      NetworkService.cleanup();
    };
  }, []);

  const sync = useCallback(async (): Promise<boolean> => {
    if (!state.isOnline || state.isSyncing) {
      return false;
    }

    setState(prev => ({ ...prev, isSyncing: true }));

    try {
      const success = await NetworkService.syncWhenOnline();
      
      if (success) {
        const [lastSync, needsSync] = await Promise.all([
          OfflineStorageService.getLastSync(),
          OfflineStorageService.needsSync()
        ]);

        setState(prev => ({
          ...prev,
          lastSync,
          needsSync,
          isSyncing: false
        }));
      } else {
        setState(prev => ({ ...prev, isSyncing: false }));
      }

      return success;
    } catch (error) {
      console.error('Sync failed:', error);
      setState(prev => ({ ...prev, isSyncing: false }));
      return false;
    }
  }, [state.isOnline, state.isSyncing]);

  const testConnectivity = useCallback(async (): Promise<boolean> => {
    return await NetworkService.testConnectivity();
  }, []);

  const clearCache = useCallback(async (): Promise<void> => {
    await OfflineStorageService.clearAllCache();
    
    const [lastSync, needsSync] = await Promise.all([
      OfflineStorageService.getLastSync(),
      OfflineStorageService.needsSync()
    ]);

    setState(prev => ({
      ...prev,
      lastSync,
      needsSync
    }));
  }, []);

  return {
    ...state,
    sync,
    testConnectivity,
    clearCache
  };
}

export interface CachedDataState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isFromCache: boolean;
  cacheAge: number | null;
}

export function useCachedData<T>(
  fetchFn: () => Promise<T>,
  cacheFn: (data: T) => Promise<void>,
  getCacheFn: () => Promise<T | null>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<CachedDataState<T>>({
    data: null,
    isLoading: true,
    error: null,
    isFromCache: false,
    cacheAge: null
  });

  const { isOnline } = useOfflineStatus();

  const loadData = useCallback(async (forceRefresh: boolean = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Try to load from cache first
      const cachedData = await getCacheFn();
      
      if (cachedData && !forceRefresh) {
        setState(prev => ({
          ...prev,
          data: cachedData,
          isFromCache: true,
          isLoading: false
        }));
        
        // If online, try to refresh in background
        if (isOnline) {
          try {
            const freshData = await fetchFn();
            await cacheFn(freshData);
            setState(prev => ({
              ...prev,
              data: freshData,
              isFromCache: false
            }));
          } catch (error) {
            // Silent fail for background refresh
            console.warn('Background refresh failed:', error);
          }
        }
      } else {
        // No cache or force refresh - fetch fresh data
        if (isOnline) {
          const freshData = await fetchFn();
          await cacheFn(freshData);
          setState(prev => ({
            ...prev,
            data: freshData,
            isFromCache: false,
            isLoading: false
          }));
        } else {
          // Offline and no cache
          setState(prev => ({
            ...prev,
            error: 'No internet connection and no cached data available',
            isLoading: false
          }));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Try to fall back to cache if available
      try {
        const cachedData = await getCacheFn();
        if (cachedData) {
          setState(prev => ({
            ...prev,
            data: cachedData,
            isFromCache: true,
            isLoading: false,
            error: `Using cached data: ${errorMessage}`
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: errorMessage,
            isLoading: false
          }));
        }
      } catch (cacheError) {
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false
        }));
      }
    }
  }, [fetchFn, cacheFn, getCacheFn, isOnline]);

  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData, ...dependencies]);

  return {
    ...state,
    refresh,
    isOnline
  };
}
