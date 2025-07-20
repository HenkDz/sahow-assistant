import React, { useEffect, useState } from 'react';
import { PrayerTimes } from '../../types';
import { PrayerTimesService } from '../../services/PrayerTimesService';
import { useTranslation } from '../../i18n/I18nProvider';
import { ClockIcon, SunIcon, MoonIcon } from '../icons/HeroIcons';

interface PrayerTimeCardProps {
  prayerTimes: PrayerTimes;
  showCountdown?: boolean;
  compact?: boolean;
}

interface PrayerInfo {
  name: string;
  time: Date;
  arabicName: string;
  icon: React.ReactNode;
  isNext?: boolean;
  isCurrent?: boolean;
}

const PrayerTimeCard: React.FC<PrayerTimeCardProps> = ({ 
  prayerTimes, 
  showCountdown = false,
  compact = false 
}) => {
  const { t, isRTL } = useTranslation('prayers');
  const [timeUntilNext, setTimeUntilNext] = useState<number>(0);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: Date } | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<{ name: string; time: Date } | null>(null);

  useEffect(() => {
    if (showCountdown) {
      const updateCountdown = () => {
        const next = PrayerTimesService.getNextPrayer(prayerTimes);
        const current = PrayerTimesService.getCurrentPrayer(prayerTimes);
        const minutes = PrayerTimesService.getTimeUntilNextPrayer(prayerTimes);
        
        setNextPrayer(next);
        setCurrentPrayer(current);
        setTimeUntilNext(minutes);
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [prayerTimes, showCountdown]);

  const formatTime = (time: Date): string => {
    return PrayerTimesService.formatPrayerTime(time, false);
  };

  const formatCountdown = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getPrayerIcon = (prayerName: string): React.ReactNode => {
    switch (prayerName.toLowerCase()) {
      case 'fajr':
        return <MoonIcon className="w-5 h-5" />;
      case 'sunrise':
        return <SunIcon className="w-5 h-5" />;
      case 'dhuhr':
        return <SunIcon className="w-5 h-5" />;
      case 'asr':
        return <SunIcon className="w-5 h-5" />;
      case 'maghrib':
        return <SunIcon className="w-5 h-5" />;
      case 'isha':
        return <MoonIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const prayers: PrayerInfo[] = [
    {
      name: t('names.fajr'),
      arabicName: 'الفجر',
      time: prayerTimes.fajr,
      icon: getPrayerIcon('fajr'),
      isNext: nextPrayer?.name === 'Fajr',
      isCurrent: currentPrayer?.name === 'Fajr'
    },
    {
      name: t('names.sunrise'),
      arabicName: 'الشروق',
      time: prayerTimes.sunrise,
      icon: getPrayerIcon('sunrise'),
      isNext: nextPrayer?.name === 'Sunrise',
      isCurrent: currentPrayer?.name === 'Sunrise'
    },
    {
      name: t('names.dhuhr'),
      arabicName: 'الظهر',
      time: prayerTimes.dhuhr,
      icon: getPrayerIcon('dhuhr'),
      isNext: nextPrayer?.name === 'Dhuhr',
      isCurrent: currentPrayer?.name === 'Dhuhr'
    },
    {
      name: t('names.asr'),
      arabicName: 'العصر',
      time: prayerTimes.asr,
      icon: getPrayerIcon('asr'),
      isNext: nextPrayer?.name === 'Asr',
      isCurrent: currentPrayer?.name === 'Asr'
    },
    {
      name: t('names.maghrib'),
      arabicName: 'المغرب',
      time: prayerTimes.maghrib,
      icon: getPrayerIcon('maghrib'),
      isNext: nextPrayer?.name === 'Maghrib',
      isCurrent: currentPrayer?.name === 'Maghrib'
    },
    {
      name: t('names.isha'),
      arabicName: 'العشاء',
      time: prayerTimes.isha,
      icon: getPrayerIcon('isha'),
      isNext: nextPrayer?.name === 'Isha',
      isCurrent: currentPrayer?.name === 'Isha'
    }
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-2 text-sm">
        {prayers.map((prayer, index) => (
          <div
            key={index}
            className={`flex flex-col items-center p-2 rounded-lg ${
              prayer.isNext
                ? 'bg-blue-100 border border-blue-200'
                : prayer.isCurrent
                ? 'bg-green-100 border border-green-200'
                : 'bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-1 mb-1">
              <span className={prayer.isNext ? 'text-blue-600' : prayer.isCurrent ? 'text-green-600' : 'text-slate-600'}>
              {prayer.icon}
              </span>
              <span className={`font-semibold text-xs ${
              prayer.isNext ? 'text-blue-800' : prayer.isCurrent ? 'text-green-800' : 'text-slate-700'
              }`}>
              {isRTL ? prayer.arabicName : prayer.name}
              </span>
            </div>
            <span className={`text-xs ${
              prayer.isNext ? 'text-blue-700' : prayer.isCurrent ? 'text-green-700' : 'text-slate-600'
            }`}>
              {formatTime(prayer.time)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Countdown Section */}
      {showCountdown && nextPrayer && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
          <div className="text-center">
            <p className="text-sm text-blue-600 font-semibold mb-1">
              {t('next_prayer', 'Next Prayer')}
            </p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-blue-600">{getPrayerIcon(nextPrayer.name)}</span>
              <h3 className="text-xl font-bold text-blue-800">
                {isRTL
                  ? prayers.find(p => p.name === t(`names.${nextPrayer.name.toLowerCase()}` as any))?.arabicName
                  : t(`names.${nextPrayer.name.toLowerCase()}` as any, nextPrayer.name)
                }
              </h3>
            </div>
            <p className="text-lg font-bold text-blue-700">
              {formatTime(nextPrayer.time)}
            </p>
            {timeUntilNext > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                {t('in', 'in')} {formatCountdown(timeUntilNext)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Prayer Times Grid */}
      <div className="grid grid-cols-2 gap-3">
        {prayers.map((prayer, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border transition-all duration-200 ${
              prayer.isNext
                ? 'border-blue-300 bg-blue-50 shadow-md'
                : prayer.isCurrent
                ? 'border-green-300 bg-green-50 shadow-md'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className={`${
                prayer.isNext 
                  ? 'text-blue-600' 
                  : prayer.isCurrent 
                  ? 'text-green-600' 
                  : 'text-slate-600'
              }`}>
                {prayer.icon}
              </span>
              <div className="flex-1">
                <h4 className={`font-bold text-sm ${
                  prayer.isNext 
                    ? 'text-blue-800' 
                    : prayer.isCurrent 
                    ? 'text-green-800' 
                    : 'text-slate-800'
                }`}>
                  {isRTL ? prayer.arabicName : prayer.name}
                </h4>
                {!isRTL && (
                  <p className="text-xs text-slate-500">{prayer.arabicName}</p>
                )}
              </div>
            </div>
            <p className={`text-lg font-bold ${
              prayer.isNext 
                ? 'text-blue-700' 
                : prayer.isCurrent 
                ? 'text-green-700' 
                : 'text-slate-700'
            }`}>
              {formatTime(prayer.time)}
            </p>
            {prayer.isNext && (
              <div className="mt-2 flex items-center gap-1">
                <ClockIcon className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600 font-semibold">
                  {t('next', 'Next')}
                </span>
              </div>
            )}
            {prayer.isCurrent && (
              <div className="mt-2 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-semibold">
                  {t('current', 'Current')}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-200">
        <p>
          {t('calculation_method', 'Calculation Method')}: {prayerTimes.location}
        </p>
      </div>
    </div>
  );
};

export default PrayerTimeCard;