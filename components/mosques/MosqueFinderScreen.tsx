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
import { MapPinIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '../icons/HeroIcons';

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

  useEffect(() => {
    if (preferences.location) {
      searchNearbyMosques();
    }
  }, [preferences.location, searchRadius]);

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

  const searchNearbyMosques = async () => {
    if (!preferences.location) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await mosqueService.searchNearbyMosques({
        location: preferences.location,
        radius: searchRadius,
        limit: 20
      });

      if (result.success && result.mosques) {
        setMosques(result.mosques);
      } else {
        setError(result.error?.message || t('mosqueSearchError'));
      }
    } catch (err) {
      setError(t('mosqueSearchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSearch = async () => {
    if (!searchQuery.trim()) {
      searchNearbyMosques();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await mosqueService.searchMosquesByText(
        searchQuery,
        preferences.location
      );

      if (result.success && result.mosques) {
        setMosques(result.mosques);
      } else {
        setError(result.error?.message || t('mosqueSearchError'));
      }
    } catch (err) {
      setError(t('mosqueSearchError'));
    } finally {
      setIsLoading(false);
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
            onClick={searchNearbyMosques}
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
        {mosques.map((mosque) => (
          <div key={mosque.id} className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">{mosque.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{mosque.address}</p>
                {mosque.distance && (
                  <p className="text-xs text-blue-600 font-medium">{formatDistance(mosque.distance)}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <MapPinIcon className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>
          /*<MosqueCard
            key={mosque.id}
            mosque={mosque}
            onSelect={() => handleMosqueSelect(mosque)}
            onGetDirections={() => handleGetDirections(mosque)}
            formatDistance={formatDistance}
          />*/
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
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('searchRadius')}: {searchRadius}km
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1km</span>
              <span>50km</span>
            </div>
          </div>
          
          <button
            onClick={() => {
              setShowFilters(false);
              searchNearbyMosques();
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            {t('applyFilters')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <OfflineErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Header title={t('title')} onBack={onBack} isRTL={isRTL} />
        
        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
          {/* Offline Indicator */}
          <OfflineIndicator onRetry={searchNearbyMosques} />

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
                onClick={handleTextSearch}
                className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {t('search')}
              </button>
            )}
            
            {/* Search Radius & Filters Toggle */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t('radius')}:</span>
                <select
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value={5}>5km</option>
                  <option value={10}>10km</option>
                  <option value={20}>20km</option>
                  <option value={50}>50km</option>
                </select>
              </div>
              
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