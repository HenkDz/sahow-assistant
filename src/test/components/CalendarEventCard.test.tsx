import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CalendarEventCard } from '../../../components/calendar/CalendarEventCard';

// Mock the i18n provider
vi.mock('../../../i18n/I18nProvider', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    isRTL: false,
    currentLanguage: 'en'
  })
}));

describe('CalendarEventCard', () => {
  const mockEvent = {
    name: 'Islamic New Year',
    nameAr: 'رأس السنة الهجرية',
    description: 'The beginning of the Islamic calendar year',
    descriptionAr: 'بداية السنة الهجرية',
    isHoliday: true
  };

  it('should render event card in English', () => {
    const { container } = render(
      <CalendarEventCard
        event={mockEvent}
      />
    );

    expect(container.textContent).toContain('Islamic New Year');
    expect(container.textContent).toContain('The beginning of the Islamic calendar year');
    expect(container.textContent).toContain('Islamic Holiday');
  });

  it('should render event card in Arabic', () => {
    const { container } = render(
      <CalendarEventCard
        event={mockEvent}
      />
    );

    expect(container.textContent).toContain('رأس السنة الهجرية');
    expect(container.textContent).toContain('بداية السنة الهجرية');
    expect(container.textContent).toContain('عطلة إسلامية');
  });

  it('should render observance card for non-holiday events', () => {
    const observanceEvent = {
      ...mockEvent,
      isHoliday: false
    };

    const { container } = render(
      <CalendarEventCard
        event={observanceEvent}
      />
    );

    expect(container.textContent).toContain('Islamic Observance');
  });

  it('should handle event without description', () => {
    const eventWithoutDescription = {
      name: 'Test Event',
      nameAr: 'حدث تجريبي',
      isHoliday: false
    };

    const { container } = render(
      <CalendarEventCard
        event={eventWithoutDescription}
      />
    );

    expect(container.textContent).toContain('Test Event');
    expect(container.textContent).not.toContain('description');
  });
});