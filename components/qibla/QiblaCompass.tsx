import React, { useEffect, useState, useRef } from 'react';
import { Location } from '../../types';
import { QiblaService, DeviceOrientationResult } from '../../services/QiblaService';
import { qiblaService } from '../../services/QiblaService';
import { useTranslation } from '../../i18n/I18nProvider';
import { ExclamationTriangleIcon, InformationCircleIcon } from '../icons/HeroIcons';
import { Header } from '../shared/Header';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import LocationSelector from '../shared/LocationSelector';

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
  const { preferences } = useUserPreferencesStore();
  const [compassState, setCompassState] = useState<CompassState>({
    qiblaDirection: 0,
    deviceOrientation: 0,
    distance: 0,
    isCalibrated: false,
    isLoading: true,
    error: null,
    locationName: ''
  });

  const [showCalibrationInstructions, setShowCalibrationInstructions] = useState(false);
  const [isPointingToQibla, setIsPointingToQibla] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [manualOrientationMode, setManualOrientationMode] = useState<'north-up' | 'qibla-up'>('north-up');
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

    try {
      const location = preferences.location;
      if (!location) {
        setCompassState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Location is required for Qibla direction'
        }));
        return;
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
        locationName: `${location.city}, ${location.country}`,
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
            // Fall back to manual mode gracefully
            console.warn('Failed to start automatic orientation tracking - using manual mode');
            setIsManualMode(true);
          }
        } catch (error) {
          console.warn('Failed to start automatic orientation tracking - using manual mode:', error);
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
      // Log the specific error for debugging
      console.warn('Device orientation failed:', result.error);
      
      // Always fall back to manual mode instead of showing error screen
      // This allows users to still use the compass manually
      setIsManualMode(true);
      setCompassState(prev => ({
        ...prev,
        error: null, // Clear any error state
        isCalibrated: true // Set as calibrated for manual mode
      }));
      setShowCalibrationInstructions(false);
    }
  };

  const handleLocationUpdate = (_location: Location) => {
    // When location is updated, recalculate compass
    initializeCompass();
  };

  const handleLocationLoading = (isLoading: boolean) => {
    setLocationLoading(isLoading);
  };

  const calculateNeedleRotation = (): number => {
    if (isManualMode) {
      // In manual mode, direction depends on orientation mode
      if (manualOrientationMode === 'qibla-up') {
        // When compass is rotated to put Qibla at top, needle should just point straight up
        return 0;
      } else {
        return compassState.qiblaDirection; // Show direction from North
      }
    } else {
      // In automatic mode, adjust for device orientation
      return QiblaService.calculateCompassBearing(
        compassState.qiblaDirection,
        compassState.deviceOrientation
      );
    }
  };

  const calculateCompassRotation = (): number => {
    if (isManualMode && manualOrientationMode === 'qibla-up') {
      // Rotate the entire compass so Qibla direction is at the top
      return -compassState.qiblaDirection;
    }
    return 0; // No rotation for North-up mode or automatic mode
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

  if (compassState.isLoading || locationLoading) {
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

  if (!preferences.location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <Header title={t('title')} onBack={onBack} isRTL={isRTL} />

        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🧭</span>
              </div>
              <p className="text-blue-800 font-semibold mb-2">
                {t('location_required')}
              </p>
              <p className="text-blue-600 text-sm mb-4">
                Set your location to see the Qibla direction
              </p>
            </div>

            <LocationSelector
              onLocationUpdate={handleLocationUpdate}
              onLocationLoading={handleLocationLoading}
              autoFetchOnMount={true}
              variant="card"
              showSuccessMessage={true}
            />
          </div>
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
        {/* Location Selector */}
        <LocationSelector
          onLocationUpdate={handleLocationUpdate}
          onLocationLoading={handleLocationLoading}
          autoFetchOnMount={true}
          variant="compact"
          showSuccessMessage={false}
        />

        {/* Distance to Mecca */}
        {preferences.location && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-blue-600 text-sm font-semibold mb-1">
              {t('distance_to_kaaba')}
            </p>
            <p className="text-blue-800 text-xl font-bold">
              {formatDistance(compassState.distance)}
            </p>
          </div>
        )}

        {/* Compass */}
        <div className="relative">
                      {/* Orientation Toggle - only show in manual mode */}
            {isManualMode && (
              <div className="absolute top-0 right-0 z-8">
              <button
                              onClick={() => setManualOrientationMode(prev => prev === 'north-up' ? 'qibla-up' : 'north-up')}
              className="bg-white rounded-full p-2 shadow-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              title={manualOrientationMode === 'north-up' ? t('compass.toggle_hints.to_qibla_up') : t('compass.toggle_hints.to_north_up')}
            >
                {manualOrientationMode === 'north-up' ? (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">N</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <span className="text-green-600 text-lg">🕋</span>
                  </div>
                )}
              </button>
            </div>
          )}

          <div className="relative w-80 h-80 mx-auto">
            {/* Compass Background - this rotates */}
            <div
              ref={compassRef}
              className="absolute inset-0 bg-white rounded-full shadow-2xl border-4 border-slate-200 overflow-hidden"
              style={{
                transform: `rotate(${calculateCompassRotation()}deg)`,
                transition: 'transform 0.5s ease-out'
              }}
            >
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
            </div>

            {/* Qibla Needle - this stays independent of compass rotation */}
            <div
              ref={needleRef}
              className="absolute top-1/2 left-1/2 w-1 h-32 origin-bottom transition-transform duration-300 ease-out z-2"
              style={{
                transform: `translate(-50%, -100%) rotate(${calculateNeedleRotation()}deg)`,
                transformOrigin: '50% 100%'
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
            <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-slate-800 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-3" />

            {/* Qibla Indicator */}
            {isPointingToQibla && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-4">
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
                ? manualOrientationMode === 'qibla-up'
                  ? t('compass.status.manual_qibla_up')
                  : t('compass.status.manual_north_up', { degrees: Math.round(compassState.qiblaDirection) })
                : isPointingToQibla
                  ? t('compass.status.aligned')
                  : t('compass.status.aligning')
              }
            </p>
            {isManualMode && (
              <p className="text-blue-600 text-sm mt-1">
                {manualOrientationMode === 'qibla-up' 
                  ? t('compass.status.face_needle')
                  : t('compass.status.device_unavailable')
                }
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
              {t('compass.modes.automatic')}
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
              {t('compass.modes.manual')}
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
                  {t('compass.manual_mode_title')}
                </p>
                <p className="text-blue-700 text-sm mb-2">
                  {manualOrientationMode === 'qibla-up' 
                    ? t('compass.orientation_modes.qibla_up.description')
                    : t('compass.orientation_modes.north_up.description')
                  }
                </p>
                <ul className="text-blue-700 text-sm space-y-1">
                  {manualOrientationMode === 'qibla-up' ? (
                    <>
                      {(t('compass.orientation_modes.qibla_up.instructions', { returnObjects: true }) as string[]).map((instruction: string, index: number) => (
                        <li key={index}>• {instruction}</li>
                      ))}
                    </>
                  ) : (
                    <>
                      {(t('compass.orientation_modes.north_up.instructions', { 
                        returnObjects: true, 
                        degrees: Math.round(compassState.qiblaDirection) 
                      }) as string[]).map((instruction: string, index: number) => (
                        <li key={index}>• {instruction}</li>
                      ))}
                    </>
                  )}
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
    </div>
  );
};

export default QiblaCompass;