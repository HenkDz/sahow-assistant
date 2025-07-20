import React, { useState, useEffect, useRef } from 'react';
import { Location } from '../../types';
import { useTranslation } from '../../i18n/I18nProvider';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

interface SimpleLocationInputProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: (location: Location) => void;
  initialLocation?: Location;
}

const SimpleLocationInput: React.FC<SimpleLocationInputProps> = ({
  isOpen,
  onClose,
  onLocationSet,
  initialLocation
}) => {
  const { t } = useTranslation('location');
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

  const [city, setCity] = useState(initialLocation?.city || '');
  const [country, setCountry] = useState(initialLocation?.country || '');
  const [latitude, setLatitude] = useState(initialLocation?.latitude || 30.0444);
  const [longitude, setLongitude] = useState(initialLocation?.longitude || 31.2357);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (initialLocation) {
      setCity(initialLocation.city || '');
      setCountry(initialLocation.country || '');
      setLatitude(initialLocation.latitude || 30.0444);
      setLongitude(initialLocation.longitude || 31.2357);
    }
  }, [initialLocation]);

  if (!isOpen) return null;

  const handleMapClick = (event: any) => {
    if (event.detail?.latLng) {
      const { lat, lng } = event.detail.latLng;
      setLatitude(lat);
      setLongitude(lng);
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!city.trim()) {
      newErrors.city = t('validation.city_required');
    }

    if (!country.trim()) {
      newErrors.country = t('validation.country_required');
    }

    const lat = parseFloat(latitude.toString());
    const lng = parseFloat(longitude.toString());

    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.latitude = t('validation.invalid_latitude');
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.longitude = t('validation.invalid_longitude');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onLocationSet({
      city: city.trim(),
      country: country.trim(),
      latitude,
      longitude,
    });
    onClose();
  };

  const handleReset = () => {
    setCity(initialLocation?.city || '');
    setCountry(initialLocation?.country || '');
    setLatitude(initialLocation?.latitude || 30.0444);
    setLongitude(initialLocation?.longitude || 31.2357);
    setErrors({});
  };

  // Common city suggestions
  const commonCities = [
    { name: 'Mecca', country: 'Saudi Arabia', lat: 21.4225, lng: 39.8262 },
    { name: 'Medina', country: 'Saudi Arabia', lat: 24.4539, lng: 39.6040 },
    { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
    { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
    { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
    { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060 },
    { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },
    { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869 },
  ];

  const handleCitySelect = (selectedCity: typeof commonCities[0]) => {
    setCity(selectedCity.name);
    setCountry(selectedCity.country);
    setLatitude(selectedCity.lat);
    setLongitude(selectedCity.lng);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div ref={modalContentRef} className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('manual.title')}
          </h3>
          <p className="text-gray-600 text-sm">
            {t('manual.description')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common Cities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select:
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {commonCities.map((cityOption) => (
                <button
                  key={`${cityOption.name}-${cityOption.country}`}
                  type="button"
                  onClick={() => handleCitySelect(cityOption)}
                  className="text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                >
                  <div className="font-medium">{cityOption.name}</div>
                  <div className="text-gray-500 text-xs">{cityOption.country}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                {t('labels.city')} *
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('placeholders.city')}
              />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                {t('labels.country')} *
              </label>
              <input
                id="country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.country ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Country"
              />
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                {t('labels.latitude')} *
              </label>
              <input
                type="number"
                id="latitude"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                step="any"
                min="-90"
                max="90"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.latitude ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="21.4225"
              />
              {errors.latitude && <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>}
            </div>
            <div>
              <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                {t('labels.longitude')} *
              </label>
              <input
                type="number"
                id="longitude"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                step="any"
                min="-180"
                max="180"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.longitude ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="39.8262"
              />
              {errors.longitude && <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>}
            </div>
          </div>

          {/* Map */}
          {apiKey && (
            <div className="h-64 w-full rounded-lg overflow-hidden">
              <APIProvider apiKey={apiKey}>
                <Map
                  center={{ lat: latitude, lng: longitude }}
                  zoom={9}
                  onClick={handleMapClick}
                  mapId="sahow-assistant-map"
                >
                  <AdvancedMarker position={{ lat: latitude, lng: longitude }} />
                </Map>
              </APIProvider>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t('common:buttons.reset', 'Reset')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t('common:buttons.cancel', 'Cancel')}
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('buttons.set_location')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleLocationInput;