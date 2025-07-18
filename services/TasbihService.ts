import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';

export interface TasbihData {
  count: number;
  goal: number;
  dhikrText: string;
  dhikrTextArabic: string;
  lastUpdated: Date;
}

export interface DhikrOption {
  id: string;
  textArabic: string;
  textEnglish: string;
  transliteration: string;
  meaning: string;
  defaultGoal: number;
}

export const DEFAULT_DHIKR_OPTIONS: DhikrOption[] = [
  {
    id: 'subhanallah',
    textArabic: 'سُبْحَانَ اللَّهِ',
    textEnglish: 'Glory be to Allah',
    transliteration: 'Subhan Allah',
    meaning: 'Glory be to Allah',
    defaultGoal: 33
  },
  {
    id: 'alhamdulillah',
    textArabic: 'الْحَمْدُ لِلَّهِ',
    textEnglish: 'Praise be to Allah',
    transliteration: 'Alhamdulillah',
    meaning: 'Praise be to Allah',
    defaultGoal: 33
  },
  {
    id: 'allahuakbar',
    textArabic: 'اللَّهُ أَكْبَرُ',
    textEnglish: 'Allah is the Greatest',
    transliteration: 'Allahu Akbar',
    meaning: 'Allah is the Greatest',
    defaultGoal: 34
  },
  {
    id: 'lahawla',
    textArabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    textEnglish: 'There is no power except with Allah',
    transliteration: 'La hawla wa la quwwata illa billah',
    meaning: 'There is no power except with Allah',
    defaultGoal: 100
  },
  {
    id: 'istighfar',
    textArabic: 'أَسْتَغْفِرُ اللَّهَ',
    textEnglish: 'I seek forgiveness from Allah',
    transliteration: 'Astaghfirullah',
    meaning: 'I seek forgiveness from Allah',
    defaultGoal: 100
  },
  {
    id: 'salawat',
    textArabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    textEnglish: 'O Allah, send blessings upon Muhammad',
    transliteration: 'Allahumma salli ala Muhammad',
    meaning: 'O Allah, send blessings upon Muhammad',
    defaultGoal: 100
  }
];

export class TasbihService {
  private static readonly STORAGE_KEY = 'tasbih_data';
  private static readonly HISTORY_KEY = 'tasbih_history';

  static async getCurrentTasbihData(): Promise<TasbihData> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      if (value) {
        const data = JSON.parse(value);
        return {
          ...data,
          lastUpdated: new Date(data.lastUpdated)
        };
      }
    } catch (error) {
      console.error('Error loading tasbih data:', error);
    }

    // Return default data if none exists
    const defaultDhikr = DEFAULT_DHIKR_OPTIONS[0];
    return {
      count: 0,
      goal: defaultDhikr.defaultGoal,
      dhikrText: defaultDhikr.textEnglish,
      dhikrTextArabic: defaultDhikr.textArabic,
      lastUpdated: new Date()
    };
  }

  static async saveTasbihData(data: TasbihData): Promise<void> {
    try {
      const dataToSave = {
        ...data,
        lastUpdated: data.lastUpdated.toISOString()
      };
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(dataToSave)
      });
    } catch (error) {
      console.error('Error saving tasbih data:', error);
    }
  }

  static async incrementCount(currentData: TasbihData): Promise<TasbihData> {
    const newCount = currentData.count + 1;
    const updatedData = {
      ...currentData,
      count: newCount,
      lastUpdated: new Date()
    };

    // Check for milestone achievements and provide haptic feedback
    if (this.isMilestone(newCount)) {
      await this.provideMilestoneHapticFeedback(newCount);
    } else {
      await this.provideRegularHapticFeedback();
    }

    // Save to history if goal is reached
    if (newCount >= currentData.goal) {
      await this.saveToHistory(updatedData);
    }

    await this.saveTasbihData(updatedData);
    return updatedData;
  }

  static async resetCount(currentData: TasbihData): Promise<TasbihData> {
    // Save current session to history before resetting
    if (currentData.count > 0) {
      await this.saveToHistory(currentData);
    }

    const resetData = {
      ...currentData,
      count: 0,
      lastUpdated: new Date()
    };

    await this.saveTasbihData(resetData);
    return resetData;
  }

  static async updateDhikr(currentData: TasbihData, dhikrOption: DhikrOption): Promise<TasbihData> {
    const updatedData = {
      ...currentData,
      dhikrText: dhikrOption.textEnglish,
      dhikrTextArabic: dhikrOption.textArabic,
      goal: dhikrOption.defaultGoal,
      lastUpdated: new Date()
    };

    await this.saveTasbihData(updatedData);
    return updatedData;
  }

  static async updateGoal(currentData: TasbihData, newGoal: number): Promise<TasbihData> {
    const updatedData = {
      ...currentData,
      goal: newGoal,
      lastUpdated: new Date()
    };

    await this.saveTasbihData(updatedData);
    return updatedData;
  }

  static isMilestone(count: number): boolean {
    return count === 33 || count === 99 || count === 100 || count % 100 === 0;
  }

  static async provideRegularHapticFeedback(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.error('Haptic feedback not available:', error);
    }
  }

  static async provideMilestoneHapticFeedback(count: number): Promise<void> {
    try {
      // Provide different haptic patterns for different milestones
      if (count === 33 || count === 99) {
        await Haptics.impact({ style: ImpactStyle.Medium });
        setTimeout(async () => {
          await Haptics.impact({ style: ImpactStyle.Medium });
        }, 100);
      } else if (count === 100 || count % 100 === 0) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        setTimeout(async () => {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }, 100);
        setTimeout(async () => {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }, 200);
      }
    } catch (error) {
      console.error('Haptic feedback not available:', error);
    }
  }

  static async saveToHistory(data: TasbihData): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.HISTORY_KEY });
      let history: Array<TasbihData & { completedAt: Date }> = [];
      
      if (value) {
        history = JSON.parse(value).map((item: any) => ({
          ...item,
          lastUpdated: new Date(item.lastUpdated),
          completedAt: new Date(item.completedAt)
        }));
      }

      // Add current session to history
      history.unshift({
        ...data,
        completedAt: new Date()
      });

      // Keep only last 50 sessions
      history = history.slice(0, 50);

      await Preferences.set({
        key: this.HISTORY_KEY,
        value: JSON.stringify(history.map(item => ({
          ...item,
          lastUpdated: item.lastUpdated.toISOString(),
          completedAt: item.completedAt.toISOString()
        })))
      });
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }

  static async getTasbihHistory(): Promise<Array<TasbihData & { completedAt: Date }>> {
    try {
      const { value } = await Preferences.get({ key: this.HISTORY_KEY });
      if (value) {
        return JSON.parse(value).map((item: any) => ({
          ...item,
          lastUpdated: new Date(item.lastUpdated),
          completedAt: new Date(item.completedAt)
        }));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
    return [];
  }

  static async clearHistory(): Promise<void> {
    try {
      await Preferences.remove({ key: this.HISTORY_KEY });
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }
}
