import React, { useEffect, useState, useRef } from 'react';
import { Location } from '../../types';
import { QiblaService, DeviceOrientationResult } from '../../services/QiblaService';
import { qiblaService } from '../../services/QiblaService';
import { locationService } from '../../services/LocationService';
import { useTranslation } from '../../i18n/I18nProvider';
import { MapPinIcon, ExclamationTriangleIcon, InformationCircleIcon } from '../icons/HeroIcons';
import { Header } from '../shared/Header';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import SimpleLocationInput from '../location/SimpleLocationInput';
import LocationPermissionModal from '../location/LocationPermissionModal';

interface QiblaCompassProps {
  onBack: () => void;
}

interface CompassState {
  qiblaDirection: number;
  deviceOrientation: number;
  distance: number;
  isCalibrated: boolean;
  isLoading: boolean;
  error: string | null;
  locationName: string;
}

const QiblaCompass: React.FC<QiblaCompassProps> = ({ onBack }) => {
  const { t, isRTL } = useTranslation('qibla');
  const { t: tCommon } = useTranslation('common');
  const { preferences, setLocation } = useUserPreferencesStore();
  const [compassState, setCompassState] = useState<CompassState>({
    qiblaDirection: 0,
    deviceOrientation: 0,
    distance: 0,
    isCalibrated: false,
    isLoading: true,
    error: null,
    locationName: ''
  });

  const [showManualLocationInput, setShowManualLocationInput] = useState(false);
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const [showCalibrationInstructions, setShowCalibrationInstructions] = useState(false);
  const [locationError, setLocationError] = useState<any>(null);
  const [isPointingToQibla, setIsPointingToQibla] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const compassRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeCompass();
    return () => {
      qiblaService.stopWatchingOrientation();
    };
  }, [preferences.location]);

  useEffect(() => {
    // Check if device is pointing towards Qibla
    const pointing = QiblaService.isPointingTowardsQibla(
      compassState.qiblaDirection,
      compassState.deviceOrientation,
      10 // 10 degree tolerance
    );
    setIsPointingToQibla(pointing);
  }, [compassState.qiblaDirection, compassState.deviceOrientation]);

  const initializeCompass = async () => {
    setCompassState(prev => ({ ...prev, isLoading: true, error: null }));
    setLocationError(null);

    try {
      let location = preferences.location;
      if (!location) {
        const locationResult = await locationService.getCurrentLocation();
        if (locationResult.success && locationResult.location) {
          setLocation(locationResult.location);
          location = locationResult.location;
        } else {
          setLocationError(locationResult.error);
          if (locationResult.error?.code === 1) { // Permission denied
            setShowLocationPermissionModal(true);
          } else {
            setShowManualLocationInput(true);
          }
          throw new Error(locationResult.error?.message || 'Unable to get location');
        }
      }

      // Calculate Qibla direction
      const qiblaResult = QiblaService.calculateQiblaDirection(location);
      if (!qiblaResult.success || !qiblaResult.result) {
        throw new Error(qiblaResult.error || 'Unable to calculate Qibla direction');
      }

      // Check if automatic mode is supported
      const isAutomaticSupported = await QiblaService.isAutomaticModeSupported();

      // Always set the basic compass state first
      setCompassState(prev => ({
        ...prev,
        qiblaDirection: qiblaResult.result!.direction,
        distance: qiblaResult.result!.distance,
        locationName: `${location!.city}, ${location!.country}`,
        isLoading: false,
        isCalibrated: true,
        error: null
      }));

      if (isAutomaticSupported) {
        // Try automatic mode first
        try {
          const orientationStarted = await qiblaService.watchDeviceOrientation(handleOrientationChange);

          if (orientationStarted) {
            setIsManualMode(false);
          } else {
            // Fall back to manual mode
            setIsManualMode(true);
          }
        } catch (error) {
          console.warn('Failed to start automatic orientation tracking, using manual mode:', error);
          setIsManualMode(true);
        }
      } else {
        // Use manual mode directly
        setIsManualMode(true);
      }

    } catch (error) {
      setCompassState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  };

  const handleOrientationChange = (result: DeviceOrientationResult) => {
    if (result.success && result.orientation !== undefined) {
      setCompassState(prev => ({
        ...prev,
        deviceOrientation: result.orientation!,
        isCalibrated: true,
        error: null
      }));
      setShowCalibrationInstructions(false);
    } else {
      // Don't set main error state - fall back to manual mode instead
      console.warn('Device orientation failed, falling back to manual mode:', result.error);
      setIsManualMode(true);
      setShowCalibrationInstructions(false);
    }
  };

  const handleManualLocationSet = (location: Location) => {
    setLocation(location);
    locationService.setManualLocation(location);
    setShowManualLocationInput(false);
  };

  const calculateNeedleRotation = (): number => {
    if (isManualMode) {
      // In manual mode, show static direction from North
      return compassState.qiblaDirection;
    } else {
      // In automatic mode, adjust for device orientation
      return QiblaService.calculateCompassBearing(
        compassState.qiblaDirection,
        compassState.deviceOrientation
      );
    }
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${Math.round(distance)}km`;
  };

  const retryInitialization = () => {
    initializeCompass();
  };

  if (compassState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">
            {t('loading')}
          </p>
          <p className="text-slate-500 text-sm mt-2">
            {t('location_required')}
          </p>
        </div>
      </div>
    );
  }

  if (compassState.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Header title={t('title')} onBack={onBack} isRTL={isRTL} />

        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-semibold mb-2">
                {tCommon('status.error_title')}
              </p>
              <p className="text-red-500 text-sm mb-4">{compassState.error}</p>

              {/* Calibration Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h3 className="text-blue-800 font-semibold mb-2">
                  {t('compass.calibration')}
                </h3>
                <ul className="text-blue-700 text-sm text-left space-y-1">
                  <li>• {t('compass.instructions')}</li>
                </ul>
              </div>
            </div>

            <button
              onClick={retryInitialization}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors mb-4"
            >
              {tCommon('buttons.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header title={t('title')} onBack={onBack} isRTL={isRTL} />

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Location Info */}
        {compassState.locationName && (
          <div className="flex items-center justify-center gap-2 text-blue-700 mb-4">
            <MapPinIcon className="w-4 h-4" />
            <span className="text-sm">{compassState.locationName}</span>
            <button
              onClick={() => setShowManualLocationInput(true)}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              ({tCommon('buttons.change')})
            </button>
          </div>
        )}

        {/* Distance to Mecca */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-blue-600 text-sm font-semibold mb-1">
            {t('distance_to_kaaba')}
          </p>
          <p className="text-blue-800 text-xl font-bold">
            {formatDistance(compassState.distance)}
          </p>
        </div>

        {/* Compass */}
        <div className="relative">
          <div
            ref={compassRef}
            className="relative w-80 h-80 mx-auto bg-white rounded-full shadow-2xl border-4 border-slate-200 overflow-hidden"
          >
            {/* Compass Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100">
              {/* Compass Markings */}
              <div className="absolute inset-0">
                {/* Cardinal Directions */}
                {['N', 'E', 'S', 'W'].map((direction, index) => (
                  <div
                    key={direction}
                    className="absolute text-slate-700 font-bold text-lg"
                    style={{
                      top: index === 0 ? '8px' : index === 2 ? 'auto' : '50%',
                      bottom: index === 2 ? '8px' : 'auto',
                      left: index === 3 ? '8px' : index === 1 ? 'auto' : '50%',
                      right: index === 1 ? '8px' : 'auto',
                      transform: (index === 0 || index === 2) ? 'translateX(-50%)' : 'translateY(-50%)'
                    }}
                  >
                    {direction}
                  </div>
                ))}

                {/* Degree Markings */}
                {Array.from({ length: 36 }, (_, i) => i * 10).map((degree) => (
                  <div
                    key={degree}
                    className="absolute w-0.5 bg-slate-400"
                    style={{
                      height: degree % 30 === 0 ? '20px' : '10px',
                      top: degree % 30 === 0 ? '10px' : '15px',
                      left: '50%',
                      transformOrigin: '50% 140px',
                      transform: `translateX(-50%) rotate(${degree}deg)`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Qibla Needle */}
            <div
              ref={needleRef}
              className="absolute top-1/2 left-1/2 w-1 h-32 origin-bottom transition-transform duration-300 ease-out"
              style={{
                transform: `translate(-50%, -100%) rotate(${calculateNeedleRotation()}deg)`,
              }}
            >
              {/* Needle */}
              <div className={`w-full h-full rounded-full ${isPointingToQibla ? 'bg-green-500 shadow-lg' : 'bg-red-500'
                } transition-colors duration-300`}>
                {/* Needle Tip */}
                <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-4 ${isPointingToQibla ? 'border-l-transparent border-r-transparent border-b-green-600' : 'border-l-transparent border-r-transparent border-b-red-600'
                  } transition-colors duration-300`} />
              </div>
            </div>

            {/* Center Dot */}
            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-slate-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10" />

            {/* Qibla Indicator */}
            {isPointingToQibla && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-green-400 opacity-75"></div>
                <div className="relative inline-flex rounded-full h-8 w-8 bg-green-500 items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
              </div>
            )}
          </div>

          {/* Status Indicator */}
          <div className={`text-center mt-4 p-3 rounded-xl ${isManualMode
              ? 'bg-blue-100 border border-blue-200'
              : isPointingToQibla
                ? 'bg-green-100 border border-green-200'
                : 'bg-orange-100 border border-orange-200'
            }`}>
            <p className={`font-semibold ${isManualMode
                ? 'text-blue-800'
                : isPointingToQibla
                  ? 'text-green-800'
                  : 'text-orange-800'
              }`}>
              {isManualMode
                ? `Manual Mode - Qibla is ${Math.round(compassState.qiblaDirection)}° from North`
                : isPointingToQibla
                  ? 'Aligned with Qibla'
                  : 'Aligning...'
              }
            </p>
            {isManualMode && (
              <p className="text-blue-600 text-sm mt-1">
                Device orientation not available. Using manual compass mode.
              </p>
            )}
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-4">
          <div className="bg-white rounded-lg p-1 shadow-md border border-slate-200">
            <button
              onClick={async () => {
                if (isManualMode) {
                  // Try to switch to automatic mode
                  const isSupported = await QiblaService.isAutomaticModeSupported();
                  if (isSupported) {
                    try {
                      const started = await qiblaService.watchDeviceOrientation(handleOrientationChange);
                      if (started) {
                        setIsManualMode(false);
                      }
                    } catch (error) {
                      console.warn('Could not switch to automatic mode:', error);
                    }
                  }
                } else {
                  // Switch to manual mode
                  qiblaService.stopWatchingOrientation();
                  setIsManualMode(true);
                }
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !isManualMode
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Automatic
            </button>
            <button
              onClick={() => {
                qiblaService.stopWatchingOrientation();
                setIsManualMode(true);
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isManualMode
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Manual
            </button>
          </div>
        </div>

        {/* Manual Mode Instructions */}
        {isManualMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-semibold text-sm mb-2">
                  Manual Compass Mode
                </p>
                <p className="text-blue-700 text-sm mb-2">
                  Using manual compass mode. The needle shows the direction to Qibla from North.
                </p>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Find North using a physical compass or compass app</li>
                  <li>• Point your device towards North</li>
                  <li>• The needle shows Qibla direction ({Math.round(compassState.qiblaDirection)}° from North)</li>
                  <li>• Turn towards the direction indicated by the needle</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Calibration Status */}
        {!isManualMode && !compassState.isCalibrated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 font-semibold text-sm mb-2">
                  {t('compass.calibration')}
                </p>
                <button
                  onClick={() => setShowCalibrationInstructions(!showCalibrationInstructions)}
                  className="text-yellow-700 text-sm underline hover:text-yellow-800 transition-colors"
                >
                  {showCalibrationInstructions
                    ? 'Hide Instructions'
                    : 'Show Instructions'
                  }
                </button>
              </div>
            </div>

            {showCalibrationInstructions && (
              <div className="mt-3 pt-3 border-t border-yellow-200">
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• {t('compass.instructions')}</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Additional Information */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 mb-2">
            {t('title')}
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            {t('direction')}
          </p>
        </div>
      </div>

      <SimpleLocationInput
        isOpen={showManualLocationInput}
        onClose={() => setShowManualLocationInput(false)}
        onLocationSet={handleManualLocationSet}
        initialLocation={preferences.location}
      />

      <LocationPermissionModal
        isOpen={showLocationPermissionModal}
        onClose={() => setShowLocationPermissionModal(false)}
        onRetry={initializeCompass}
        onManualInput={() => {
          setShowLocationPermissionModal(false);
          setShowManualLocationInput(true);
        }}
        error={locationError}
      />
    </div>
  );
};

export default QiblaCompass;