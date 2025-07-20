import React from 'react';
import { Language } from '../../types';
import { NotificationPreferences } from '../../services/SettingsService';

interface NotificationSettingsProps {
  value: NotificationPreferences;
  onChange: (notifications: Partial<NotificationPreferences>) => void;
  lang: Language;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
  value, 
  onChange, 
  lang 
}) => {
  const prayerNames = [
    { key: 'fajr' as keyof NotificationPreferences, name: lang === 'ar' ? 'الفجر' : 'Fajr', nameEn: 'Fajr' },
    { key: 'dhuhr' as keyof NotificationPreferences, name: lang === 'ar' ? 'الظهر' : 'Dhuhr', nameEn: 'Dhuhr' },
    { key: 'asr' as keyof NotificationPreferences, name: lang === 'ar' ? 'العصر' : 'Asr', nameEn: 'Asr' },
    { key: 'maghrib' as keyof NotificationPreferences, name: lang === 'ar' ? 'المغرب' : 'Maghrib', nameEn: 'Maghrib' },
    { key: 'isha' as keyof NotificationPreferences, name: lang === 'ar' ? 'العشاء' : 'Isha', nameEn: 'Isha' }
  ];

  const soundOptions = [
    { value: 'default', label: lang === 'ar' ? 'الافتراضي' : 'Default' },
    { value: 'adhan', label: lang === 'ar' ? 'أذان' : 'Adhan' },
    { value: 'silent', label: lang === 'ar' ? 'صامت' : 'Silent' }
  ];

  const handleToggle = (key: keyof NotificationPreferences, newValue: boolean) => {
    onChange({ [key]: newValue });
  };

  const handleOffsetChange = (minutes: number) => {
    onChange({ offsetMinutes: minutes });
  };

  const handleSoundChange = (sound: 'default' | 'adhan' | 'silent') => {
    onChange({ sound });
  };

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {lang === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {lang === 'ar' 
                ? 'تفعيل أو إلغاء جميع إشعارات مواقيت الصلاة'
                : 'Enable or disable all prayer time notifications'
              }
            </p>
          </div>
          
          <button
            onClick={() => handleToggle('enabled', !value.enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value.enabled 
                  ? (lang === 'ar' ? 'translate-x-1' : 'translate-x-6')
                  : (lang === 'ar' ? 'translate-x-6' : 'translate-x-1')
              }`}
            />
          </button>
        </div>
      </div>

      {/* Individual Prayer Toggles */}
      {value.enabled && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {lang === 'ar' ? 'أوقات الصلاة' : 'Prayer Times'}
          </h3>
          
          <div className="space-y-4">
            {prayerNames.map(({ key, name }) => (
              <div key={key} className="flex items-center justify-between" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div>
                  <span className="text-gray-900 font-medium">{name}</span>
                </div>
                
                <button
                  onClick={() => handleToggle(key, !value[key])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value[key] ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value[key] 
                        ? (lang === 'ar' ? 'translate-x-1' : 'translate-x-6')
                        : (lang === 'ar' ? 'translate-x-6' : 'translate-x-1')
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification Offset */}
      {value.enabled && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {lang === 'ar' ? 'توقيت الإشعار' : 'Notification Timing'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'ar' 
                  ? `إشعار قبل موعد الصلاة بـ ${value.offsetMinutes} دقيقة`
                  : `Notify ${value.offsetMinutes} minutes before prayer time`
                }
              </label>
              
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={value.offsetMinutes}
                onChange={(e) => handleOffsetChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{lang === 'ar' ? 'فوراً' : 'Now'}</span>
                <span>{lang === 'ar' ? '30 دقيقة' : '30 min'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sound Settings */}
      {value.enabled && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {lang === 'ar' ? 'إعدادات الصوت' : 'Sound Settings'}
          </h3>
          
          <div className="space-y-4">
            {/* Sound Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'ar' ? 'نوع الصوت' : 'Notification Sound'}
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {soundOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSoundChange(option.value as any)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      value.sound === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vibration Toggle */}
            <div className="flex items-center justify-between" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <div>
                <span className="text-gray-900 font-medium">
                  {lang === 'ar' ? 'الاهتزاز' : 'Vibration'}
                </span>
                <p className="text-sm text-gray-500">
                  {lang === 'ar' ? 'اهتزاز الجهاز عند الإشعار' : 'Vibrate device on notification'}
                </p>
              </div>
              
              <button
                onClick={() => handleToggle('vibration', !value.vibration)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value.vibration ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value.vibration 
                      ? (lang === 'ar' ? 'translate-x-1' : 'translate-x-6')
                      : (lang === 'ar' ? 'translate-x-6' : 'translate-x-1')
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {value.enabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h4 className="font-semibold text-amber-800 mb-2">
            {lang === 'ar' ? 'معاينة الإشعار' : 'Notification Preview'}
          </h4>
          <div className="bg-white rounded-lg p-3 border border-amber-200">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">🕌</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {lang === 'ar' ? 'حان وقت صلاة الظهر' : 'Dhuhr Prayer Time'}
                </p>
                <p className="text-sm text-gray-600">
                  {lang === 'ar' 
                    ? `في ${value.offsetMinutes} دقيقة - 12:30 ص`
                    : `In ${value.offsetMinutes} minutes - 12:30 PM`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default NotificationSettings;
