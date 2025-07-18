import { create } from 'zustand';
import { PrayerTimes } from '../types';

interface PrayerTimesState {
  currentPrayerTimes: PrayerTimes | null;
  cachedPrayerTimes: Map<string, PrayerTimes>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  setPrayerTimes: (prayerTimes: PrayerTimes) => void;
  cachePrayerTimes: (key: string, prayerTimes: PrayerTimes) => void;
  getCachedPrayerTimes: (key: string) => PrayerTimes | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearCache: () => void;
  getNextPrayer: () => { name: string; time: Date } | null;
}

export const usePrayerTimesStore = create<PrayerTimesState>((set, get) => ({
  currentPrayerTimes: null,
  cachedPrayerTimes: new Map(),
  isLoading: false,
  error: null,
  lastUpdated: null,
  
  setPrayerTimes: (prayerTimes) =>
    set({
      currentPrayerTimes: prayerTimes,
      lastUpdated: new Date(),
      error: null,
    }),
  
  cachePrayerTimes: (key, prayerTimes) =>
    set((state) => {
      const newCache = new Map(state.cachedPrayerTimes);
      newCache.set(key, prayerTimes);
      return { cachedPrayerTimes: newCache };
    }),
  
  getCachedPrayerTimes: (key) => {
    const state = get();
    return state.cachedPrayerTimes.get(key) || null;
  },
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearCache: () =>
    set({
      cachedPrayerTimes: new Map(),
      currentPrayerTimes: null,
      lastUpdated: null,
    }),
  
  getNextPrayer: () => {
    const state = get();
    if (!state.currentPrayerTimes) return null;
    
    const now = new Date();
    const prayers = [
      { name: 'Fajr', time: state.currentPrayerTimes.fajr },
      { name: 'Sunrise', time: state.currentPrayerTimes.sunrise },
      { name: 'Dhuhr', time: state.currentPrayerTimes.dhuhr },
      { name: 'Asr', time: state.currentPrayerTimes.asr },
      { name: 'Maghrib', time: state.currentPrayerTimes.maghrib },
      { name: 'Isha', time: state.currentPrayerTimes.isha },
    ];
    
    // Find the next prayer time
    for (const prayer of prayers) {
      if (prayer.time > now) {
        return prayer;
      }
    }
    
    // If no prayer is found for today, return Fajr of next day
    const nextFajr = new Date(state.currentPrayerTimes.fajr);
    nextFajr.setDate(nextFajr.getDate() + 1);
    return { name: 'Fajr', time: nextFajr };
  },
}));