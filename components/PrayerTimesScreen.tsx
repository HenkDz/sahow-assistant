import React, { useEffect, useState } from 'react';
import { Language, PrayerTimes, Location } from '../types';
import { PrayerTimesService } from '../services/PrayerTimesService';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';
import { usePrayerTimesStore } from '../stores/prayerTimesStore';
import { locationService } from '../services/LocationService';
import { useOfflinePrayerTimes } from '../hooks/useOfflineFirst';
import PrayerTimeCard from './PrayerTimeCard';
import ManualLocationInput from './ManualLocationInput';
import LocationPermissionModal from './LocationPermissionModal';
import OfflineIndicator from './OfflineIndicator';
import OfflineErrorBoundary from './OfflineErrorBoundary';
import { ArrowLeftIcon, MapPinIcon, CalendarIcon } from './icons/HeroIcons';
import { Header } from './Header';

interface PrayerTimesScreenProps {
  onBack: () => void;
  t: Record<string, string>;
  lang: Language;
}

const PrayerTimesScreen: React.FC<PrayerTimesScreenProps> = ({ onBack, t, lang }) => {
  const { preferences, setLocation } = useUserPreferencesStore();
  const { 
    currentPrayerTimes, 
    isLoading, 
    error, 
    setPrayerTimes, 
    setLoading, 
    setError 
  } = usePrayerTimesStore();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weeklyTimes, setWeeklyTimes] = useState<PrayerTimes[]>([]);
  const [showManualLocationInput, setShowManualLocationInput] = useState(false);
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const { state, executeWithFallback, getFeatureAvailability, getCacheStatusMessage } = useOfflinePrayerTimes();

  useEffect(() => {
    if (!preferences.location) {
      handleLocationSetup();
    } else {
      loadPrayerTimes();
    }
  }, [preferences.location, preferences.calculationMethod, preferences.madhab, selectedDate]);

  const handleLocationSetup = async () => {
    setLoading(true);

    try {
      const result = await locationService.getCurrentLocation();
      
      if (result.success && result.location) {
        setLocation(result.location);
      } else if (result.error) {
        // Show appropriate modal based on error type
        if (result.error.code === 1) { // Permission denied
          setShowLocationPermissionModal(true);
        } else {
          // For other errors, show manual location input
          setShowManualLocationInput(true);
        }
      }
    } catch (err) {
      setShowManualLocationInput(true);
    } finally {
      setLoading(false);
    }
  };

  const loadPrayerTimes = async () => {
    if (!preferences.location) {
      setError('Location not available. Please enable location services or set location manually.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await executeWithFallback(
        // Online action: fresh calculation
        async () => {
          const result = await PrayerTimesService.getPrayerTimesWithCache(
            preferences.location!,
            selectedDate,
            preferences.calculationMethod,
            preferences.madhab
          );
          setIsFromCache(false);
          return result;
        },
        // Offline fallback: use cached data
        async () => {
          const result = await PrayerTimesService.getCachedPrayerTimes(
            preferences.location!,
            selectedDate
          );
          if (!result) {
            throw new Error('No cached prayer times available for this location and date.');
          }
          setIsFromCache(true);
          return result;
        }
      );
      
      setPrayerTimes(result.prayerTimes);

      // Load weekly prayer times if available
      try {
        const weekly = await PrayerTimesService.calculateWeeklyPrayerTimes(
          preferences.location,
          selectedDate,
          7,
          preferences.calculationMethod,
          preferences.madhab
        );
        setWeeklyTimes(weekly);
      } catch (weeklyError) {
        // Weekly data is optional, don't fail the entire load
        console.warn('Could not load weekly prayer times:', weeklyError);
        setWeeklyTimes([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prayer times');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLocationSet = (location: Location) => {
    setLocation(location);
    locationService.setManualLocation(location);
    setShowManualLocationInput(false);
  };

  const handleLocationPermissionDenied = () => {
    setShowLocationPermissionModal(false);
    setShowManualLocationInput(true);
  };

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', options);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const handleSyncData = async () => {
    if (state.isOnline) {
      setLoading(true);
      try {
        await loadPrayerTimes();
      } catch (error) {
        console.error('Sync failed:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">{t.loading_prayer_times || 'Loading prayer times...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <p className="text-red-600 font-semibold mb-2">{t.error_title || 'Error'}</p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
        <button
          onClick={loadPrayerTimes}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-colors"
        >
          {t.retry || 'Retry'}
        </button>
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 w-full mt-4 text-slate-600 font-semibold hover:text-blue-600 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>{t.btn_back || 'Back'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header title={t.prayer_times_title || 'Prayer Times'} onBack={onBack} isRTL={lang === 'ar'} />
      
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Offline Indicator */}
        <OfflineIndicator onRetry={handleSyncData} />

        {/* Location Info */}
        {preferences.location && (
          <div className="flex items-center justify-center gap-2 text-blue-700 mb-4">
            <MapPinIcon className="w-4 h-4" />
            <span className="text-sm">
              {preferences.location.city}, {preferences.location.country}
            </span>
          </div>
        )}

        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-blue-100">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label="Previous day"
          >
            <ArrowLeftIcon className="w-5 h-5 text-blue-600" />
          </button>
          
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800">
              {formatDate(selectedDate)}
            </span>
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
            aria-label="Next day"
          >
            <ArrowLeftIcon className="w-5 h-5 text-blue-600 rotate-180" />
          </button>
        </div>

      {/* Today's Prayer Times */}
      {currentPrayerTimes && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-blue-800">
              {t.todays_prayers || "Today's Prayers"}
            </h2>
            {isFromCache && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                Cached
              </span>
            )}
          </div>
          <PrayerTimeCard 
            prayerTimes={currentPrayerTimes} 
            t={t} 
            lang={lang}
            showCountdown={true}
          />
        </div>
      )}

      {/* Weekly View */}
      {weeklyTimes.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
          <h2 className="text-xl font-bold text-blue-800 mb-4 text-center">
            {t.weekly_prayers || 'Weekly Prayer Times'}
          </h2>
          <div className="space-y-3">
            {weeklyTimes.map((dayTimes, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  dayTimes.date.toDateString() === new Date().toDateString()
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="text-sm font-semibold text-blue-700 mb-2">
                  {formatDate(dayTimes.date)}
                </div>
                <PrayerTimeCard 
                  prayerTimes={dayTimes} 
                  t={t} 
                  lang={lang}
                  showCountdown={false}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Location Input Modal */}
      <ManualLocationInput
        isOpen={showManualLocationInput}
        onClose={() => setShowManualLocationInput(false)}
        onLocationSet={handleManualLocationSet}
        t={t}
        initialLocation={preferences.location}
      />

      {/* Location Permission Modal */}
      <LocationPermissionModal
        isOpen={showLocationPermissionModal}
        onClose={handleLocationPermissionDenied}
        onRetry={handleLocationSetup}
        onManualInput={() => setShowManualLocationInput(true)}
        error={null}
        t={t}
      />
      </div>
    </div>
  );
};

export default PrayerTimesScreen;