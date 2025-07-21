import React, { useState } from 'react';
import { Mosque } from '../../types';
import { mosqueService } from '../../services/MosqueService';
import { useTranslation } from '../../i18n/I18nProvider';
import { 
  MapPinIcon, 
  PhoneIcon, 
  GlobeAltIcon, 
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon
} from '../icons/HeroIcons';

interface MosqueCardProps {
  mosque: Mosque;
  onSelect?: (mosque: Mosque) => void;
  formatDistance: (distance?: number) => string;
}

const MosqueCard: React.FC<MosqueCardProps> = ({
  mosque,
  onSelect,
  formatDistance
}) => {
  const { t } = useTranslation('mosques');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(mosque);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleGetDirections = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setIsNavigating(true);
    
    try {
      await mosqueService.openMapsForNavigation(mosque);
    } catch (error) {
      console.error('Failed to open maps:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  const handlePhoneCall = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.open(`tel:${phone}`, '_self');
  };

  const handleWebsiteOpen = (e: React.MouseEvent, website: string) => {
    e.stopPropagation();
    window.open(website, '_blank');
  };

  const hasContactInfo = mosqueService.hasContactInfo(mosque);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Main Card Content */}
      <div 
        className="p-4 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 mb-1 text-ellipsis overflow-hidden">{mosque.name}</h3>
            <p className="text-gray-600 text-sm mb-2 text-ellipsis overflow-hidden">{mosque.address}</p>
            
            <div className="flex items-center gap-4 flex-wrap">
              {mosque.distance && (
                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                  {formatDistance(mosque.distance)}
                </span>
              )}
              
              {hasContactInfo && (
                <span className="text-xs text-green-600 font-medium">
                  {t('contactAvailable')}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              onClick={handleGetDirections}
              disabled={isNavigating}
              className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              <MapPinIcon className="w-4 h-4" />
              {isNavigating ? t('opening') : t('getDirections')}
            </button>
            
            {(hasContactInfo || mosque.specialEvents?.length) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isExpanded ? (
                  <ChevronUpIcon className="w-5 h-5" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="p-4 space-y-4">
            {/* Contact Information */}
            {hasContactInfo && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('contactInfo')}</h4>
                <div className="space-y-2">
                  {mosque.contactInfo?.phone && (
                    <button
                      onClick={(e) => handlePhoneCall(e, mosque.contactInfo!.phone!)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <PhoneIcon className="w-4 h-4" />
                      {mosque.contactInfo.phone}
                    </button>
                  )}
                  
                  {mosque.contactInfo?.website && (
                    <button
                      onClick={(e) => handleWebsiteOpen(e, mosque.contactInfo!.website!)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <GlobeAltIcon className="w-4 h-4" />
                      {t('website')}
                    </button>
                  )}
                  
                  {mosque.contactInfo?.email && (
                    <a
                      href={`mailto:${mosque.contactInfo.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {mosque.contactInfo.email}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Special Events/Programs */}
            {mosque.specialEvents && mosque.specialEvents.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('specialEvents')}</h4>
                <div className="space-y-1">
                  {mosque.specialEvents.map((event, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <ClockIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{event}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Address */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('fullAddress')}</h4>
              <p className="text-sm text-gray-600">{mosque.address}</p>
              {mosque.location.city && mosque.location.country && (
                <p className="text-xs text-gray-500 mt-1">
                  {mosque.location.city}, {mosque.location.country}
                </p>
              )}
            </div>

            {/* Coordinates (for debugging/advanced users) */}
            <div className="text-xs text-gray-400">
              {mosque.location.latitude.toFixed(6)}, {mosque.location.longitude.toFixed(6)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MosqueCard;