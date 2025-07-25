import React, { useEffect, useState } from 'react';
import { PrayerTimes, Location } from '../../types';
import { PrayerTimesService } from '../../services/PrayerTimesService';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';
import { usePrayerTimesStore } from '../../stores/prayerTimesStore';
import { locationService } from '../../services/LocationService';
import { useOfflinePrayerTimes } from '../../hooks/useOfflineFirst';
import { useTranslation } from '../../i18n/I18nProvider';
import PrayerTimeCard from './PrayerTimeCard';
import LocationSelector from '../shared/LocationSelector';
import OfflineIndicator from '../shared/OfflineIndicator';
import { ArrowLeftIcon, MapPinIcon, CalendarIcon } from '../icons/HeroIcons';
import { Header } from '../shared/Header';

interface PrayerTimesScreenProps {
  onBack: () => void;
}

const PrayerTimesScreen: React.FC<PrayerTimesScreenProps> = ({ onBack }) => {
  const { t, isRTL } = useTranslation('prayers');
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
  const [isFromCache, setIsFromCache] = useState(false);
  const { state, executeWithFallback, getFeatureAvailability, getCacheStatusMessage } = useOfflinePrayerTimes();

  useEffect(() => {
    if (preferences.location) {
      loadPrayerTimes();
    }
  }, [preferences.location, preferences.calculationMethod, preferences.madhab, selectedDate]);

  const handleLocationUpdate = (location: Location) => {
    // Location updated successfully, trigger prayer times reload
    loadPrayerTimes();
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



  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', options);
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
        <p className="text-slate-600">{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <p className="text-red-600 font-semibold mb-2">{t('common:status.error_title')}</p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
        <button
          onClick={loadPrayerTimes}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-colors"
        >
          {t('common:buttons.retry')}
        </button>
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 w-full mt-4 text-slate-600 font-semibold hover:text-blue-600 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>{t('common:buttons.back')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header title={t('title')} onBack={onBack} isRTL={isRTL} />
      
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Offline Indicator */}
        <OfflineIndicator onRetry={handleSyncData} />

        {/* Location Selector */}
        <LocationSelector
          onLocationUpdate={handleLocationUpdate}
          autoFetchOnMount={!preferences.location}
          variant="compact"
          showSuccessMessage={false}
        />

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
              {t('todays_prayers')}
            </h2>
            {isFromCache && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                Cached
              </span>
            )}
          </div>
          <PrayerTimeCard 
            prayerTimes={currentPrayerTimes} 
            showCountdown={true}
          />
        </div>
      )}

      {/* Weekly View */}
      {weeklyTimes.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
          <h2 className="text-xl font-bold text-blue-800 mb-4 text-center">
            {t('weekly_prayers')}
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
                  showCountdown={false}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </div>
      )}


      </div>
    </div>
  );
};

export default PrayerTimesScreen;