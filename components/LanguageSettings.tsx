import React from 'react';
import { Language } from '../types';
import { useUserPreferencesStore } from '../stores/userPreferencesStore';

interface LanguageSettingsProps {
  value: Language;
  onChange: (language: Language) => void;
  lang: Language;
}

const LanguageSettings: React.FC<LanguageSettingsProps> = ({ 
  value, 
  onChange, 
  lang 
}) => {
  const { setLanguage } = useUserPreferencesStore();

  const languageOptions = [
    { 
      value: 'en' as Language, 
      label: 'English',
      nativeLabel: 'English',
      flag: '🇺🇸',
      description: 'English language interface'
    },
    { 
      value: 'ar' as Language, 
      label: 'Arabic',
      nativeLabel: 'العربية',
      flag: '🇸🇦',
      description: 'واجهة باللغة العربية'
    }
  ];

  const handleLanguageChange = async (language: Language) => {
    try {
      // Use the store method for instant language change
      await setLanguage(language);
      // Also call the onChange prop for compatibility
      onChange(language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Language Switcher */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {lang === 'ar' ? 'التبديل السريع للغة' : 'Quick Language Switch'}
        </h3>
        
        <div className="relative flex items-center bg-gray-100 p-1 rounded-full shadow-inner" dir="ltr">
          <div
            className="absolute top-1 left-1 w-[90px] h-[calc(100%-8px)] bg-blue-600 rounded-full shadow transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(${value === 'ar' ? '90px' : '0px'})` }}
          />
          <button
            onClick={() => handleLanguageChange('en')}
            className={`w-[90px] px-2 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 focus:outline-none relative z-10 ${
              value === 'en' ? 'text-white' : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            English
          </button>
          <button
            onClick={() => handleLanguageChange('ar')}
            className={`w-[90px] px-2 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 focus:outline-none relative z-10 ${
              value === 'ar' ? 'text-white' : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            العربية
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mt-3 text-center">
          {lang === 'ar' 
            ? 'سيتم تطبيق تغيير اللغة فوراً في جميع أنحاء التطبيق'
            : 'Language changes will be applied instantly throughout the app'
          }
        </p>
      </div>

      {/* Language Selection */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {lang === 'ar' ? 'اختيار اللغة التفصيلي' : 'Detailed Language Selection'}
        </h3>
        
        <div className="space-y-3">
          {languageOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleLanguageChange(option.value)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                value === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="text-2xl">{option.flag}</div>
                  <div className="text-left rtl:text-right">
                    <p className="font-semibold text-gray-900 text-lg">
                      {option.nativeLabel}
                    </p>
                    <p className="text-sm text-gray-600">
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
                
                {value === option.value && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Language Information */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h4 className="font-semibold text-amber-800 mb-3">
          {lang === 'ar' ? 'معلومات اللغة' : 'Language Information'}
        </h4>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <div className="w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">ℹ</span>
            </div>
            <div>
              <p className="text-amber-800">
                {lang === 'ar' 
                  ? 'يدعم التطبيق اللغتين العربية والإنجليزية بشكل كامل'
                  : 'The app fully supports both Arabic and English languages'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <div className="w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">🔄</span>
            </div>
            <div>
              <p className="text-amber-800">
                {lang === 'ar' 
                  ? 'تغيير اللغة يؤثر على جميع النصوص والتواريخ والأرقام'
                  : 'Language changes affect all text, dates, and numbers'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 rtl:space-x-reverse">
            <div className="w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">📱</span>
            </div>
            <div>
              <p className="text-amber-800">
                {lang === 'ar' 
                  ? 'اللغة العربية تدعم الكتابة من اليمين إلى اليسار'
                  : 'Arabic language supports right-to-left text direction'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-800 mb-4">
          {lang === 'ar' ? 'معاينة اللغة' : 'Language Preview'}
        </h4>
        
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="space-y-3" dir={value === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header Preview */}
            <div className="pb-3 border-b border-gray-200">
              <h5 className="font-semibold text-gray-900">
                {value === 'ar' ? 'مواقيت الصلاة' : 'Prayer Times'}
              </h5>
              <p className="text-sm text-gray-600">
                {value === 'ar' ? 'اليوم الأحد، 15 رمضان 1445' : 'Sunday, 15 Ramadan 1445'}
              </p>
            </div>
            
            {/* Prayer Times Preview */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">
                  {value === 'ar' ? 'الفجر' : 'Fajr'}
                </span>
                <span className="font-mono text-gray-900">
                  {value === 'ar' ? '٥:٣٠' : '5:30'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">
                  {value === 'ar' ? 'الظهر' : 'Dhuhr'}
                </span>
                <span className="font-mono text-gray-900">
                  {value === 'ar' ? '١٢:٣٠' : '12:30'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-700">
                  {value === 'ar' ? 'العصر' : 'Asr'}
                </span>
                <span className="font-mono text-gray-900">
                  {value === 'ar' ? '٤:١٥' : '4:15'}
                </span>
              </div>
            </div>
            
            {/* Button Preview */}
            <div className="pt-3 border-t border-gray-200">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                {value === 'ar' ? 'عرض التفاصيل' : 'View Details'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-blue-700">
          <p>
            {lang === 'ar' 
              ? 'هذه معاينة لكيفية ظهور التطبيق باللغة المختارة'
              : 'This is a preview of how the app will appear in the selected language'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default LanguageSettings;
