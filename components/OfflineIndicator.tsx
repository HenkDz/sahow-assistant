import { useState, useEffect } from 'react';
import { OfflineStorageService } from '../services/OfflineStorageService';
import { useSmartRefresh } from '../hooks/useSmartRefresh';

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
  const {
    shouldShowPrompt,
    cacheFreshness,
    isOnline,
    dismissPrompt,
    checkRefreshStatus
  } = useSmartRefresh();

  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [cacheStats, setCacheStats] = useState<{
    totalSize: number;
    lastSync: Date | null;
  } | null>(null);

  useEffect(() => {
    const loadCacheInfo = async () => {
      const [sync, stats] = await Promise.all([
        OfflineStorageService.getLastSync(),
        OfflineStorageService.getCacheStats()
      ]);

      setLastSync(sync);
      setCacheStats(stats);
    };

    const handleOnlineChange = () => {
      OfflineStorageService.setNetworkStatus(navigator.onLine ? 'online' : 'offline');

      if (navigator.onLine && onRetry) {
        // Auto-retry when coming back online
        setTimeout(onRetry, 1000);
      }
    };

    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);
    loadCacheInfo();

    return () => {
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
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
      case 'outdated': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getCacheAgeLabel = (age: string) => {
    switch (age) {
      case 'fresh': return '🟢 Fresh';
      case 'stale': return '🟡 Stale';
      case 'outdated': return '🟠 Outdated';
      case 'critical': return '🔴 Critical';
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

  const handleRefresh = async () => {
    await dismissPrompt('session');
    if (onRetry) {
      onRetry();
    }
  };

  const handleDismiss = async (duration: 'temporary' | 'session' | 'extended' = 'session') => {
    await dismissPrompt(duration);
  };

  // Show refresh prompt based on intelligent criteria
  if (shouldShowPrompt && isOnline && cacheFreshness) {
    const isCritical = cacheFreshness.status === 'critical';
    const bgColor = isCritical ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200';
    const textColor = isCritical ? 'text-red-800' : 'text-blue-800';
    const buttonColor = isCritical ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';
    const accentColor = isCritical ? 'bg-red-500' : 'bg-blue-500';

    const getRefreshMessage = () => {
      if (isCritical) {
        return `Your data is ${Math.floor(cacheFreshness.hoursOld / 24)} days old. Please refresh for accurate information.`;
      }
      return `Your data is ${Math.floor(cacheFreshness.hoursOld)} hours old. Consider refreshing for latest information.`;
    };

    return (
      <div className={`${className}`}>
        <div className={`${bgColor} border rounded-lg p-3 mb-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 ${accentColor} rounded-full ${isCritical ? 'animate-pulse' : ''}`}></div>
              <span className={`text-sm font-medium ${textColor}`}>
                {isCritical ? 'Data critically outdated' : 'Data needs refresh'}
              </span>
            </div>
            <button
              onClick={() => handleDismiss('temporary')}
              className={`${isCritical ? 'text-red-600 hover:text-red-800' : 'text-blue-600 hover:text-blue-800'} text-sm`}
            >
              ✕
            </button>
          </div>
          <p className={`text-xs ${isCritical ? 'text-red-700' : 'text-blue-700'} mt-1 mb-2`}>
            {getRefreshMessage()}
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleRefresh}
              className={`px-3 py-1 ${buttonColor} text-white text-xs rounded-md transition-colors`}
            >
              Refresh Now
            </button>
            <button
              onClick={() => handleDismiss('session')}
              className={`px-3 py-1 ${isCritical ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'} text-xs rounded-md transition-colors`}
            >
              Remind later
            </button>
            {!isCritical && (
              <button
                onClick={() => handleDismiss('extended')}
                className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-gray-200 transition-colors"
              >
                Don't ask today
              </button>
            )}
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
  if (showDetails || (!isOnline && cacheFreshness?.status === 'critical')) {
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
              <span className={`font-medium ${getCacheAgeColor(cacheFreshness?.status || 'fresh')}`}>
                {getCacheAgeLabel(cacheFreshness?.status || 'fresh')}
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

          {cacheFreshness && (cacheFreshness.status === 'outdated' || cacheFreshness.status === 'critical') && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className={`text-xs mb-2 ${cacheFreshness.status === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>
                {cacheFreshness.status === 'critical' ? '🚨' : '⚠️'} Your cached data is {cacheFreshness.status}.
                {cacheFreshness.status === 'critical' ? ' Please refresh immediately.' : ' Consider refreshing for accuracy.'}
              </p>
            </div>
          )}

          {onRetry && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <button
                onClick={onRetry}
                disabled={!isOnline}
                className={`w-full px-3 py-2 text-xs rounded-md font-medium transition-colors ${isOnline
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
