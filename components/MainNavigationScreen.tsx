import React from 'react';
import { View } from '../types';
import { useTranslation } from '../i18n/I18nProvider';

interface MainNavigationScreenProps {
  onNavigate: (view: View) => void;
}

export const MainNavigationScreen: React.FC<MainNavigationScreenProps> = ({
  onNavigate
}) => {
  const { t, isRTL } = useTranslation('main_navigation');

  const features = [
    {
      id: 'welcome' as View,
      title: t('features.sahw_assistant.title'),
      description: t('features.sahw_assistant.description'),
      icon: '🤲',
      color: 'from-blue-500 to-blue-600',
      available: true
    },
    {
      id: 'prayer-times' as View,
      title: t('features.prayer_times.title'),
      description: t('features.prayer_times.description'),
      icon: '🕌',
      color: 'from-green-500 to-green-600',
      available: true
    },
    {
      id: 'qibla' as View,
      title: t('features.qibla.title'),
      description: t('features.qibla.description'),
      icon: '🧭',
      color: 'from-purple-500 to-purple-600',
      available: true
    },
    {
      id: 'calendar' as View,
      title: t('features.calendar.title'),
      description: t('features.calendar.description'),
      icon: '📅',
      color: 'from-emerald-500 to-emerald-600',
      available: true
    },
    {
      id: 'tasbih' as View,
      title: t('features.tasbih.title'),
      description: t('features.tasbih.description'),
      icon: '📿',
      color: 'from-amber-500 to-amber-600',
      available: true
    },
    {
      id: 'mosques' as View,
      title: t('features.mosques.title'),
      description: t('features.mosques.description'),
      icon: '🕌',
      color: 'from-teal-500 to-teal-600',
      available: true
    },
    {
      id: 'settings' as View,
      title: t('features.settings.title'),
      description: t('features.settings.description'),
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
          <h1 className="text-4xl font-bold text-slate-800 mb-4">{t('title')}</h1>
          <p className="text-lg text-slate-600">{t('subtitle')}</p>
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
                        {t('coming_soon')}
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
          <p>{t('footer_blessing')}</p>
        </div>
      </div>
    </div>
  );
};