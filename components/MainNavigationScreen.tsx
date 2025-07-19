import React from 'react';
import { Language, View } from '../types';

interface MainNavigationScreenProps {
  language: Language;
  onNavigate: (view: View) => void;
}

export const MainNavigationScreen: React.FC<MainNavigationScreenProps> = ({
  language,
  onNavigate
}) => {
  const isRTL = language === 'ar';

  const translations = {
    ar: {
      title: 'التطبيق الإسلامي الشامل',
      subtitle: 'مجموعة من الأدوات الإسلامية المفيدة',
      sahwAssistant: 'مساعد السهو',
      sahwDesc: 'دليلك لأحكام سجود السهو في الصلاة',
      prayerTimes: 'أوقات الصلاة',
      prayerDesc: 'أوقات الصلاة الدقيقة لموقعك',
      qibla: 'اتجاه القبلة',
      qiblaDesc: 'تحديد اتجاه القبلة بدقة',
      calendar: 'التقويم الإسلامي',
      calendarDesc: 'التقويم الهجري والمناسبات الإسلامية',
      tasbih: 'التسبيح',
      tasbihDesc: 'عداد التسبيح الرقمي',
      mosques: 'المساجد القريبة',
      mosquesDesc: 'العثور على المساجد في منطقتك',
      settings: 'الإعدادات',
      settingsDesc: 'إعدادات التطبيق والتفضيلات'
    },
    en: {
      title: 'Comprehensive Islamic App',
      subtitle: 'A collection of useful Islamic tools',
      sahwAssistant: 'Sahw Assistant',
      sahwDesc: 'Guide to prayer correction rulings',
      prayerTimes: 'Prayer Times',
      prayerDesc: 'Accurate prayer times for your location',
      qibla: 'Qibla Direction',
      qiblaDesc: 'Find the precise direction to Mecca',
      calendar: 'Islamic Calendar',
      calendarDesc: 'Hijri calendar and Islamic events',
      tasbih: 'Digital Tasbih',
      tasbihDesc: 'Digital prayer bead counter',
      mosques: 'Nearby Mosques',
      mosquesDesc: 'Find mosques in your area',
      settings: 'Settings',
      settingsDesc: 'App settings and preferences'
    }
  };

  const t = translations[language];

  const features = [
    {
      id: 'welcome' as View,
      title: t.sahwAssistant,
      description: t.sahwDesc,
      icon: '🤲',
      color: 'from-blue-500 to-blue-600',
      available: true
    },
    {
      id: 'prayer-times' as View,
      title: t.prayerTimes,
      description: t.prayerDesc,
      icon: '🕌',
      color: 'from-green-500 to-green-600',
      available: true
    },
    {
      id: 'qibla' as View,
      title: t.qibla,
      description: t.qiblaDesc,
      icon: '🧭',
      color: 'from-purple-500 to-purple-600',
      available: true
    },
    {
      id: 'calendar' as View,
      title: t.calendar,
      description: t.calendarDesc,
      icon: '📅',
      color: 'from-emerald-500 to-emerald-600',
      available: true
    },
    {
      id: 'tasbih' as View,
      title: t.tasbih,
      description: t.tasbihDesc,
      icon: '📿',
      color: 'from-amber-500 to-amber-600',
      available: true
    },
    {
      id: 'mosques' as View,
      title: t.mosques,
      description: t.mosquesDesc,
      icon: '🕌',
      color: 'from-teal-500 to-teal-600',
      available: false
    },
    {
      id: 'settings' as View,
      title: t.settings,
      description: t.settingsDesc,
      icon: '⚙️',
      color: 'from-gray-500 to-gray-600',
      available: true
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">{t.title}</h1>
          <p className="text-lg text-slate-600">{t.subtitle}</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className={`
                relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 cursor-pointer
                ${feature.available 
                  ? 'hover:shadow-xl hover:scale-105 bg-white' 
                  : 'bg-gray-100 opacity-60 cursor-not-allowed'
                }
              `}
              onClick={() => feature.available && onNavigate(feature.id)}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-10`} />
              
              {/* Content */}
              <div className="relative p-6">
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-4">{feature.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 mb-1">
                      {feature.title}
                    </h3>
                    {!feature.available && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full">
                        {language === 'ar' ? 'قريباً' : 'Coming Soon'}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Hover Effect */}
              {feature.available && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500 text-sm">
          <p>{language === 'ar' ? 'بارك الله فيكم' : 'May Allah bless you'}</p>
        </div>
      </div>
    </div>
  );
};