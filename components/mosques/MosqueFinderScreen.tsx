import React, { useEffect, useState } from 'react';
import { Mosque, Location } from '../../types';
import { mosqueService } from '../../services/MosqueService';
import { locationService } from '../../services/LocationService';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useTranslation } from '../../i18n/I18nProvider';
import ManualLocationInput from '../location/ManualLocationInput';
import LocationPermissionModal from '../location/LocationPermissionModal';
import OfflineIndicator from '../shared/OfflineIndicator';
import OfflineErrorBoundary from '../shared/OfflineErrorBoundary';
import { ArrowLeftIcon, MapPinIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '../icons/HeroIcons';

interface MosqueFinderScreenProps {
  onBack: () => void;
}

const MosqueFinderScreen: React.FC<MosqueFinderScreenProps> = ({ onBack }) => {
  const { t, isRTL } = useTranslation('mosques');
  const { preferences, setLocation } = useUserPreferencesStore();
  const { isOnline } = useOfflineStatus();
  
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRadius, setSearchRadius] = useState(10);
  const [showManualLocationInput, setShowManualLocationInput] = useState(false);
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const [locationError, setLocationError] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!preferences.location) {
      handleLocationSetup();
    } else {
      searchNearbyMosques();
    }
  }, [preferences.location, searchRadius]);

  const handleLocationSetup = async () => {
    setIsLoading(true);
    setError(null);
    setLocationError(null);

    try {
      const locationResult = await locationService.getCurrentLocation();
      
      if (locationResult.success && locationResult.location) {
        setLocation(locationResult.location);
      } else {
        setLocationError(locationResult.error);
        if (locationResult.error?.code === 1) { // Permission denied
          setShowLocationPermissionModal(true);
        } else {
          setShowManualLocationInput(true);
        }
      }
    } catch (err) {
      setError(t('locationError'));
      setShowManualLocationInput(true);
    } finally {
      setIsLoading(false);
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

  const handleManualLocationSet = (location: Location) => {
    setLocation(location);
    locationService.setManualLocation(location);
    setShowManualLocationInput(false);
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    return mosqueService.formatDistance(distance);
  };

  const renderMosqueList = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">{t('loading')}</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={searchNearbyMosques}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('retry')}
          </button>
        </div>
      );
    }

    if (mosques.length === 0) {
      return (
        <div className="text-center py-8">
          <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            {t('noMosquesFound')}
          </p>
          <button
            onClick={() => setShowFilters(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('adjustSearch')}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {mosques.map((mosque) => (
          <div key={mosque.id} className="p-4 bg-white rounded-lg border">
            <h3 className="font-bold">{mosque.name}</h3>
            <p className="text-gray-600">{mosque.address}</p>
            {mosque.distance && <p className="text-sm">{formatDistance(mosque.distance)}</p>}
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
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('searchFilters')}</h3>
          <button
            onClick={() => setShowFilters(false)}
            className="text-gray-500 hover:text-gray-700"
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
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
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
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('applyFilters')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <OfflineErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-blue-100 sticky top-0 pt-12 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between max-w-md mx-auto">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                aria-label="Back"
              >
                <ArrowLeftIcon className={`w-6 h-6 text-blue-600 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
              
              <h1 className="text-xl font-bold text-blue-800">
                {t('title')}
              </h1>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                <AdjustmentsHorizontalIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {!isOnline && <OfflineIndicator />}
          
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchMosques')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {searchQuery && (
              <button
                onClick={handleTextSearch}
                className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('search')}
              </button>
            )}
          </div>

          {/* Location Info */}
          {preferences.location && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">
                  {preferences.location.city}, {preferences.location.country}
                </span>
                <button
                  onClick={() => setShowManualLocationInput(true)}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                >
                  {t('change')}
                </button>
              </div>
            </div>
          )}

          {/* Search Filters */}
          {renderSearchFilters()}

          {/* Mosque List */}
          {renderMosqueList()}
        </div>

        {/* Modals */}
        <ManualLocationInput
          isOpen={showManualLocationInput}
          onClose={() => setShowManualLocationInput(false)}
          onLocationSet={handleManualLocationSet}
          t={t}
          initialLocation={preferences.location}
        />

        <LocationPermissionModal
          isOpen={showLocationPermissionModal}
          onClose={() => setShowLocationPermissionModal(false)}
          onRetry={handleLocationSetup}
          onManualInput={() => {
            setShowLocationPermissionModal(false);
            setShowManualLocationInput(true);
          }}
          error={locationError}
          t={t}
        />
      </div>
    </OfflineErrorBoundary>
  );
};

export default MosqueFinderScreen;