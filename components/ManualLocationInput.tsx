import React, { useState } from 'react';
import { Location } from '../types';

interface ManualLocationInputProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: (location: Location) => void;
  t: Record<string, string>;
  initialLocation?: Location;
}

const ManualLocationInput: React.FC<ManualLocationInputProps> = ({
  isOpen,
  onClose,
  onLocationSet,
  t,
  initialLocation
}) => {
  const [city, setCity] = useState(initialLocation?.city || '');
  const [country, setCountry] = useState(initialLocation?.country || '');
  const [latitude, setLatitude] = useState(initialLocation?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(initialLocation?.longitude?.toString() || '');
  const [useCoordinates, setUseCoordinates] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!city.trim()) {
      newErrors.city = t.error_city_required || 'City is required';
    }

    if (!country.trim()) {
      newErrors.country = t.error_country_required || 'Country is required';
    }

    if (useCoordinates) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = t.error_invalid_latitude || 'Latitude must be between -90 and 90';
      }

      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = t.error_invalid_longitude || 'Longitude must be between -180 and 180';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const location: Location = {
      city: city.trim(),
      country: country.trim(),
      latitude: useCoordinates ? parseFloat(latitude) : 0,
      longitude: useCoordinates ? parseFloat(longitude) : 0
    };

    onLocationSet(location);
    onClose();
  };

  const handleReset = () => {
    setCity('');
    setCountry('');
    setLatitude('');
    setLongitude('');
    setUseCoordinates(false);
    setErrors({});
  };

  // Common Islamic cities for quick selection
  const commonCities = [
    { city: 'Mecca', country: 'Saudi Arabia', lat: 21.4225, lng: 39.8262 },
    { city: 'Medina', country: 'Saudi Arabia', lat: 24.4539, lng: 39.6040 },
    { city: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
    { city: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
    { city: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
    { city: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
    { city: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869 },
    { city: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 }
  ];

  const handleQuickSelect = (selectedCity: typeof commonCities[0]) => {
    setCity(selectedCity.city);
    setCountry(selectedCity.country);
    setLatitude(selectedCity.lat.toString());
    setLongitude(selectedCity.lng.toString());
    setUseCoordinates(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t.manual_location_title || 'Set Your Location'}
          </h3>
          <p className="text-gray-600 text-sm">
            {t.manual_location_desc || 'Enter your city and country to get accurate prayer times.'}
          </p>
        </div>

        {/* Quick Select Cities */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {t.quick_select_cities || 'Quick Select'}
          </h4>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {commonCities.map((cityData, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleQuickSelect(cityData)}
                className="text-left p-2 text-xs bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors duration-200 border hover:border-blue-200"
              >
                <div className="font-medium text-gray-900">{cityData.city}</div>
                <div className="text-gray-500">{cityData.country}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* City Input */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              {t.label_city || 'City'} *
            </label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t.placeholder_city || 'Enter your city'}
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>

          {/* Country Input */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              {t.label_country || 'Country'} *
            </label>
            <input
              type="text"
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.country ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t.placeholder_country || 'Enter your country'}
            />
            {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
          </div>

          {/* Coordinates Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useCoordinates"
              checked={useCoordinates}
              onChange={(e) => setUseCoordinates(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="useCoordinates" className="ml-2 block text-sm text-gray-700">
              {t.label_use_coordinates || 'I know the exact coordinates'}
            </label>
          </div>

          {/* Coordinates Inputs */}
          {useCoordinates && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.label_latitude || 'Latitude'}
                </label>
                <input
                  type="number"
                  id="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
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
                  {t.label_longitude || 'Longitude'}
                </label>
                <input
                  type="number"
                  id="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
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
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200"
            >
              {t.btn_set_location || 'Set Location'}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-gray-400 transition-colors duration-200"
              >
                {t.btn_reset || 'Reset'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-xl hover:bg-gray-400 transition-colors duration-200"
              >
                {t.btn_cancel || 'Cancel'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualLocationInput;