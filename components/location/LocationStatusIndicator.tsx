import React from 'react';
import { Location } from '../../types';

interface LocationStatusIndicatorProps {
  location: Location | null;
  isGpsLocation: boolean;
  isLoading: boolean;
  onLocationClick?: () => void;
  t: Record<string, string>;
  className?: string;
}

const LocationStatusIndicator: React.FC<LocationStatusIndicatorProps> = ({
  location,
  isGpsLocation,
  isLoading,
  onLocationClick,
  t,
  className = ''
}) => {
  const getLocationIcon = () => {
    if (isLoading) {
      return (
        <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }

    if (isGpsLocation) {
      return (
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    );
  };

  const getStatusText = () => {
    if (isLoading) {
      return t.location_loading || 'Getting location...';
    }

    if (!location) {
      return t.location_not_set || 'Location not set';
    }

    if (isGpsLocation) {
      return t.location_gps || 'GPS Location';
    }

    return t.location_manual || 'Manual Location';
  };

  const getLocationText = () => {
    if (!location) return '';
    
    if (location.city && location.country) {
      return `${location.city}, ${location.country}`;
    }
    
    if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
    
    return t.location_unknown || 'Unknown location';
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-blue-50 border-blue-200';
    if (!location) return 'bg-gray-50 border-gray-200';
    if (isGpsLocation) return 'bg-green-50 border-green-200';
    return 'bg-orange-50 border-orange-200';
  };

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor()} ${
        onLocationClick ? 'cursor-pointer hover:shadow-sm transition-shadow duration-200' : ''
      } ${className}`}
      onClick={onLocationClick}
    >
      <div className="flex-shrink-0">
        {getLocationIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {getStatusText()}
          </span>
          {location && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              isGpsLocation 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {isGpsLocation ? (t.status_gps || 'GPS') : (t.status_manual || 'Manual')}
            </span>
          )}
        </div>
        
        {location && (
          <p className="text-xs text-gray-600 truncate mt-1">
            {getLocationText()}
          </p>
        )}
        
        {!location && !isLoading && (
          <p className="text-xs text-gray-500 mt-1">
            {t.location_tap_to_set || 'Tap to set your location'}
          </p>
        )}
      </div>

      {onLocationClick && (
        <div className="flex-shrink-0">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default LocationStatusIndicator;