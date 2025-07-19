import { describe, it, expect, beforeEach } from 'vitest';
import i18n, { supportedLanguages, isRTL, getCurrentDirection, changeLanguage } from '../../i18n';

describe('i18n Configuration', () => {
  beforeEach(async () => {
    // Reset to default language before each test
    await i18n.changeLanguage('en');
  });

  it('should initialize with default language', () => {
    expect(i18n.isInitialized).toBe(true);
    expect(supportedLanguages).toContain('en');
    expect(supportedLanguages).toContain('ar');
  });

  it('should translate basic keys in English', () => {
    expect(i18n.t('main_title')).toBe('Sahw Assistant');
    expect(i18n.t('btn_increase')).toBe('Addition');
    expect(i18n.t('btn_decrease')).toBe('Omission');
  });

  it('should translate basic keys in Arabic', async () => {
    await i18n.changeLanguage('ar');
    expect(i18n.t('main_title')).toBe('مساعد السهو');
    expect(i18n.t('btn_increase')).toBe('زيادة');
    expect(i18n.t('btn_decrease')).toBe('نقص');
  });

  it('should detect RTL languages correctly', () => {
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('en')).toBe(false);
  });

  it('should return correct direction for current language', async () => {
    // English should be LTR
    await i18n.changeLanguage('en');
    expect(getCurrentDirection()).toBe('ltr');
    
    // Arabic should be RTL
    await i18n.changeLanguage('ar');
    expect(getCurrentDirection()).toBe('rtl');
  });

  it('should change language and update direction', async () => {
    await changeLanguage('ar');
    expect(i18n.language).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    
    await changeLanguage('en');
    expect(i18n.language).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should fallback to default language for unsupported languages', async () => {
    // Try to set an unsupported language
    await i18n.changeLanguage('fr');
    // Should fallback to English
    expect(i18n.language).toBe('en');
  });

  it('should handle missing translation keys gracefully', () => {
    const result = i18n.t('non_existent_key');
    expect(result).toBe('non_existent_key'); // i18next returns the key if translation is missing
  });
});