import React, { useEffect, useState } from 'react';
import { Mosque, Location } from '../../types';
import { mosqueService } from '../../services/MosqueService';
import { locationService } from '../../services/LocationService';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { useTranslation } from '../../i18n/I18nProvider';
import ManualLocationInput from '../location/ManualLocationInput';
import LocationPermissionModal from '../location/LocationPermissionModal';
import OfflineIndicator from '../shared/OfflineIndicator';
import OfflineErrorBoundary from '../shared/OfflineErrorBoundary';
import { Header } from '../shared/Header';
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
  const [showManualLocationInput, setShowManualLocationInput] = useState(false);
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const [locationError, setLocationError] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

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

  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);
    setLocationError(null);
    setLocationSuccess(false);

    try {
      const locationResult = await locationService.getCurrentLocation();
      
      if (locationResult.success && locationResult.location) {
        setLocation(locationResult.location);
        // Show success message briefly
        setLocationSuccess(true);
        setTimeout(() => setLocationSuccess(false), 3000); // Hide after 3 seconds
        setError(null);
      } else {
        setLocationError(locationResult.error);
        
        // Handle different error types with specific messages
        if (locationResult.error?.code === 1) { // Permission denied
          setError(t('locationPermissionDenied'));
          setShowLocationPermissionModal(true);
        } else if (locationResult.error?.code === 2) { // Position unavailable
          setError(t('locationUnavailable'));
        } else if (locationResult.error?.code === 3) { // Timeout
          setError(t('locationTimeout'));
        } else {
          setError(t('locationError'));
        }
      }
    } catch (err) {
      setError(t('locationError'));
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

          {/* Location Info */}
          {preferences.location ? (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-3">
                <MapPinIcon className="w-4 h-4" />
                <span className="text-sm">
                  {preferences.location.city}, {preferences.location.country}
                </span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button 
                  onClick={() => setShowManualLocationInput(true)} 
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors duration-200"
                >
                  <MapPinIcon className="w-3 h-3" />
                  {t('common:buttons.change', 'Change')}
                </button>
                <button 
                  onClick={handleGetCurrentLocation}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  {t('getCurrentLocation')}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 text-center">
              <MapPinIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">{t('noLocationSet')}</p>
              <div className="flex items-center justify-center gap-3">
                <button 
                  onClick={handleGetCurrentLocation}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {t('getCurrentLocation')}
                </button>
                <button 
                  onClick={() => setShowManualLocationInput(true)} 
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  <MapPinIcon className="w-4 h-4" />
                  {t('setManually')}
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          {showFilters && renderSearchFilters()}

          {/* Location Update Status */}
          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-700">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span className="text-sm">{t('updatingLocation')}</span>
              </div>
            </div>
          )}

          {/* Location Success Message */}
          {locationSuccess && !isLoading && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{t('locationUpdated')}</span>
              </div>
            </div>
          )}

          {/* Location Error Display */}
          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-red-500 mt-0.5">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-red-800 mb-2">{error}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGetCurrentLocation}
                      className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      {t('retry')}
                    </button>
                    <button
                      onClick={() => {
                        setError(null);
                        setShowManualLocationInput(true);
                      }}
                      className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      {t('setManually')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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

        {/* Modals */}
        <ManualLocationInput
          isOpen={showManualLocationInput}
          onClose={() => setShowManualLocationInput(false)}
          onLocationSet={handleManualLocationSet}
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
        />
      </div>
    </OfflineErrorBoundary>
  );
};

export default MosqueFinderScreen;