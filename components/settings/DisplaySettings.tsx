import React from 'react';
import { Language } from '../../types';
import { DisplayPreferences } from '../../services/SettingsService';

interface DisplaySettingsProps {
  value: DisplayPreferences;
  onChange: (display: Partial<DisplayPreferences>) => void;
  lang: Language;
}

const DisplaySettings: React.FC<DisplaySettingsProps> = ({ 
  value, 
  onChange, 
  lang 
}) => {
  const themeOptions = [
    { 
      value: 'light', 
      label: lang === 'ar' ? 'فاتح' : 'Light',
      description: lang === 'ar' ? 'مظهر فاتح مريح للعين' : 'Comfortable light appearance',
      preview: 'bg-white border-gray-200'
    },
    { 
      value: 'dark', 
      label: lang === 'ar' ? 'داكن' : 'Dark',
      description: lang === 'ar' ? 'مظهر داكن يوفر البطارية' : 'Dark appearance that saves battery',
      preview: 'bg-gray-900 border-gray-700'
    },
    { 
      value: 'auto', 
      label: lang === 'ar' ? 'تلقائي' : 'Auto',
      description: lang === 'ar' ? 'يتغير حسب إعدادات النظام' : 'Changes based on system settings',
      preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-400'
    }
  ];

  const fontSizeOptions = [
    { value: 'small', label: lang === 'ar' ? 'صغير' : 'Small', size: 'text-sm' },
    { value: 'medium', label: lang === 'ar' ? 'متوسط' : 'Medium', size: 'text-base' },
    { value: 'large', label: lang === 'ar' ? 'كبير' : 'Large', size: 'text-lg' }
  ];

  const timeFormatOptions = [
    { value: false, label: lang === 'ar' ? '12 ساعة (صباحاً/مساءً)' : '12 Hour (AM/PM)', example: '2:30 PM' },
    { value: true, label: lang === 'ar' ? '24 ساعة' : '24 Hour', example: '14:30' }
  ];

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    onChange({ theme });
  };

  const handleFontSizeChange = (fontSize: 'small' | 'medium' | 'large') => {
    onChange({ fontSize });
  };

  const handleShow24HourChange = (show24Hour: boolean) => {
    onChange({ show24Hour });
  };

  const handleToggle = (key: keyof DisplayPreferences, newValue: boolean) => {
    onChange({ [key]: newValue });
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {lang === 'ar' ? 'المظهر' : 'Theme'}
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleThemeChange(option.value as any)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                value.theme === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className={`w-8 h-8 rounded-full border-2 ${option.preview}`} />
                    <div>
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                </div>
                
                {value.theme === option.value && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {lang === 'ar' ? 'حجم الخط' : 'Font Size'}
        </h3>
        
        <div className="space-y-3">
          {fontSizeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFontSizeChange(option.value as any)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                value.fontSize === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <span className={`${option.size} font-medium text-gray-900`}>
                    {option.label}
                  </span>
                  <span className={`${option.size} text-gray-600`}>
                    {lang === 'ar' ? 'نص تجريبي' : 'Sample Text'}
                  </span>
                </div>
                
                {value.fontSize === option.value && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Format */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {lang === 'ar' ? 'تنسيق الوقت' : 'Time Format'}
        </h3>
        
        <div className="space-y-3">
          {timeFormatOptions.map((option) => (
            <button
              key={option.value.toString()}
              onClick={() => handleShow24HourChange(option.value)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                value.show24Hour === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {lang === 'ar' ? 'مثال: ' : 'Example: '}
                    <span className="font-mono">{option.example}</span>
                  </p>
                </div>
                
                {value.show24Hour === option.value && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Display Options */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {lang === 'ar' ? 'خيارات العرض' : 'Display Options'}
        </h3>
        
        <div className="space-y-4">
          {/* Show Seconds */}
          <div className="flex items-center justify-between" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div>
              <span className="text-gray-900 font-medium">
                {lang === 'ar' ? 'إظهار الثواني' : 'Show Seconds'}
              </span>
              <p className="text-sm text-gray-500">
                {lang === 'ar' ? 'عرض الثواني في مواقيت الصلاة' : 'Display seconds in prayer times'}
              </p>
            </div>
            
            <button
              onClick={() => handleToggle('showSeconds', !value.showSeconds)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value.showSeconds ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value.showSeconds 
                    ? (lang === 'ar' ? 'translate-x-1' : 'translate-x-6')
                    : (lang === 'ar' ? 'translate-x-6' : 'translate-x-1')
                }`}
              />
            </button>
          </div>

          {/* Show Hijri Date */}
          <div className="flex items-center justify-between" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div>
              <span className="text-gray-900 font-medium">
                {lang === 'ar' ? 'إظهار التاريخ الهجري' : 'Show Hijri Date'}
              </span>
              <p className="text-sm text-gray-500">
                {lang === 'ar' ? 'عرض التاريخ الهجري مع التاريخ الميلادي' : 'Display Islamic date alongside Gregorian date'}
              </p>
            </div>
            
            <button
              onClick={() => handleToggle('showHijriDate', !value.showHijriDate)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value.showHijriDate ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value.showHijriDate 
                    ? (lang === 'ar' ? 'translate-x-1' : 'translate-x-6')
                    : (lang === 'ar' ? 'translate-x-6' : 'translate-x-1')
                }`}
              />
            </button>
          </div>

          {/* Show Qibla Distance */}
          <div className="flex items-center justify-between" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div>
              <span className="text-gray-900 font-medium">
                {lang === 'ar' ? 'إظهار المسافة للقبلة' : 'Show Qibla Distance'}
              </span>
              <p className="text-sm text-gray-500">
                {lang === 'ar' ? 'عرض المسافة إلى الكعبة المشرفة' : 'Display distance to Kaaba'}
              </p>
            </div>
            
            <button
              onClick={() => handleToggle('showQiblaDistance', !value.showQiblaDistance)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value.showQiblaDistance ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value.showQiblaDistance 
                    ? (lang === 'ar' ? 'translate-x-1' : 'translate-x-6')
                    : (lang === 'ar' ? 'translate-x-6' : 'translate-x-1')
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-800 mb-4">
          {lang === 'ar' ? 'معاينة' : 'Preview'}
        </h4>
        
        <div className={`bg-white rounded-lg p-4 border border-blue-200 ${
          value.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`font-medium ${
                value.fontSize === 'small' ? 'text-sm' :
                value.fontSize === 'medium' ? 'text-base' :
                value.fontSize === 'large' ? 'text-lg' : 'text-xl'
              }`}>
                {lang === 'ar' ? 'صلاة الظهر' : 'Dhuhr Prayer'}
              </span>
              <span className={`font-mono ${
                value.fontSize === 'small' ? 'text-sm' :
                value.fontSize === 'medium' ? 'text-base' : 'text-lg'
              }`}>
                {value.show24Hour ? '12:30' : '12:30 PM'}
                {value.showSeconds && ':45'}
              </span>
            </div>
            
            {value.showHijriDate && (
              <div className={`text-sm ${value.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {lang === 'ar' ? '15 رمضان 1445' : '15 Ramadan 1445'}
              </div>
            )}
            
            {value.showQiblaDistance && (
              <div className={`text-sm ${value.theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`}>
                {lang === 'ar' ? 'المسافة: 1,230 كم' : 'Distance: 1,230 km'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplaySettings;
