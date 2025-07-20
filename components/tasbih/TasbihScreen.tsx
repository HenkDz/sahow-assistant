import { useState, useEffect } from 'react';
import { TasbihService, TasbihData, DhikrOption, DEFAULT_DHIKR_OPTIONS } from '../../services/TasbihService';
import { useTranslation } from '../../i18n/I18nProvider';
import { ArrowPathIcon, Cog6ToothIcon, CheckIcon } from '../icons/HeroIcons';
import { Header } from '../shared/Header';

interface TasbihScreenProps {
  onBack: () => void;
}

interface TasbihScreenState {
  tasbihData: TasbihData;
  isLoading: boolean;
  showSettings: boolean;
  showResetConfirmation: boolean;
  showHistory: boolean;
  history: Array<TasbihData & { completedAt: Date }>;
}

export default function TasbihScreen({ onBack }: TasbihScreenProps) {
  const { t, isRTL } = useTranslation('tasbih');
  const [state, setState] = useState<TasbihScreenState>({
    tasbihData: {
      count: 0,
      goal: 33,
      dhikrText: '',
      dhikrTextArabic: '',
      lastUpdated: new Date()
    },
    isLoading: true,
    showSettings: false,
    showResetConfirmation: false,
    showHistory: false,
    history: []
  });



  useEffect(() => {
    loadTasbihData();
  }, []);

  const loadTasbihData = async () => {
    try {
      const data = await TasbihService.getCurrentTasbihData();
      setState(prev => ({ ...prev, tasbihData: data, isLoading: false }));
    } catch (error) {
      console.error('Error loading tasbih data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleIncrement = async () => {
    try {
      const updatedData = await TasbihService.incrementCount(state.tasbihData);
      setState(prev => ({ ...prev, tasbihData: updatedData }));
    } catch (error) {
      console.error('Error incrementing count:', error);
    }
  };

  const handleReset = async () => {
    try {
      const resetData = await TasbihService.resetCount(state.tasbihData);
      setState(prev => ({ 
        ...prev, 
        tasbihData: resetData, 
        showResetConfirmation: false 
      }));
    } catch (error) {
      console.error('Error resetting count:', error);
    }
  };

  const handleDhikrChange = async (dhikrOption: DhikrOption) => {
    try {
      const updatedData = await TasbihService.updateDhikr(state.tasbihData, dhikrOption);
      setState(prev => ({ ...prev, tasbihData: updatedData }));
    } catch (error) {
      console.error('Error updating dhikr:', error);
    }
  };

  const handleGoalChange = async (newGoal: number) => {
    try {
      const updatedData = await TasbihService.updateGoal(state.tasbihData, newGoal);
      setState(prev => ({ ...prev, tasbihData: updatedData }));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await TasbihService.getTasbihHistory();
      setState(prev => ({ ...prev, history, showHistory: true }));
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const getProgressPercentage = () => {
    return Math.min((state.tasbihData.count / state.tasbihData.goal) * 100, 100);
  };

  const getRemainingCount = () => {
    return Math.max(state.tasbihData.goal - state.tasbihData.count, 0);
  };

  const getCurrentDhikrOption = () => {
    return DEFAULT_DHIKR_OPTIONS.find(option => 
      option.textArabic === state.tasbihData.dhikrTextArabic
    ) || DEFAULT_DHIKR_OPTIONS[0];
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 to-blue-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header title={t('title')} onBack={onBack} isRTL={isRTL} />
      
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-end gap-2 mb-6">
          <button
            onClick={() => setState(prev => ({ ...prev, showSettings: !prev.showSettings }))}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
          </button>
          <button
            onClick={loadHistory}
            className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            {t('common:buttons.history')}
          </button>
        </div>
        {/* Settings Panel */}
        {state.showSettings && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">{t('common:buttons.settings')}</h3>
            
            {/* Dhikr Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('select_dhikr')}
              </label>
              <div className="space-y-2">
                {DEFAULT_DHIKR_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleDhikrChange(option)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      option.textArabic === state.tasbihData.dhikrTextArabic
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-lg text-gray-800 ${isRTL ? 'font-[Tajawal]' : ''}`}>{option.textArabic}</div>
                        <div className="text-sm text-gray-600">{option.transliteration}</div>
                        <div className="text-xs text-gray-500">{option.meaning}</div>
                      </div>
                      {option.textArabic === state.tasbihData.dhikrTextArabic && (
                        <CheckIcon className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Setting */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('goal')}
              </label>
              <div className="flex gap-2">
                {[33, 99, 100].map((goal) => (
                  <button
                    key={goal}
                    onClick={() => handleGoalChange(goal)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      goal === state.tasbihData.goal
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Counter */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          {/* Dhikr Text */}
          <div className="text-center mb-8">
            <div className={`text-3xl text-gray-800 mb-2 ${isRTL ? 'font-[Tajawal]' : ''}`}>
              {state.tasbihData.dhikrTextArabic}
            </div>
            <div className="text-lg text-gray-600">
              {getCurrentDhikrOption().transliteration}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {getCurrentDhikrOption().meaning}
            </div>
          </div>

          {/* Progress Circle */}
          <div className="relative mx-auto w-48 h-48 mb-8">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#10b981"
                strokeWidth="10"
                strokeDasharray={`${getProgressPercentage() * 2.827} 282.7`}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-800">
                  {state.tasbihData.count}
                </div>
                <div className="text-sm text-gray-500">
                  {t('of')} {state.tasbihData.goal}
                </div>
              </div>
            </div>
          </div>

          {/* Remaining Count */}
          <div className="text-center mb-8">
            <div className="text-2xl font-semibold text-green-600">
              {getRemainingCount()} {t('remaining')}
            </div>
            {state.tasbihData.count >= state.tasbihData.goal && (
              <div className="text-lg text-green-600 font-medium mt-2">
                🎉 {t('goal_completed')} 🎉
              </div>
            )}
          </div>

          {/* Counter Button */}
          <div className="text-center">
            <button
              onClick={handleIncrement}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white text-2xl font-bold shadow-lg hover:from-green-600 hover:to-green-700 active:scale-95 transition-all"
            >
              {t('tap')}
            </button>
          </div>
        </div>

        {/* Reset Button */}
        <div className="text-center">
          <button
            onClick={() => setState(prev => ({ ...prev, showResetConfirmation: true }))}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors mx-auto"
          >
            <ArrowPathIcon className="h-5 w-5" />
            {t('common:buttons.reset')}
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {state.showResetConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">{t('confirm_reset')}</h3>
            <p className="text-gray-600 mb-6">
              {t('reset_warning')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setState(prev => ({ ...prev, showResetConfirmation: false }))}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                {t('common:buttons.cancel')}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                {t('common:buttons.reset')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {state.showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{t('common:buttons.history')}</h3>
              <button
                onClick={() => setState(prev => ({ ...prev, showHistory: false }))}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {state.history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {t('no_history')}
              </p>
            ) : (
              <div className="space-y-3">
                {state.history.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className={`text-lg mb-1 ${isRTL ? 'font-[Tajawal]' : ''}`}>{item.dhikrTextArabic}</div>
                    <div className="text-sm text-gray-600 mb-2">
                      {item.count} {t('of')} {item.goal}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.completedAt.toLocaleDateString()} {item.completedAt.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
