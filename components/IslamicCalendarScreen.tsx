import React, { useState, useEffect } from 'react';
import { IslamicCalendarService } from '../services/IslamicCalendarService';
import { IslamicDate, Language } from '../types';
import { CalendarEventCard } from './CalendarEventCard';
import { RamadanTimesCard } from './RamadanTimesCard';

interface IslamicCalendarScreenProps {
  language: Language;
  onBack: () => void;
}

export const IslamicCalendarScreen: React.FC<IslamicCalendarScreenProps> = ({
  language,
  onBack
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [islamicDate, setIslamicDate] = useState<IslamicDate | null>(null);
  const [monthDates, setMonthDates] = useState<IslamicDate[]>([]);
  const [loading, setLoading] = useState(true);

  const isRTL = language === 'ar';

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      // Get Islamic date for current date
      const islamic = IslamicCalendarService.convertToHijri(currentDate);
      setIslamicDate(islamic);

      // Get dates for the current month view (30 days around current date)
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 15);
      const dates = IslamicCalendarService.getIslamicDateRange(startDate, 30);
      setMonthDates(dates);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const formatGregorianDate = (date: Date) => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const translations = {
    ar: {
      title: 'التقويم الإسلامي',
      today: 'اليوم',
      gregorian: 'ميلادي',
      hijri: 'هجري',
      events: 'الأحداث',
      noEvents: 'لا توجد أحداث',
      back: 'رجوع',
      previousMonth: 'الشهر السابق',
      nextMonth: 'الشهر التالي',
      loading: 'جاري التحميل...'
    },
    en: {
      title: 'Islamic Calendar',
      today: 'Today',
      gregorian: 'Gregorian',
      hijri: 'Hijri',
      events: 'Events',
      noEvents: 'No events',
      back: 'Back',
      previousMonth: 'Previous Month',
      nextMonth: 'Next Month',
      loading: 'Loading...'
    }
  };

  const t = translations[language];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-emerald-100">
        <div className="max-w-md mx-auto px-4 pt-16 pb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-emerald-50 transition-colors"
              aria-label={t.back}
            >
              <svg 
                className={`w-6 h-6 text-emerald-600 ${isRTL ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-emerald-800">{t.title}</h1>
            <button
              onClick={navigateToToday}
              className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors"
            >
              {t.today}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Current Date Display */}
        {islamicDate && (
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
            <div className="text-center space-y-3">
              <div>
                <p className="text-sm text-emerald-600 font-medium mb-1">{t.hijri}</p>
                <p className="text-2xl font-bold text-emerald-800">
                  {IslamicCalendarService.formatIslamicDate(islamicDate, language)}
                </p>
              </div>
              <div className="border-t border-emerald-100 pt-3">
                <p className="text-sm text-emerald-600 font-medium mb-1">{t.gregorian}</p>
                <p className="text-lg text-emerald-700">
                  {formatGregorianDate(islamicDate.gregorianDate)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-emerald-100 p-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-emerald-50 transition-colors"
            aria-label={t.previousMonth}
          >
            <svg 
              className={`w-5 h-5 text-emerald-600 ${isRTL ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <p className="text-lg font-semibold text-emerald-800">
              {islamicDate && IslamicCalendarService.getHijriMonthName(
                IslamicCalendarService.hijriMonthNames.indexOf(islamicDate.hijriMonth) + 1,
                language
              )} {islamicDate?.hijriYear}
            </p>
          </div>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-emerald-50 transition-colors"
            aria-label={t.nextMonth}
          >
            <svg 
              className={`w-5 h-5 text-emerald-600 ${isRTL ? '' : 'rotate-180'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4">
          <div className="grid grid-cols-7 gap-2">
            {monthDates.map((date, index) => {
              const isToday = date.gregorianDate.toDateString() === new Date().toDateString();
              const hasEvents = date.events && date.events.length > 0;
              
              return (
                <div
                  key={index}
                  className={`
                    aspect-square flex flex-col items-center justify-center p-1 rounded-lg text-sm
                    ${isToday 
                      ? 'bg-emerald-600 text-white font-bold' 
                      : hasEvents 
                        ? 'bg-emerald-100 text-emerald-800 font-medium' 
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }
                    transition-colors cursor-pointer
                  `}
                  onClick={() => setCurrentDate(date.gregorianDate)}
                >
                  <span className="text-xs">{date.hijriDay}</span>
                  {hasEvents && (
                    <div className={`w-1 h-1 rounded-full mt-1 ${isToday ? 'bg-white' : 'bg-emerald-500'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events for Current Date */}
        {islamicDate && islamicDate.events && islamicDate.events.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-emerald-800">{t.events}</h2>
            {islamicDate.events.map((eventName, index) => {
              const eventDetails = IslamicCalendarService.getDetailedIslamicEventsForDate(
                IslamicCalendarService.hijriMonthNames.indexOf(islamicDate.hijriMonth) + 1,
                islamicDate.hijriDay
              ).find(e => e.name === eventName);
              
              return (
                <CalendarEventCard
                  key={index}
                  event={eventDetails || { name: eventName, nameAr: eventName, isHoliday: false }}
                  language={language}
                />
              );
            })}
          </div>
        )}

        {/* Ramadan Times Card */}
        {islamicDate && IslamicCalendarService.isRamadan(
          IslamicCalendarService.hijriMonthNames.indexOf(islamicDate.hijriMonth) + 1
        ) && (
          <RamadanTimesCard
            date={islamicDate.gregorianDate}
            language={language}
          />
        )}

        {/* No Events Message */}
        {islamicDate && (!islamicDate.events || islamicDate.events.length === 0) && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-emerald-600">{t.noEvents}</p>
          </div>
        )}
      </div>
    </div>
  );
};