import React, { useState, useEffect } from 'react';
import { Language, Location, PrayerTimes } from '../types';
import { IslamicCalendarService } from '../services/IslamicCalendarService';
import { PrayerTimesService } from '../services/PrayerTimesService';

interface RamadanTimesCardProps {
  date: Date;
  language: Language;
  location?: Location;
}

interface RamadanTimes {
  suhoorTime: Date;
  iftarTime: Date;
  date: Date;
}

export const RamadanTimesCard: React.FC<RamadanTimesCardProps> = ({
  date,
  language,
  location
}) => {
  const [ramadanTimes, setRamadanTimes] = useState<RamadanTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isRTL = language === 'ar';

  useEffect(() => {
    loadRamadanTimes();
  }, [date, location]);

  const loadRamadanTimes = async () => {
    if (!location) {
      setError('Location not available');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get prayer times for the date
      const prayerTimes = await PrayerTimesService.calculatePrayerTimes(location, date);
      
      // Calculate Ramadan times using the prayer times
      const times = await IslamicCalendarService.calculateRamadanTimes(location, date, prayerTimes);
      setRamadanTimes(times);
    } catch (err) {
      console.error('Error loading Ramadan times:', err);
      setError('Failed to load Ramadan times');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeUntil = (targetTime: Date) => {
    const now = new Date();
    const diff = targetTime.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  };

  const translations = {
    ar: {
      ramadanTimes: 'أوقات رمضان',
      suhoor: 'السحور',
      iftar: 'الإفطار',
      endsAt: 'ينتهي في',
      startsAt: 'يبدأ في',
      timeRemaining: 'الوقت المتبقي',
      hours: 'ساعة',
      minutes: 'دقيقة',
      and: 'و',
      loading: 'جاري التحميل...',
      locationRequired: 'الموقع مطلوب لحساب أوقات رمضان',
      error: 'خطأ في تحميل أوقات رمضان'
    },
    en: {
      ramadanTimes: 'Ramadan Times',
      suhoor: 'Suhoor',
      iftar: 'Iftar',
      endsAt: 'Ends at',
      startsAt: 'Starts at',
      timeRemaining: 'Time remaining',
      hours: 'hours',
      minutes: 'minutes',
      and: 'and',
      loading: 'Loading...',
      locationRequired: 'Location required for Ramadan times',
      error: 'Error loading Ramadan times'
    }
  };

  const t = translations[language];

  if (loading) {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-purple-100 p-6 ${isRTL ? 'rtl' : ''}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
          <p className="text-purple-700">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-purple-100 p-6 ${isRTL ? 'rtl' : ''}`}>
        <div className="text-center">
          <svg className="w-12 h-12 text-purple-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-purple-600">{error || t.locationRequired}</p>
        </div>
      </div>
    );
  }

  if (!ramadanTimes) {
    return null;
  }

  const now = new Date();
  const suhoorTimeRemaining = getTimeUntil(ramadanTimes.suhoorTime);
  const iftarTimeRemaining = getTimeUntil(ramadanTimes.iftarTime);

  return (
    <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-purple-100 p-6 ${isRTL ? 'rtl' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-purple-900">{t.ramadanTimes}</h3>
          <p className="text-sm text-purple-600">
            {date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Suhoor and Iftar Times */}
      <div className="grid grid-cols-2 gap-4">
        {/* Suhoor */}
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/>
              </svg>
            </div>
            <h4 className="font-semibold text-blue-900 mb-1">{t.suhoor}</h4>
            <p className="text-sm text-blue-600 mb-2">{t.endsAt}</p>
            <p className="text-xl font-bold text-blue-800">{formatTime(ramadanTimes.suhoorTime)}</p>
            {suhoorTimeRemaining && (
              <div className="mt-2 text-xs text-blue-600">
                <p>{t.timeRemaining}</p>
                <p className="font-medium">
                  {suhoorTimeRemaining.hours} {t.hours} {t.and} {suhoorTimeRemaining.minutes} {t.minutes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Iftar */}
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <div className="text-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            </div>
            <h4 className="font-semibold text-orange-900 mb-1">{t.iftar}</h4>
            <p className="text-sm text-orange-600 mb-2">{t.startsAt}</p>
            <p className="text-xl font-bold text-orange-800">{formatTime(ramadanTimes.iftarTime)}</p>
            {iftarTimeRemaining && (
              <div className="mt-2 text-xs text-orange-600">
                <p>{t.timeRemaining}</p>
                <p className="font-medium">
                  {iftarTimeRemaining.hours} {t.hours} {t.and} {iftarTimeRemaining.minutes} {t.minutes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Islamic decoration */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 text-purple-400">
          <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
          <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};