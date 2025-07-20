import React from 'react';
import type { TFunction } from 'i18next';
import { LocationError } from '../../services/LocationService';
import { useTranslation } from '../../i18n/I18nProvider';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onManualInput: () => void;
  error: LocationError | null;
  t?: TFunction; // Make this optional since we'll use our own
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  onManualInput,
  error,
  t: parentT // Rename to avoid conflict
}) => {
  // Use our own translation hook with location namespace
  const { t, i18n } = useTranslation('location');
  
  if (!isOpen) return null;

  const getErrorTitle = () => {
    if (!error) return t('errors.generic');
    switch (error.code) {
      case 1:
        return t('errors.permission_denied');
      case 2:
        return t('errors.unavailable');
      case 3:
        return t('errors.timeout');
      default:
        return t('errors.generic');
    }
  };

  const getErrorMessage = () => {
    return error?.message || t('errors.generic');
  };

  const getActionButtons = () => {
    if (!error) return null;

    switch (error.code) {
      case 1: // Permission denied
        return (
          <div className="flex flex-col gap-3">
            <button
              onClick={onManualInput}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200"
            >
              {t('buttons.manual_location')}
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-400 transition-colors duration-200"
            >
              {i18n.t('common.buttons.cancel')}
            </button>
          </div>
        );
      case 2: // Position unavailable
        return (
          <div className="flex flex-col gap-3">
            <button
              onClick={onManualInput}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200"
            >
              {t('buttons.manual_location')}
            </button>
            <button
              onClick={onRetry}
              className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-green-700 transition-colors duration-200"
            >
              {i18n.t('common.buttons.retry')}
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-400 transition-colors duration-200"
            >
              {i18n.t('common.buttons.cancel')}
            </button>
          </div>
        );
      case 3: // Timeout
        return (
          <div className="flex flex-col gap-3">
            <button
              onClick={onRetry}
              className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-green-700 transition-colors duration-200"
            >
              {i18n.t('common.buttons.retry')}
            </button>
            <button
              onClick={onManualInput}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200"
            >
              {t('buttons.manual_location')}
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-400 transition-colors duration-200"
            >
              {i18n.t('common.buttons.cancel')}
            </button>
          </div>
        );
      default:
        return (
          <div className="flex flex-col gap-3">
            <button
              onClick={onManualInput}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200"
            >
              {t('buttons.manual_location')}
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-400 transition-colors duration-200"
            >
              {i18n.t('common.buttons.cancel')}
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {getErrorTitle()}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {getErrorMessage()}
          </p>
        </div>

        {error?.code === 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              {t('errors.permission_help')}
            </p>
          </div>
        )}

        {getActionButtons()}
      </div>
    </div>
  );
};

export default LocationPermissionModal;