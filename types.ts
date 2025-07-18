
export type Language = 'ar' | 'en';

export type View = 'main-navigation' | 'welcome' | 'question' | 'result' | 'prayer-times' | 'qibla' | 'calendar' | 'tasbih' | 'settings' | 'mosques';

export type QuestionType = 'decrease' | 'doubt';

export type ResultKey = 
  | 'increase' 
  | 'decrease_wajib' 
  | 'decrease_rukn' 
  | 'doubt_prevail' 
  | 'doubt_no_prevail';

// Enhanced types for Islamic features
export enum Madhab {
  HANAFI = 'hanafi',
  SHAFI = 'shafi',
  MALIKI = 'maliki',
  HANBALI = 'hanbali'
}

export enum CalculationMethod {
  MWL = 'MWL',
  ISNA = 'ISNA',
  EGYPT = 'Egypt',
  MAKKAH = 'Makkah',
  KARACHI = 'Karachi',
  TEHRAN = 'Tehran',
  JAFARI = 'Jafari'
}

export interface Location {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

export interface UserPreferences {
  language: Language;
  madhab: Madhab;
  calculationMethod: CalculationMethod;
  notificationsEnabled: boolean;
  notificationOffset: number; // minutes before prayer
  location?: Location;
}

export interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  date: Date;
  location: string;
}

export interface IslamicDate {
  hijriDay: number;
  hijriMonth: string;
  hijriYear: number;
  gregorianDate: Date;
  events?: string[];
}

export interface Mosque {
  id: string;
  name: string;
  address: string;
  location: Location;
  distance?: number; // in kilometers
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  prayerTimes?: PrayerTimes;
  specialEvents?: string[];
}
