import { useState, useEffect } from 'react';
import { OfflineStorageService } from '../services/OfflineStorageService';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  onRetry?: () => void;
  feature?: 'prayer-times' | 'qibla' | 'calendar' | 'general';
}

export default function OfflineIndicator({ 
  className = '', 
  showDetails = false, 
  onRetry,
  feature = 'general'
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [cacheStats, setCacheStats] = useState<{
    totalSize: number;
    lastSync: Date | null;
  } | null>(null);
  const [cacheAge, setCacheAge] = useState<'fresh' | 'stale' | 'expired'>('fresh');
  const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      OfflineStorageService.setNetworkStatus(online ? 'online' : 'offline');
      
      if (online && onRetry) {
        // Auto-retry when coming back online
        setTimeout(onRetry, 1000);
      }
    };

    const loadCacheInfo = async () => {
      const [sync, stats] = await Promise.all([
        OfflineStorageService.getLastSync(),
        OfflineStorageService.getCacheStats()
      ]);
      
      setLastSync(sync);
      setCacheStats(stats);
      
      // Determine cache age
      if (sync) {
        const now = new Date();
        const diffHours = (now.getTime() - sync.getTime()) / (1000 * 60 * 60);
        
        if (diffHours < 1) {
          setCacheAge('fresh');
        } else if (diffHours < 6) {
          setCacheAge('stale');
        } else {
          setCacheAge('expired');
          setShowRefreshPrompt(true);
        }
      } else {
        setCacheAge('expired');
        setShowRefreshPrompt(true);
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    loadCacheInfo();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [onRetry]);

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatCacheSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getCacheAgeColor = (age: string) => {
    switch (age) {
      case 'fresh': return 'text-green-600';
      case 'stale': return 'text-yellow-600';
      case 'expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCacheAgeLabel = (age: string) => {
    switch (age) {
      case 'fresh': return '🟢 Fresh';
      case 'stale': return '🟡 Stale';
      case 'expired': return '🔴 Expired';
      default: return '⚪ Unknown';
    }
  };

  const getFeatureMessage = (feature: string, isOnline: boolean) => {
    if (isOnline) return null;
    
    switch (feature) {
      case 'prayer-times':
        return 'Prayer times are cached. For the most accurate times, connect to the internet.';
      case 'qibla':
        return 'Qibla direction is cached for your location. Compass functionality works offline.';
      case 'calendar':
        return 'Islamic calendar data is cached. Some events may not be up to date.';
      default:
        return 'Using cached data. Some features may be limited.';
    }
  };

  const handleRefresh = () => {
    setShowRefreshPrompt(false);
    if (onRetry) {
      onRetry();
    }
  };

  const dismissRefreshPrompt = () => {
    setShowRefreshPrompt(false);
  };

  // Show refresh prompt if data is expired and user is online
  if (showRefreshPrompt && isOnline && cacheAge === 'expired') {
    return (
      <div className={`${className}`}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">
                Data needs refresh
              </span>
            </div>
            <button
              onClick={dismissRefreshPrompt}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-blue-700 mt-1 mb-2">
            Your cached data is more than 6 hours old. Refresh for latest information.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Now
            </button>
            <button
              onClick={dismissRefreshPrompt}
              className="px-3 py-1 bg-blue-100 text-blue-600 text-xs rounded-md hover:bg-blue-200 transition-colors"
            >
              Continue with cached
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show offline indicator when offline
  if (!isOnline && !showDetails) {
    return (
      <div className={`${className}`}>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-amber-800">
              You're offline
            </span>
          </div>
          <p className="text-xs text-amber-700 mt-1">
            {getFeatureMessage(feature, false)}
          </p>
        </div>
      </div>
    );
  }

  // Show detailed status when requested
  if (showDetails || (!isOnline && cacheAge === 'expired')) {
    return (
      <div className={`${className}`}>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-800 mb-3">
            Offline Status
          </h4>
          
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Connection:</span>
              <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-amber-600'}`}>
                {isOnline ? '🟢 Online' : '🟡 Offline'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Last sync:</span>
              <span className="font-medium">
                {formatLastSync(lastSync)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Cache status:</span>
              <span className={`font-medium ${getCacheAgeColor(cacheAge)}`}>
                {getCacheAgeLabel(cacheAge)}
              </span>
            </div>
            
            {cacheStats && (
              <div className="flex justify-between">
                <span>Cache size:</span>
                <span className="font-medium">
                  {formatCacheSize(cacheStats.totalSize)}
                </span>
              </div>
            )}
          </div>

          {cacheAge === 'expired' && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-xs text-red-600 mb-2">
                ⚠️ Your cached data is outdated. Please refresh for accurate information.
              </p>
            </div>
          )}

          {onRetry && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <button
                onClick={onRetry}
                disabled={!isOnline}
                className={`w-full px-3 py-2 text-xs rounded-md font-medium transition-colors ${
                  isOnline
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isOnline ? 'Sync Now' : 'Waiting for connection...'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
