import React, { useEffect, useState } from 'react';
import { Mosque, Location } from '../../types';
import { mosqueService } from '../../services/MosqueService';
import { locationService } from '../../services/LocationService';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { useTranslation } from '../../i18n/I18nProvider';
import OfflineIndicator from '../shared/OfflineIndicator';
import OfflineErrorBoundary from '../shared/OfflineErrorBoundary';
import LocationSelector from '../shared/LocationSelector';
import { Header } from '../shared/Header';
import RadiusSelector from './RadiusSelector';
import MosqueCard from './MosqueCard';
import { MapPinIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon, ArrowPathIcon } from '../icons/HeroIcons';

interface MosqueFinderScreenProps {
  onBack: () => void;
}

const MosqueFinderScreen: React.FC<MosqueFinderScreenProps> = ({ onBack }) => {
  const { t, isRTL } = useTranslation('mosques');
  const { preferences, setLocation } = useUserPreferencesStore();
  
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRadius, setSearchRadius] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [cacheAge, setCacheAge] = useState<Date | null>(null);

  useEffect(() => {
    if (preferences.location) {
      searchNearbyMosques();
    }
  }, [preferences.location]);

  // Don't auto-refresh when radius changes - user controls when to refresh
  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius);
  };

  const handleLocationUpdate = (location: Location) => {
    // Location updated successfully, trigger mosque search
    searchNearbyMosques();
  };

  const handleLocationLoading = (loading: boolean) => {
    setLocationLoading(loading);
  };

  const handleLocationError = (error: string | null) => {
    if (error) {
      setError(error);
    }
  };

  const searchNearbyMosques = async (forceRefresh = false) => {
    if (!preferences.location) return;

    setIsLoading(true);
    setError(null);

    try {
      let result;
      
      if (forceRefresh) {
        // Clear cache and get fresh results
        await mosqueService.clearMosqueCache();
        result = await mosqueService.searchNearbyMosques({
          location: preferences.location,
          radius: searchRadius,
          limit: 20
        });
        result = { ...result, isFromCache: false };
      } else {
        // Use cached results if available
        result = await mosqueService.searchNearbyMosquesWithCache({
          location: preferences.location,
          radius: searchRadius,
          limit: 20
        });
      }

      if (result.success && result.mosques) {
        setMosques(result.mosques);
        setIsFromCache(result.isFromCache);
        setCacheAge(result.isFromCache ? new Date() : null);
      } else {
        setError(result.error?.message || t('mosqueSearchError'));
      }
    } catch (err) {
      setError(t('mosqueSearchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSearch = async (forceRefresh = false) => {
    if (!searchQuery.trim()) {
      searchNearbyMosques(forceRefresh);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let result;
      
      if (forceRefresh) {
        await mosqueService.clearMosqueCache();
        result = await mosqueService.searchMosquesByText(
          searchQuery,
          preferences.location
        );
        result = { ...result, isFromCache: false };
      } else {
        result = await mosqueService.searchMosquesByTextWithCache(
          searchQuery,
          preferences.location
        );
      }

      if (result.success && result.mosques) {
        setMosques(result.mosques);
        setIsFromCache(result.isFromCache);
        setCacheAge(result.isFromCache ? new Date() : null);
      } else {
        setError(result.error?.message || t('mosqueSearchError'));
      }
    } catch (err) {
      setError(t('mosqueSearchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshResults = () => {
    if (searchQuery.trim()) {
      handleTextSearch(true);
    } else {
      searchNearbyMosques(true);
    }
  };

  const handleApplyRadiusFilter = () => {
    setShowFilters(false);
    if (searchQuery.trim()) {
      handleTextSearch();
    } else {
      searchNearbyMosques();
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    return mosqueService.formatDistance(distance);
  };

  const renderMosqueList = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-blue-100">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">{t('loading')}</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-blue-100 text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={handleRefreshResults}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            {t('retry')}
          </button>
        </div>
      );
    }

    if (mosques.length === 0) {
      return (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-blue-100 text-center">
          <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {t('noMosquesFound')}
          </p>
          <button
            onClick={() => setShowFilters(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            {t('adjustSearch')}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Cache status indicator */}
        {isFromCache && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-700">
                {t('showingCachedResults')}
              </span>
            </div>
            <button
              onClick={handleRefreshResults}
              className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded transition-colors"
            >
              <ArrowPathIcon className="h-3 w-3" />
              {t('refresh')}
            </button>
          </div>
        )}

        {mosques.map((mosque) => (
          <MosqueCard
            key={mosque.id}
            mosque={mosque}
            formatDistance={formatDistance}
          />
        ))}
      </div>
    );
  };

  const renderSearchFilters = () => {
    if (!showFilters) return null;

    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('searchFilters')}</h3>
          <button
            onClick={() => setShowFilters(false)}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        <RadiusSelector
          value={searchRadius}
          onChange={handleRadiusChange}
          onApply={handleApplyRadiusFilter}
          showApplyButton={true}
        />
      </div>
    );
  };

  return (
    <OfflineErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Header title={t('title')} onBack={onBack} isRTL={isRTL} />
        
        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Offline Indicator */}
          <OfflineIndicator onRetry={handleRefreshResults} />

          {/* Location Selector */}
          <LocationSelector
            onLocationUpdate={handleLocationUpdate}
            onLocationLoading={handleLocationLoading}
            onLocationError={handleLocationError}
            autoFetchOnMount={!preferences.location}
            variant="card"
            showSuccessMessage={true}
          />

          {/* Filters */}
          {showFilters && renderSearchFilters()}

          {/* Search Bar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
            <div className="relative">
              <MagnifyingGlassIcon className={`absolute top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                placeholder={t('searchMosques')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
                className={`w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => handleTextSearch()}
                className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {t('search')}
              </button>
            )}
            
            {/* Search Radius & Filters Toggle */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <RadiusSelector
                value={searchRadius}
                onChange={handleRadiusChange}
                compact={true}
              />
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                {t('filters')}
              </button>
            </div>
          </div>

          {/* Mosque List */}
          {renderMosqueList()}
        </div>
      </div>
    </OfflineErrorBoundary>
  );
};

export default MosqueFinderScreen;