import React from 'react';
import { Madhab, Language } from '../../types';
import { SettingsService } from '../../services/SettingsService';
import { useTranslation } from '../../i18n/I18nProvider';

interface MadhabSelectorProps {
  value: Madhab;
  onChange: (madhab: Madhab) => void;
  lang: Language;
  calculationMethod?: any;
  onCalculationMethodChange?: (method: any) => void;
}

const MadhabSelector: React.FC<MadhabSelectorProps> = ({ 
  value, 
  onChange, 
  lang
}) => {
  const { t: translate } = useTranslation('settings');
  const madhabs = [Madhab.HANAFI, Madhab.SHAFI, Madhab.MALIKI, Madhab.HANBALI];

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6 ${lang === 'ar' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {lang === 'ar' ? 'المذهب الفقهي' : 'Islamic Jurisprudence School (Madhab)'}
      </h3>
      
      <p className="text-sm text-gray-600 mb-6">
        {lang === 'ar' 
          ? 'يؤثر المذهب على حساب وقت صلاة العصر'
          : 'The madhab affects the calculation of Asr prayer time'
        }
      </p>

      <div className="space-y-3">
        {madhabs.map((madhab) => {
          const madhabKey = SettingsService.getMadhabKey(madhab);
          const isSelected = value === madhab;
          
          return (
            <button
              key={madhab}
              onClick={() => onChange(madhab)}
              className={`w-full p-4 rounded-lg border-2 transition-all ${lang === 'ar' ? 'text-right' : 'text-left'} transform hover:scale-[1.02] ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-sm'
              }`}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className={`flex items-center justify-between ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div>
                  <h4 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {translate(`madhabs.${madhabKey}.name`)}
                  </h4>
                  <p className={`text-sm mt-1 ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                    {translate(`madhabs.${madhabKey}.asr_calculation`)}
                  </p>
                  <p className={`text-xs mt-2 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                    {translate(`madhabs.${madhabKey}.description`)}
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

      <div className={`mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg ${lang === 'ar' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <h4 className="font-semibold text-amber-800 mb-2">
          {lang === 'ar' ? 'معلومة مهمة' : 'Important Information'}
        </h4>
        <p className="text-sm text-amber-700">
          {lang === 'ar' 
            ? 'المذهب الحنفي يحسب صلاة العصر عندما يصبح الظل مساوياً لطول الجسم مضافاً إليه الظل الأصلي. باقي المذاهب تحسب العصر عندما يساوي الظل طول الجسم.'
            : 'Hanafi madhab calculates Asr when shadow equals object height plus original shadow. Other madhabs calculate Asr when shadow equals object height.'
          }
        </p>
      </div>
    </div>
  );
};

export default MadhabSelector;
