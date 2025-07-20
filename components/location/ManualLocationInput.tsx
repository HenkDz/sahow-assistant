/// <reference types="@types/google.maps" />

import React, { useState, useEffect, useRef } from 'react';
import { Location } from '../../types';
import { useTranslation } from '../../i18n/I18nProvider';
import { APIProvider, Map, AdvancedMarker, MapMouseEvent, useMapsLibrary } from '@vis.gl/react-google-maps';

interface ManualLocationInputProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: (location: Location) => void;
  initialLocation?: Location;
}

const AutocompleteInput = ({ onPlaceChanged, initialValue }: { onPlaceChanged: (place: google.maps.places.PlaceResult) => void, initialValue: string }) => {
  const { t } = useTranslation('location');
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const ac = new places.Autocomplete(inputRef.current, {
      types: ['(cities)'],
    });

    setAutocomplete(ac);
  }, [places]);

  useEffect(() => {
    if (!autocomplete) return;

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        onPlaceChanged(place);
        setValue(place.formatted_address || '');
      }
    });

    return () => {
        listener.remove();
    };
  }, [onPlaceChanged, autocomplete]);


  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
      placeholder={t('placeholders.city')}
    />
  );
};

const ManualLocationInput: React.FC<ManualLocationInputProps> = ({
  isOpen,
  onClose,
  onLocationSet,
  initialLocation
}) => {
  const { t } = useTranslation('location');
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

  const [latitude, setLatitude] = useState(initialLocation?.latitude || 30.0444);
  const [longitude, setLongitude] = useState(initialLocation?.longitude || 31.2357);
  const [useCoordinates, setUseCoordinates] = useState(!!(initialLocation?.latitude && initialLocation?.longitude));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [inputValue, setInputValue] = useState('');
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isAutocompleteSuggestion = (target as HTMLElement).closest('.pac-container');

      if (modalContentRef.current && !modalContentRef.current.contains(target) && !isAutocompleteSuggestion) {
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
      setLatitude(initialLocation.latitude || 30.0444);
      setLongitude(initialLocation.longitude || 31.2357);
      setInputValue(initialLocation.city ? `${initialLocation.city}, ${initialLocation.country}` : '');
    }
  }, [initialLocation]);

  if (!isOpen) return null;

  const handlePlaceChanged = (place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place);
    setInputValue(place.formatted_address || '');
    if (place.geometry?.location) {
      setLatitude(place.geometry.location.lat());
      setLongitude(place.geometry.location.lng());
      setUseCoordinates(true);
    }
  };

  const handleMapClick = (event: MapMouseEvent) => {
    if (event.detail.latLng) {
      const { lat, lng } = event.detail.latLng;
      setLatitude(lat);
      setLongitude(lng);
      setUseCoordinates(true);
      setSelectedPlace(null); 
      setInputValue(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedPlace && !useCoordinates) {
        newErrors.city = t('validation.city_required');
    }

    if (useCoordinates) {
      const lat = parseFloat(latitude.toString());
      const lng = parseFloat(longitude.toString());

      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = t('validation.invalid_latitude');
      }

      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = t('validation.invalid_longitude');
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

    let city = '';
    let country = '';
    const lat = latitude;
    const lng = longitude;

    if (selectedPlace) {
        const addressComponents = selectedPlace.address_components;
        if (addressComponents) {
            for (const component of addressComponents) {
                if (component.types.includes('locality')) {
                city = component.long_name;
                }
                if (component.types.includes('country')) {
                country = component.long_name;
                }
            }
        }
    }

    if ((!city || !country) && selectedPlace?.formatted_address) {
        const parts = selectedPlace.formatted_address.split(',');
        city = city || parts[0]?.trim();
        country = country || parts[parts.length - 1]?.trim();
    }

    onLocationSet({
      city,
      country,
      latitude: lat,
      longitude: lng,
    });
    onClose();
  };

  const handleReset = () => {
    setLatitude(initialLocation?.latitude || 30.0444);
    setLongitude(initialLocation?.longitude || 31.2357);
    setUseCoordinates(!!(initialLocation?.latitude && initialLocation?.longitude));
    setSelectedPlace(null);
    setInputValue(initialLocation?.city ? `${initialLocation.city}, ${initialLocation.country}` : '');
    setErrors({});
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
          <APIProvider apiKey={apiKey} libraries={['places']}>
            <div className="relative">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                {t('labels.city')} *
              </label>
              <AutocompleteInput onPlaceChanged={handlePlaceChanged} initialValue={inputValue} />
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            <div className="h-64 w-full rounded-lg overflow-hidden">
                <Map
                  center={{ lat: latitude, lng: longitude }}
                  zoom={9}
                  onClick={handleMapClick}
                  mapId="sahow-assistant-map"
                >
                  <AdvancedMarker position={{ lat: latitude, lng: longitude }} />
                </Map>
            </div>
          </APIProvider>
          
          {/* Coordinates Toggle & Inputs */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useCoordinates"
              checked={useCoordinates}
              onChange={(e) => setUseCoordinates(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="useCoordinates" className="ml-2 block text-sm text-gray-700">
              {t('manual.use_coordinates')}
            </label>
          </div>

          {useCoordinates && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('labels.latitude')}
                </label>
                <input
                  type="number"
                  id="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
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
                  {t('labels.longitude')}
                </label>
                <input
                  type="number"
                  id="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
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
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
            >
              {t('common:buttons.reset', 'Reset')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
            >
              {t('common:buttons.cancel', 'Cancel')}
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              {t('buttons.set_location')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualLocationInput;