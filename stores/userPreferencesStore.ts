import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserPreferences, Madhab, CalculationMethod, Language } from '../types';

interface UserPreferencesState {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  setLanguage: (language: Language) => void;
  setMadhab: (madhab: Madhab) => void;
  setCalculationMethod: (method: CalculationMethod) => void;
  setNotificationSettings: (enabled: boolean, offset?: number) => void;
  setLocation: (location: UserPreferences['location']) => void;
}

const defaultPreferences: UserPreferences = {
  language: 'en',
  madhab: Madhab.HANAFI,
  calculationMethod: CalculationMethod.MWL,
  notificationsEnabled: true,
  notificationOffset: 10, // 10 minutes before prayer
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      
      updatePreferences: (updates) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        })),
      
      setLanguage: (language) =>
        set((state) => ({
          preferences: { ...state.preferences, language },
        })),
      
      setMadhab: (madhab) =>
        set((state) => ({
          preferences: { ...state.preferences, madhab },
        })),
      
      setCalculationMethod: (calculationMethod) =>
        set((state) => ({
          preferences: { ...state.preferences, calculationMethod },
        })),
      
      setNotificationSettings: (notificationsEnabled, notificationOffset) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            notificationsEnabled,
            ...(notificationOffset !== undefined && { notificationOffset }),
          },
        })),
      
      setLocation: (location) =>
        set((state) => ({
          preferences: { ...state.preferences, location },
        })),
    }),
    {
      name: 'user-preferences-storage',
    }
  )
);