import React, { useState, useEffect } from 'react';
import { Location } from '../../types';
import { locationService } from '../../services/LocationService';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { useTranslation } from '../../i18n/I18nProvider';
import ManualLocationInput from '../location/ManualLocationInput';
import LocationPermissionModal from '../location/LocationPermissionModal';
import { MapPinIcon, ArrowPathIcon, ExclamationTriangleIcon } from '../icons/HeroIcons';

interface LocationSelectorProps {
  /**
   * Callback fired when location is successfully updated
   */
  onLocationUpdate?: (location: Location) => void;
  /**
   * Callback fired when location fetch starts
   */
  onLocationLoading?: (isLoading: boolean) => void;
  /**
   * Callback fired when location fetch encounters an error
   */
  onLocationError?: (error: string | null) => void;
  /**
   * Whether to automatically fetch location on mount if no location is set
   */
  autoFetchOnMount?: boolean;
  /**
   * Whether to show the change location button
   */
  showChangeButton?: boolean;
  /**
   * Whether to show the get current location button
   */
  showGetCurrentButton?: boolean;
  /**
   * Custom CSS classes for the container
   */
  className?: string;
  /**
   * Whether to show location as a compact indicator or full card
   */
  variant?: 'card' | 'compact' | 'minimal';
  /**
   * Whether to show success message when location is updated
   */
  showSuccessMessage?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onLocationUpdate,
  onLocationLoading,
  onLocationError,
  autoFetchOnMount = false,
  showChangeButton = true,
  showGetCurrentButton = true,
  className = '',
  variant = 'card',
  showSuccessMessage = true
}) => {
  const { t } = useTranslation('location');
  const { t: tCommon } = useTranslation('common');
  const { preferences, setLocation } = useUserPreferencesStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualLocationInput, setShowManualLocationInput] = useState(false);
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const [locationError, setLocationError] = useState<any>(null);
  const [showSuccessIndicator, setShowSuccessIndicator] = useState(false);

  useEffect(() => {
    if (autoFetchOnMount && !preferences.location) {
      handleGetCurrentLocation();
    }
  }, [autoFetchOnMount]);

  useEffect(() => {
    onLocationLoading?.(isLoading);
  }, [isLoading, onLocationLoading]);

  useEffect(() => {
    onLocationError?.(error);
  }, [error, onLocationError]);

  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);
    setLocationError(null);
    setShowSuccessIndicator(false);

    try {
      const locationResult = await locationService.getCurrentLocation();
      
      if (locationResult.success && locationResult.location) {
        await setLocation(locationResult.location);
        locationService.setManualLocation(locationResult.location);
        
        if (showSuccessMessage) {
          setShowSuccessIndicator(true);
          setTimeout(() => setShowSuccessIndicator(false), 3000);
        }
        
        onLocationUpdate?.(locationResult.location);
        setError(null);
      } else {
        setLocationError(locationResult.error);
        
        if (locationResult.error?.code === 1) { // Permission denied
          setError(t('errors.permission_denied'));
          setShowLocationPermissionModal(true);
        } else if (locationResult.error?.code === 2) { // Position unavailable
          setError(t('errors.unavailable'));
        } else if (locationResult.error?.code === 3) { // Timeout
          setError(t('errors.timeout'));
        } else {
          setError(t('errors.generic'));
        }
      }
    } catch (err) {
      setError(t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLocationSet = async (location: Location) => {
    await setLocation(location);
    locationService.setManualLocation(location);
    setShowManualLocationInput(false);
    onLocationUpdate?.(location);
  };

  const handleLocationPermissionRetry = () => {
    setShowLocationPermissionModal(false);
    handleGetCurrentLocation();
  };

  const handleLocationPermissionDenied = () => {
    setShowLocationPermissionModal(false);
    setShowManualLocationInput(true);
  };

  const renderLocationStatus = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-blue-700">
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
          <span className="text-sm">{t('status.loading')}</span>
        </div>
      );
    }

    if (showSuccessIndicator) {
      return (
        <div className="flex items-center gap-2 text-green-700">
          <MapPinIcon className="w-4 h-4" />
          <span className="text-sm">{t('status.updated')}</span>
        </div>
      );
    }

    if (preferences.location) {
      return (
        <div className="flex items-center gap-2 text-blue-700">
          <MapPinIcon className="w-4 h-4" />
          <span className="text-sm">
            {preferences.location.city}, {preferences.location.country}
          </span>
        </div>
      );
    }

          return (
        <div className="flex items-center gap-2 text-gray-600">
          <MapPinIcon className="w-4 h-4" />
          <span className="text-sm">{t('status.not_set')}</span>
        </div>
      );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
        <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  };

  const renderActionButtons = () => {
    const buttons = [];

    if (showChangeButton) {
      buttons.push(
        <button
          key="change"
          onClick={() => setShowManualLocationInput(true)}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors duration-200"
        >
          <MapPinIcon className="w-3 h-3" />
          {tCommon('buttons.change')}
        </button>
      );
    }

    if (showGetCurrentButton) {
      buttons.push(
        <button
          key="current"
          onClick={handleGetCurrentLocation}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowPathIcon className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          {t('buttons.get_current')}
        </button>
      );
    }

    return buttons;
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        {renderLocationStatus()}
        <div className="flex items-center gap-2">
          {renderActionButtons()}
        </div>
        {renderError()}
        {/* Modals remain the same */}
        <ManualLocationInput
          isOpen={showManualLocationInput}
          onClose={() => setShowManualLocationInput(false)}
          onLocationSet={handleManualLocationSet}
          initialLocation={preferences.location}
        />
        <LocationPermissionModal
          isOpen={showLocationPermissionModal}
          onClose={handleLocationPermissionDenied}
          onRetry={handleLocationPermissionRetry}
          onManualInput={handleLocationPermissionDenied}
          error={locationError}
        />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-lg p-3 shadow-sm border border-blue-100 ${className}`}>
        <div className="flex items-center justify-between">
          {renderLocationStatus()}
          <div className="flex items-center gap-2">
            {renderActionButtons()}
          </div>
        </div>
        {renderError()}
        
        {/* Modals */}
        <ManualLocationInput
          isOpen={showManualLocationInput}
          onClose={() => setShowManualLocationInput(false)}
          onLocationSet={handleManualLocationSet}
          initialLocation={preferences.location}
        />
        <LocationPermissionModal
          isOpen={showLocationPermissionModal}
          onClose={handleLocationPermissionDenied}
          onRetry={handleLocationPermissionRetry}
          onManualInput={handleLocationPermissionDenied}
          error={locationError}
        />
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-xl p-4 shadow-sm border border-blue-100 ${className}`}>
        <div className="text-center mb-3">
          {renderLocationStatus()}
        </div>
        <div className="flex items-center justify-center gap-3">
          {renderActionButtons()}
        </div>
        {renderError()}
        
        {/* Modals */}
        <ManualLocationInput
          isOpen={showManualLocationInput}
          onClose={() => setShowManualLocationInput(false)}
          onLocationSet={handleManualLocationSet}
          initialLocation={preferences.location}
        />
        <LocationPermissionModal
          isOpen={showLocationPermissionModal}
          onClose={handleLocationPermissionDenied}
          onRetry={handleLocationPermissionRetry}
          onManualInput={handleLocationPermissionDenied}
          error={locationError}
        />
      </div>
    );
  }

  // Default 'card' variant
  if (!preferences.location) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-blue-100 text-center ${className}`}>
        <MapPinIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">{t('status.not_set')}</p>
        <div className="flex items-center justify-center gap-3">
          {showGetCurrentButton && (
            <button
              onClick={handleGetCurrentLocation}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t('buttons.get_current')}
            </button>
          )}
          {showChangeButton && (
            <button
              onClick={() => setShowManualLocationInput(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              <MapPinIcon className="w-4 h-4" />
                            {t('buttons.set_location')}
            </button>
          )}
        </div>
        {renderError()}
        
        {/* Modals */}
        <ManualLocationInput
          isOpen={showManualLocationInput}
          onClose={() => setShowManualLocationInput(false)}
          onLocationSet={handleManualLocationSet}
          initialLocation={preferences.location}
        />
        <LocationPermissionModal
          isOpen={showLocationPermissionModal}
          onClose={handleLocationPermissionDenied}
          onRetry={handleLocationPermissionRetry}
          onManualInput={handleLocationPermissionDenied}
          error={locationError}
        />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-blue-100 ${className}`}>
      <div className="flex items-center justify-center gap-2 text-blue-700 mb-3">
        {renderLocationStatus()}
      </div>
      <div className="flex items-center justify-center gap-3">
        {renderActionButtons()}
      </div>
      {renderError()}
      
      {/* Modals */}
      <ManualLocationInput
        isOpen={showManualLocationInput}
        onClose={() => setShowManualLocationInput(false)}
        onLocationSet={handleManualLocationSet}
        initialLocation={preferences.location}
      />
      <LocationPermissionModal
        isOpen={showLocationPermissionModal}
        onClose={handleLocationPermissionDenied}
        onRetry={handleLocationPermissionRetry}
        onManualInput={handleLocationPermissionDenied}
        error={locationError}
      />
    </div>
  );
};

export default LocationSelector; 