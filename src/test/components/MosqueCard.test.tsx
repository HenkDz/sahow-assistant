import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MosqueCard from '../../../components/MosqueCard';
import { Language, Mosque } from '../../../types';

describe('MosqueCard', () => {
  const mockMosque: Mosque = {
    id: '1',
    name: 'Central Mosque',
    address: '123 Main Street, Downtown',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York',
      country: 'USA'
    },
    distance: 2.5,
    contactInfo: {
      phone: '+1-555-0123',
      email: 'info@centralmosque.org',
      website: 'https://centralmosque.org'
    },
    specialEvents: ['Friday Khutbah at 1:30 PM', 'Quran Study Circle - Sundays 10 AM']
  };

  const mockProps = {
    mosque: mockMosque,
    t: {
      contactInfo: 'Contact Information',
      website: 'Website',
      prayerTimes: 'Prayer Times',
      specialEvents: 'Special Events',
      directions: 'Directions',
      details: 'Details',
      away: 'away'
    },
    lang: 'en' as Language,
    onSelect: vi.fn(),
    onGetDirections: vi.fn(),
    formatDistance: vi.fn((distance) => `${distance}km`)
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render mosque basic information', () => {
    render(<MosqueCard {...mockProps} />);
    
    expect(screen.getByText('Central Mosque')).toBeInTheDocument();
    expect(screen.getByText('123 Main Street, Downtown')).toBeInTheDocument();
    expect(screen.getByText('2.5km away')).toBeInTheDocument();
  });

  it('should render directions button', () => {
    render(<MosqueCard {...mockProps} />);
    
    const directionsButton = screen.getByText('Directions');
    expect(directionsButton).toBeInTheDocument();
  });

  it('should render details button when additional info is available', () => {
    render(<MosqueCard {...mockProps} />);
    
    const detailsButton = screen.getByText('Details');
    expect(detailsButton).toBeInTheDocument();
  });

  it('should handle directions button click', () => {
    render(<MosqueCard {...mockProps} />);
    
    const directionsButton = screen.getByText('Directions');
    fireEvent.click(directionsButton);
    
    expect(mockProps.onGetDirections).toHaveBeenCalledTimes(1);
  });

  it('should expand details when details button is clicked', () => {
    const { container } = render(<MosqueCard {...mockProps} />);
    
    const detailsButton = container.querySelector('button:nth-child(2)') as HTMLButtonElement;
    fireEvent.click(detailsButton);
    
    // Should show contact information
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
    expect(screen.getByText('info@centralmosque.org')).toBeInTheDocument();
    expect(screen.getByText('Website')).toBeInTheDocument();
  });

  it('should show special events when expanded', () => {
    const { container } = render(<MosqueCard {...mockProps} />);
    
    const detailsButton = container.querySelector('button:nth-child(2)') as HTMLButtonElement;
    fireEvent.click(detailsButton);
    
    expect(screen.getByText('Special Events')).toBeInTheDocument();
    expect(screen.getByText('Friday Khutbah at 1:30 PM')).toBeInTheDocument();
    expect(screen.getByText('Quran Study Circle - Sundays 10 AM')).toBeInTheDocument();
  });

  it('should handle mosque without contact info', () => {
    const mosqueWithoutContact: Mosque = {
      ...mockMosque,
      contactInfo: undefined
    };

    render(<MosqueCard {...mockProps} mosque={mosqueWithoutContact} />);
    
    expect(screen.getByText('Central Mosque')).toBeInTheDocument();
    expect(screen.getByText('Directions')).toBeInTheDocument();
  });

  it('should handle mosque without distance', () => {
    const mosqueWithoutDistance: Mosque = {
      ...mockMosque,
      distance: undefined
    };

    render(<MosqueCard {...mockProps} mosque={mosqueWithoutDistance} />);
    
    expect(screen.getByText('Central Mosque')).toBeInTheDocument();
    expect(screen.queryByText('away')).not.toBeInTheDocument();
  });

  it('should handle mosque without special events', () => {
    const mosqueWithoutEvents: Mosque = {
      ...mockMosque,
      specialEvents: undefined
    };

    const { container } = render(<MosqueCard {...mockProps} mosque={mosqueWithoutEvents} />);
    
    const detailsButton = container.querySelector('button:nth-child(2)') as HTMLButtonElement;
    fireEvent.click(detailsButton);
    
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.queryByText('Special Events')).not.toBeInTheDocument();
  });

  it('should render with Arabic language', () => {
    const arabicProps = {
      ...mockProps,
      lang: 'ar' as Language,
      t: {
        ...mockProps.t,
        contactInfo: 'معلومات الاتصال',
        directions: 'الاتجاهات',
        details: 'التفاصيل',
        away: 'بعيداً'
      }
    };

    render(<MosqueCard {...arabicProps} />);
    
    expect(screen.getByText('الاتجاهات')).toBeInTheDocument();
    expect(screen.getByText('التفاصيل')).toBeInTheDocument();
  });

  it('should show expanded details by default when showDetails is true', () => {
    render(<MosqueCard {...mockProps} showDetails={true} />);
    
    // Should show contact information without clicking details button
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('+1-555-0123')).toBeInTheDocument();
  });

  it('should handle contact info links correctly', () => {
    const { container } = render(<MosqueCard {...mockProps} />);
    
    const detailsButton = container.querySelector('button:nth-child(2)') as HTMLButtonElement;
    fireEvent.click(detailsButton);
    
    // Check phone link
    const phoneLink = screen.getByText('+1-555-0123');
    expect(phoneLink.closest('a')).toHaveAttribute('href', 'tel:+1-555-0123');
    
    // Check email link
    const emailLink = screen.getByText('info@centralmosque.org');
    expect(emailLink.closest('a')).toHaveAttribute('href', 'mailto:info@centralmosque.org');
    
    // Check website link
    const websiteLink = screen.getByText('Website');
    expect(websiteLink.closest('a')).toHaveAttribute('href', 'https://centralmosque.org');
    expect(websiteLink.closest('a')).toHaveAttribute('target', '_blank');
  });
});