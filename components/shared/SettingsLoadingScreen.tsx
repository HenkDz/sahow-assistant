import React from 'react';
import { useTranslation } from '../../i18n/I18nProvider';

interface SettingsLoadingScreenProps {
  error?: Error | null;
  onRetry?: () => void;
}

export const SettingsLoadingScreen: React.FC<SettingsLoadingScreenProps> = ({ 
  error, 
  onRetry 
}) => {
  const { t, isRTL } = useTranslation();

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4 ${isRTL ? 'font-[Tajawal]' : 'font-[Inter]'}`}>
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('settings.loading.error.title', 'Settings Loading Error')}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {t('settings.loading.error.message', 'Failed to load your settings. The app will use default settings.')}
          </p>
          
          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                {t('settings.loading.error.retry', 'Try Again')}
              </button>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              {t('settings.loading.error.reload', 'Reload App')}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            {t('settings.loading.error.details', 'Error')}: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 ${isRTL ? 'font-[Tajawal]' : 'font-[Inter]'}`}>
      <div className="text-center">
        {/* Loading spinner */}
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
        
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {t('settings.loading.title', 'Loading Settings')}
        </h2>
        
        <p className="text-gray-600">
          {t('settings.loading.message', 'Please wait while we load your preferences...')}
        </p>
      </div>
    </div>
  );
};