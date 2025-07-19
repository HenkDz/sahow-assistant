import React, { useState } from 'react';
import { Language, Mosque } from '../types';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  GlobeAltIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DirectionsIcon,
  ClockIcon,
  CalendarDaysIcon
} from './icons/HeroIcons';

interface MosqueCardProps {
  mosque: Mosque;
  t: Record<string, string>;
  lang: Language;
  onSelect: () => void;
  onGetDirections: () => void;
  formatDistance: (distance?: number) => string;
  showDetails?: boolean;
}

const MosqueCard: React.FC<MosqueCardProps> = ({ 
  mosque, 
  t, 
  lang, 
  onSelect, 
  onGetDirections, 
  formatDistance,
  showDetails = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const hasContactInfo = mosque.contactInfo && (
    mosque.contactInfo.phone || 
    mosque.contactInfo.email || 
    mosque.contactInfo.website
  );

  const hasPrayerTimes = mosque.prayerTimes;
  const hasSpecialEvents = mosque.specialEvents && mosque.specialEvents.length > 0;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderContactInfo = () => {
    if (!hasContactInfo) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 mb-2">
          {t.contactInfo || 'Contact Information'}
        </h4>
        
        {mosque.contactInfo?.phone && (
          <div className="flex items-center">
            <PhoneIcon className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
            <a 
              href={`tel:${mosque.contactInfo.phone}`}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {mosque.contactInfo.phone}
            </a>
          </div>
        )}
        
        {mosque.contactInfo?.email && (
          <div className="flex items-center">
            <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
            <a 
              href={`mailto:${mosque.contactInfo.email}`}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {mosque.contactInfo.email}
            </a>
          </div>
        )}
        
        {mosque.contactInfo?.website && (
          <div className="flex items-center">
            <GlobeAltIcon className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
            <a 
              href={mosque.contactInfo.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {t.website || 'Website'}
            </a>
          </div>
        )}
      </div>
    );
  };

  const renderPrayerTimes = () => {
    if (!hasPrayerTimes) return null;

    const prayerNames = [
      { key: 'fajr', arabic: 'الفجر', english: 'Fajr' },
      { key: 'dhuhr', arabic: 'الظهر', english: 'Dhuhr' },
      { key: 'asr', arabic: 'العصر', english: 'Asr' },
      { key: 'maghrib', arabic: 'المغرب', english: 'Maghrib' },
      { key: 'isha', arabic: 'العشاء', english: 'Isha' }
    ];

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
          <ClockIcon className="h-4 w-4 mr-2" />
          {t.prayerTimes || 'Prayer Times'}
        </h4>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          {prayerNames.map(({ key, arabic, english }) => {
            const time = mosque.prayerTimes?.[key as keyof typeof mosque.prayerTimes];
            if (!time || typeof time === 'string') return null;
            
            return (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">
                  {lang === 'ar' ? arabic : english}
                </span>
                <span className="font-medium">
                  {formatTime(time as Date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSpecialEvents = () => {
    if (!hasSpecialEvents) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
          <CalendarDaysIcon className="h-4 w-4 mr-2" />
          {t.specialEvents || 'Special Events'}
        </h4>
        
        <ul className="space-y-1">
          {mosque.specialEvents?.map((event, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              {event}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Main Card Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {mosque.name}
            </h3>
            
            <div className="flex items-center text-gray-600 mb-2">
              <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-sm">{mosque.address}</span>
            </div>
            
            {mosque.distance && (
              <div className="text-sm text-blue-600 font-medium">
                {formatDistance(mosque.distance)} {t.away || 'away'}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 ml-4">
            <button
              onClick={onGetDirections}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center"
            >
              <DirectionsIcon className="h-4 w-4 mr-1" />
              {t.directions || 'Directions'}
            </button>
            
            {(hasContactInfo || hasPrayerTimes || hasSpecialEvents) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 flex items-center"
              >
                {t.details || 'Details'}
                {isExpanded ? (
                  <ChevronUpIcon className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {renderContactInfo()}
          {renderPrayerTimes()}
          {renderSpecialEvents()}
        </div>
      )}
    </div>
  );
};

export default MosqueCard;