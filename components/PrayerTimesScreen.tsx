import React, { useEffect, useState } from 'react';
import { Language, PrayerTimes, Location } from '../types';
import { PrayerTimesService } from '../services/PrayerTimesService';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';
import { usePrayerTimesStore } from '../stores/prayerTimesStore';
import { locationService } from '../services/LocationService';
import PrayerTimeCard from './PrayerTimeCard';
import ManualLocationInput from './ManualLocationInput';
import LocationPermissionModal from './LocationPermissionModal';
import { ArrowLeftIcon, MapPinIcon, CalendarIcon } from './icons/HeroIcons';

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
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!preferences.location) {
      handleLocationSetup();
    } else {
      loadPrayerTimes();
    }
  }, [preferences.location, preferences.calculationMethod, preferences.madhab, selectedDate]);

  const handleLocationSetup = async () => {
    setLoading(true);
    setLocationError(null);

    try {
      const result = await locationService.getCurrentLocation();
      
      if (result.success && result.location) {
        setLocation(result.location);
        setLocationError(null);
      } else if (result.error) {
        setLocationError(result.error.message);
        // Show appropriate modal based on error type
        if (result.error.code === 1) { // Permission denied
          setShowLocationPermissionModal(true);
        } else {
          // For other errors, show manual location input
          setShowManualLocationInput(true);
        }
      }
    } catch (err) {
      setLocationError('Failed to get location. Please set manually.');
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
      // Load today's prayer times
      const todayTimes = await PrayerTimesService.calculatePrayerTimes(
        preferences.location,
        selectedDate,
        preferences.calculationMethod,
        preferences.madhab
      );
      setPrayerTimes(todayTimes);

      // Load weekly prayer times
      const weekly = await PrayerTimesService.calculateWeeklyPrayerTimes(
        preferences.location,
        selectedDate,
        7,
        preferences.calculationMethod,
        preferences.madhab
      );
      setWeeklyTimes(weekly);
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
    setLocationError(null);
  };

  const handleLocationPermissionGranted = async () => {
    setShowLocationPermissionModal(false);
    await handleLocationSetup();
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
    <div className="space-y-6 pt-20 px-4 pb-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">
          {t.prayer_times_title || 'Prayer Times'}
        </h1>
        
        {/* Location Info */}
        {preferences.location && (
          <div className="flex items-center justify-center gap-2 text-slate-600 mb-4">
            <MapPinIcon className="w-4 h-4" />
            <span className="text-sm">
              {preferences.location.city}, {preferences.location.country}
            </span>
          </div>
        )}

        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Previous day"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
          </button>
          
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-slate-800">
              {formatDate(selectedDate)}
            </span>
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Next day"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-600 rotate-180" />
          </button>
        </div>
      </div>

      {/* Today's Prayer Times */}
      {currentPrayerTimes && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">
            {t.todays_prayers || "Today's Prayers"}
          </h2>
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
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">
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
                <div className="text-sm font-semibold text-slate-600 mb-2">
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

      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center justify-center gap-2 w-full mt-6 text-slate-600 font-semibold hover:text-blue-600 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>{t.btn_back || 'Back'}</span>
      </button>

      {/* Location Error with Manual Input Option */}
      {locationError && !preferences.location && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t.location_error_title || 'Location Required'}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {locationError}
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setShowManualLocationInput(true)}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200"
              >
                {t.btn_set_location_manually || 'Set Location Manually'}
              </button>
              <button
                onClick={handleLocationSetup}
                className="w-full bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-gray-400 transition-colors duration-200"
              >
                {t.btn_try_again || 'Try Again'}
              </button>
            </div>
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
        onPermissionGranted={handleLocationPermissionGranted}
        t={t}
      />
    </div>
  );
};

export default PrayerTimesScreen;