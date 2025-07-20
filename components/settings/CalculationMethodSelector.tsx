import React from 'react';
import { CalculationMethod, Language } from '../../types';
import { SettingsService } from '../../services/SettingsService';
import { useTranslation } from '../../i18n/I18nProvider';

interface CalculationMethodSelectorProps {
  value: CalculationMethod;
  onChange: (method: CalculationMethod) => void;
  lang: Language;
}

const CalculationMethodSelector: React.FC<CalculationMethodSelectorProps> = ({ 
  value, 
  onChange, 
  lang
}) => {
  const { t: translate } = useTranslation('settings');
  
  const methods = [
    CalculationMethod.ISNA,
    CalculationMethod.MWL,
    CalculationMethod.EGYPT,
    CalculationMethod.MAKKAH,
    CalculationMethod.KARACHI,
    CalculationMethod.TEHRAN,
    CalculationMethod.JAFARI
  ];

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${lang === 'ar' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {lang === 'ar' ? 'طريقة حساب مواقيت الصلاة' : 'Prayer Time Calculation Method'}
      </h3>
      
      <p className="text-sm text-gray-600 mb-6">
        {lang === 'ar' 
          ? 'اختر طريقة الحساب المناسبة لموقعك الجغرافي'
          : 'Choose the calculation method appropriate for your geographic location'
        }
      </p>

      <div className="space-y-3">
        {methods.map((method) => {
          const methodKey = SettingsService.getCalculationMethodKey(method);
          const isSelected = value === method;
          
          return (
            <button
              key={method}
              onClick={() => onChange(method)}
              className={`w-full p-4 rounded-lg border-2 transition-all ${lang === 'ar' ? 'text-right' : 'text-left'} transform hover:scale-[1.02] ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-sm'
              }`}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className={`flex items-center space-x-3 rtl:space-x-reverse mb-2 ${lang === 'ar' ? 'justify-end' : 'justify-start'}`}>
                    <h4 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {translate(`calculation_methods.${methodKey}.name`)}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {translate(`calculation_methods.${methodKey}.region`)}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                    {translate(`calculation_methods.${methodKey}.description`)}
                  </p>
                </div>
                
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${lang === 'ar' ? 'ml-4' : 'mr-4'} ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500 scale-110'
                    : 'border-gray-300 bg-white'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className={`mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg ${lang === 'ar' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <h4 className="font-semibold text-blue-800 mb-2">
          {lang === 'ar' ? 'نصيحة' : 'Recommendation'}
        </h4>
        <p className="text-sm text-blue-700">
          {lang === 'ar' 
            ? 'يُنصح باستخدام طريقة الحساب المناسبة للمنطقة الجغرافية التي تقيم فيها للحصول على أوقات صلاة أكثر دقة.'
            : 'It is recommended to use the calculation method appropriate for your geographic region for more accurate prayer times.'
          }
        </p>
      </div>
    </div>
  );
};

export default CalculationMethodSelector;
