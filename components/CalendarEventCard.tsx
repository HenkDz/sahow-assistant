import React from 'react';
import { useTranslation } from '../i18n/I18nProvider';

interface IslamicEvent {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  isHoliday: boolean;
}

interface CalendarEventCardProps {
  event: IslamicEvent;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  event
}) => {
  const { t, isRTL, currentLanguage } = useTranslation('calendar');
  
  const eventName = currentLanguage === 'ar' ? event.nameAr : event.name;
  const eventDescription = currentLanguage === 'ar' ? event.descriptionAr : event.description;

  return (
    <div className={`
      bg-white rounded-xl shadow-sm border-l-4 p-4
      ${event.isHoliday 
        ? 'border-l-amber-400 bg-gradient-to-r from-amber-50 to-white' 
        : 'border-l-emerald-400 bg-gradient-to-r from-emerald-50 to-white'
      }
      ${isRTL ? 'rtl border-l-0 border-r-4' : ''}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {event.isHoliday ? (
              <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            <span className={`
              text-xs font-medium px-2 py-1 rounded-full
              ${event.isHoliday 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-emerald-100 text-emerald-800'
              }
            `}>
              {event.isHoliday ? t('event_types.holiday') : t('event_types.observance')}
            </span>
          </div>
          
          <h3 className={`
            font-semibold text-lg mb-1
            ${event.isHoliday ? 'text-amber-900' : 'text-emerald-900'}
          `}>
            {eventName}
          </h3>
          
          {eventDescription && (
            <p className={`
              text-sm leading-relaxed
              ${event.isHoliday ? 'text-amber-700' : 'text-emerald-700'}
            `}>
              {eventDescription}
            </p>
          )}
        </div>
        
        {/* Decorative Islamic pattern */}
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center
          ${event.isHoliday 
            ? 'bg-amber-100' 
            : 'bg-emerald-100'
          }
        `}>
          <svg 
            className={`w-6 h-6 ${event.isHoliday ? 'text-amber-600' : 'text-emerald-600'}`} 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};