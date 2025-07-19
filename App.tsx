
import React, { useState, useEffect, useCallback } from 'react';
import { Language, View, QuestionType, ResultKey } from './types';
import { translations } from './constants';
import LanguageSwitcher from './components/LanguageSwitcher';
import WelcomeScreen from './components/sahw-assistant/WelcomeScreen';
import QuestionScreen from './components/sahw-assistant/QuestionScreen';
import ResultScreen from './components/sahw-assistant/ResultScreen';
import { MainNavigationScreen } from './components/MainNavigationScreen';
import PrayerTimesScreen from './components/PrayerTimesScreen';
import QiblaCompass from './components/QiblaCompass';
import { IslamicCalendarScreen } from './components/IslamicCalendarScreen';
import TasbihScreen from './components/TasbihScreen';
import SettingsScreen from './components/SettingsScreen';
import OfflineIndicator from './components/OfflineIndicator';
import OfflineErrorBoundary from './components/OfflineErrorBoundary';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [view, setView] = useState<View>('main-navigation');
  const [questionType, setQuestionType] = useState<QuestionType | null>(null);
  const [resultKey, setResultKey] = useState<ResultKey | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

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

  const currentTranslation = translations[lang];

  return (
    <div className={`min-h-screen ${lang === 'ar' ? 'font-[Tajawal]' : 'font-[Inter]'}`}>
      {/* Safe area for Android status bar */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-transparent z-40" />
      
      {/* Offline Indicator */}
      <OfflineIndicator className="fixed top-12 left-4 z-50" showDetails={false} />
      
      <div className="fixed top-16 right-4 z-50">
        {/*<LanguageSwitcher currentLang={lang} setLang={setLang} />*/}
      </div>

      {view === 'main-navigation' && (
        <MainNavigationScreen language={lang} onNavigate={handleNavigate} />
      )}

      {view === 'prayer-times' && (
        <OfflineErrorBoundary feature="prayer-times">
          <PrayerTimesScreen lang={lang} onBack={handleBack} t={currentTranslation} />
        </OfflineErrorBoundary>
      )}

      {view === 'qibla' && (
        <OfflineErrorBoundary feature="qibla">
          <QiblaCompass lang={lang} onBack={handleBack} t={currentTranslation} />
        </OfflineErrorBoundary>
      )}

      {view === 'calendar' && (
        <OfflineErrorBoundary feature="calendar">
          <IslamicCalendarScreen language={lang} onBack={handleBack} />
        </OfflineErrorBoundary>
      )}

      {view === 'tasbih' && (
        <OfflineErrorBoundary feature="tasbih">
          <TasbihScreen lang={lang} onBack={handleBack} t={currentTranslation} />
        </OfflineErrorBoundary>
      )}

      {view === 'settings' && (
        <OfflineErrorBoundary feature="settings">
          <SettingsScreen 
            lang={lang} 
            onBack={handleBack} 
            t={currentTranslation} 
            onLanguageChange={setLang}
          />
        </OfflineErrorBoundary>
      )}

      {view === 'welcome' && (
        <WelcomeScreen onSelect={handleWelcomeSelect} onBack={handleBack} t={currentTranslation} lang={lang} />
      )}

      {view === 'question' && (
        <QuestionScreen
          questionType={questionType}
          onSelect={handleQuestionSelect}
          onBack={handleBack}
          t={currentTranslation}
          lang={lang}
        />
      )}

      {view === 'result' && (
        <ResultScreen
          resultKey={resultKey}
          onStartOver={handleStartOver}
          onBack={handleBack}
          t={currentTranslation}
          lang={lang}
        />
      )}
    </div>
  );
}
