
import { useState } from 'react';
import { View, QuestionType, ResultKey } from './types';
import { useTranslation } from './i18n/I18nProvider';
import { I18nSettingsProvider } from './i18n/I18nSettingsProvider';
import { useSettingsInitialization } from './hooks/useSettingsInitialization';
import { SettingsLoadingScreen } from './components/SettingsLoadingScreen';
import { SettingsErrorBoundary } from './components/SettingsErrorBoundary';
import WelcomeScreen from './components/sahw-assistant/WelcomeScreen';
import QuestionScreen from './components/sahw-assistant/QuestionScreen';
import ResultScreen from './components/sahw-assistant/ResultScreen';
import { MainNavigationScreen } from './components/MainNavigationScreen';
import PrayerTimesScreen from './components/PrayerTimesScreen';
import QiblaCompass from './components/QiblaCompass';
import { IslamicCalendarScreen } from './components/IslamicCalendarScreen';
import TasbihScreen from './components/TasbihScreen';
import MosqueFinderScreen from './components/MosqueFinderScreen';
import SettingsScreen from './components/SettingsScreen';
import OfflineIndicator from './components/OfflineIndicator';
import OfflineErrorBoundary from './components/OfflineErrorBoundary';

// Main App component that uses i18n and settings
function AppContent() {
  const [view, setView] = useState<View>('main-navigation');
  const [questionType, setQuestionType] = useState<QuestionType | null>(null);
  const [resultKey, setResultKey] = useState<ResultKey | null>(null);
  const { isRTL } = useTranslation();
  
  // Initialize settings on app startup
  const { isLoading, isError, error, retry } = useSettingsInitialization();

  // Show loading screen during settings initialization
  if (isLoading || isError) {
    return <SettingsLoadingScreen error={error} onRetry={retry} />;
  }

  const changeView = <T,>(setter: (value: T) => void, value: T, newView: View) => {
    setter(value);
    setView(newView);
  };

  const handleNavigate = (newView: View) => {
    setView(newView);
    // Reset state when navigating
    setQuestionType(null);
    setResultKey(null);
  };

  const handleWelcomeSelect = (type: 'increase' | QuestionType) => {
    if (type === 'increase') {
      changeView(setResultKey, 'increase', 'result');
    } else {
      changeView(setQuestionType, type, 'question');
    }
  };

  const handleQuestionSelect = (key: ResultKey) => {
    changeView(setResultKey, key, 'result');
  };

  const handleStartOver = () => {
    setView('welcome');
    setQuestionType(null);
    setResultKey(null);
  };

  const handleBack = () => {
    setView('main-navigation');
    setQuestionType(null);
    setResultKey(null);
  };

  return (
    <div className={`min-h-screen ${isRTL ? 'font-[Tajawal]' : 'font-[Inter]'}`}>
      {/* Safe area for Android status bar */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-transparent z-40" />
      
      {/* Offline Indicator */}
      <OfflineIndicator className="fixed top-12 left-4 z-50" showDetails={false} />

      {view === 'main-navigation' && (
        <MainNavigationScreen onNavigate={handleNavigate} />
      )}

      {view === 'prayer-times' && (
        <OfflineErrorBoundary feature="prayer-times">
          <PrayerTimesScreen onBack={handleBack} />
        </OfflineErrorBoundary>
      )}

      {view === 'qibla' && (
        <OfflineErrorBoundary feature="qibla">
          <QiblaCompass onBack={handleBack} />
        </OfflineErrorBoundary>
      )}

      {view === 'calendar' && (
        <OfflineErrorBoundary feature="calendar">
          <IslamicCalendarScreen onBack={handleBack} />
        </OfflineErrorBoundary>
      )}

      {view === 'tasbih' && (
        <OfflineErrorBoundary feature="tasbih">
          <TasbihScreen onBack={handleBack} />
        </OfflineErrorBoundary>
      )}

      {view === 'mosques' && (
        <OfflineErrorBoundary feature="mosques">
          <MosqueFinderScreen onBack={handleBack} />
        </OfflineErrorBoundary>
      )}

      {view === 'settings' && (
        <OfflineErrorBoundary feature="settings">
          <SettingsScreen onBack={handleBack} />
        </OfflineErrorBoundary>
      )}

      {view === 'welcome' && (
        <WelcomeScreen onSelect={handleWelcomeSelect} onBack={handleBack} />
      )}

      {view === 'question' && (
        <QuestionScreen
          questionType={questionType}
          onSelect={handleQuestionSelect}
          onBack={handleBack}
        />
      )}

      {view === 'result' && (
        <ResultScreen
          resultKey={resultKey}
          onStartOver={handleStartOver}
          onBack={handleBack}
        />
      )}
    </div>
  );
}

// Main App component with I18n Provider and Error Boundary
export default function App() {
  return (
    <SettingsErrorBoundary>
      <I18nSettingsProvider>
        <AppContent />
      </I18nSettingsProvider>
    </SettingsErrorBoundary>
  );
}
