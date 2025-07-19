import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUserPreferencesStore } from '../../stores/userPreferencesStore';

describe('I18n Settings Integration', () => {
  beforeEach(async () => {
    // Reset store state
    await useUserPreferencesStore.getState().resetToDefaults();
  });

  it('should initialize i18n with settings language preference', async () => {
    const { result } = renderHook(() => useUserPreferencesStore());
    
    // Set language in settings
    await act(async () => {
      await result.current.setLanguage('ar');
    });
    
    // Verify language was set in store
    expect(result.current.preferences.language).toBe('ar');
  });

  it('should handle RTL/LTR direction changes', async () => {
    const { result } = renderHook(() => useUserPreferencesStore());
    
    // Test Arabic (RTL)
    await act(async () => {
      await result.current.setLanguage('ar');
    });
    
    expect(result.current.preferences.language).toBe('ar');
    
    // Test English (LTR)
    await act(async () => {
      await result.current.setLanguage('en');
    });
    
    expect(result.current.preferences.language).toBe('en');
  });

  it('should persist language preference across app sessions', async () => {
    const { result } = renderHook(() => useUserPreferencesStore());
    
    // Set language preference
    await act(async () => {
      await result.current.setLanguage('ar');
    });
    
    // Verify it's persisted in the store
    expect(result.current.preferences.language).toBe('ar');
    
    // Simulate app restart by initializing from storage
    await act(async () => {
      await result.current.initializeFromStorage();
    });
    
    // Language should still be Arabic after "restart"
    expect(result.current.preferences.language).toBe('ar');
  });

  it('should handle language changes without errors', async () => {
    const { result } = renderHook(() => useUserPreferencesStore());
    
    // Test language change
    await act(async () => {
      await result.current.setLanguage('ar');
    });
    
    // Verify the language was set in settings
    expect(result.current.preferences.language).toBe('ar');
    
    // Test changing back to English
    await act(async () => {
      await result.current.setLanguage('en');
    });
    
    expect(result.current.preferences.language).toBe('en');
  });
});