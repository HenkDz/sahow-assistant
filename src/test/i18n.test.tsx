import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import { I18nProvider, useLanguage, useTranslation } from '../../i18n/I18nProvider';
import i18n from '../../i18n';

// Mock component to test hooks
const TestComponent = ({ namespace }: { namespace?: string }) => {
  const { currentLanguage, changeLanguage, isRTL } = useLanguage();
  const { t, tWithFallback } = useTranslation(namespace);

  return (
    <div>
      <div data-testid="current-language">{currentLanguage}</div>
      <div data-testid="is-rtl">{isRTL.toString()}</div>
      <div data-testid="translation">{t('common:buttons.back')}</div>
      <div data-testid="fallback-translation">{tWithFallback('nonexistent.key', 'Fallback Text')}</div>
      <button 
        data-testid="change-language" 
        onClick={() => changeLanguage('ar')}
      >
        Change to Arabic
      </button>
    </div>
  );
};

describe('I18n Provider and Hooks', () => {
  beforeEach(async () => {
    // Reset i18n to English before each test
    await i18n.changeLanguage('en');
  });

  afterEach(() => {
    // Clean up DOM after each test
    cleanup();
  });

  describe('I18nProvider', () => {
    it('should provide i18n context to children', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('is-rtl')).toHaveTextContent('false');
    });

    it('should update document direction and language attributes', async () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      // Initially should be LTR English
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('en');

      // Change to Arabic
      await act(async () => {
        screen.getByTestId('change-language').click();
      });

      await waitFor(() => {
        expect(document.documentElement.dir).toBe('rtl');
        expect(document.documentElement.lang).toBe('ar');
      });
    });
  });

  describe('useLanguage hook', () => {
    it('should provide current language and change function', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-language')).toHaveTextContent('en');
      expect(screen.getByTestId('is-rtl')).toHaveTextContent('false');
    });

    it('should change language when changeLanguage is called', async () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await act(async () => {
        screen.getByTestId('change-language').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-language')).toHaveTextContent('ar');
        expect(screen.getByTestId('is-rtl')).toHaveTextContent('true');
      });
    });

    it('should throw error when used outside provider', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useLanguage must be used within an I18nProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('useTranslation hook', () => {
    it('should provide translation function', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('translation')).toHaveTextContent('Back');
    });

    it('should provide fallback translation function', () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('fallback-translation')).toHaveTextContent('Fallback Text');
    });

    it('should work with different namespaces', () => {
      const NamespaceTestComponent = () => {
        const { t } = useTranslation('prayers');
        return <div data-testid="namespace-translation">{t('title')}</div>;
      };

      render(
        <I18nProvider>
          <NamespaceTestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('namespace-translation')).toHaveTextContent('Prayer Times');
    });

    it('should update translations when language changes', async () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      // Initially English
      expect(screen.getByTestId('translation')).toHaveTextContent('Back');

      // Change to Arabic
      await act(async () => {
        screen.getByTestId('change-language').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('translation')).toHaveTextContent('رجوع');
      });
    });
  });

  describe('Language detection and persistence', () => {
    it('should persist language selection in localStorage', async () => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>
      );

      await act(async () => {
        screen.getByTestId('change-language').click();
      });

      await waitFor(() => {
        expect(localStorage.getItem('i18nextLng')).toBe('ar');
      });
    });
  });
});