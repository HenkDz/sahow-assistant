/// <reference types="@types/google.maps" />

import React, { useState, useEffect, useRef } from 'react';
import { Location } from '../../types';
import { useTranslation } from '../../i18n/I18nProvider';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, MapMouseEvent } from '@vis.gl/react-google-maps';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

interface ManualLocationInputProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: (location: Location) => void;
  initialLocation?: Location;
}

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
  const modalContentRef = useRef<HTMLDivElement>(null);

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here */
    },
    debounce: 300,
  });

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
      setLatitude(initialLocation.latitude || 30.0444);
      setLongitude(initialLocation.longitude || 31.2357);
      setValue(initialLocation.city ? `${initialLocation.city}, ${initialLocation.country}` : '', false);
    }
  }, [initialLocation, setValue]);


  if (!isOpen) return null;

  const handleSelect = ({ description }: { description: string }) => () => {
    setValue(description, false);
    clearSuggestions();

    getGeocode({ address: description })
      .then((results: google.maps.GeocoderResult[]) => {
        const { lat, lng } = getLatLng(results[0]);
        setLatitude(lat);
        setLongitude(lng);
        setUseCoordinates(true);
      })
      .catch((error: any) => {
        console.log('Error: ', error);
      });
  };

  const handleMapClick = (event: MapMouseEvent) => {
    if (event.detail.latLng) {
      const { lat, lng } = event.detail.latLng;
      setLatitude(lat);
      setLongitude(lng);
      setUseCoordinates(true);

      getGeocode({ location: { lat, lng } })
        .then((results: google.maps.GeocoderResult[]) => {
          if (results[0]) {
            setValue(results[0].formatted_address, false);
          }
        })
        .catch((error: any) => {
          console.log('Error: ', error);
        });
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!value.trim()) {
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

    // Extract city and country from the full address
    let city = '';
    let country = '';
    const addressParts = value.split(',');
    if (addressParts.length > 1) {
      city = addressParts[0].trim();
      country = addressParts[addressParts.length - 1].trim();
    } else {
      city = value;
    }

    onLocationSet({
      city,
      country,
      latitude,
      longitude,
    });
    onClose();
  };

  const handleReset = () => {
    setLatitude(initialLocation?.latitude || 30.0444);
    setLongitude(initialLocation?.longitude || 31.2357);
    setUseCoordinates(!!(initialLocation?.latitude && initialLocation?.longitude));
    setValue(initialLocation?.city ? `${initialLocation.city}, ${initialLocation.country}` : '', false);
    setErrors({});
  };

  const renderSuggestions = () => (
    <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg border z-10">
      {data.map((suggestion: google.maps.places.AutocompletePrediction) => {
        const {
          place_id,
          structured_formatting: { main_text, secondary_text },
        } = suggestion;

        return (
          <div
            key={place_id}
            onClick={handleSelect(suggestion)}
            className="p-3 hover:bg-gray-100 cursor-pointer"
          >
            <strong>{main_text}</strong> <small>{secondary_text}</small>
          </div>
        );
      })}
    </div>
  );

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
          <div className="relative">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              {t('labels.city')} *
            </label>
            <input
              id="city"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!ready}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={t('placeholders.city')}
            />
            {status === 'OK' && renderSuggestions()}
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>

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