
import React, { useState, useEffect, useCallback } from 'react';
import { Language, View, QuestionType, ResultKey } from './types';
import { translations } from './constants';
import LanguageSwitcher from './components/LanguageSwitcher';
import WelcomeScreen from './components/WelcomeScreen';
import QuestionScreen from './components/QuestionScreen';
import ResultScreen from './components/ResultScreen';
import { MainNavigationScreen } from './components/MainNavigationScreen';
import PrayerTimesScreen from './components/PrayerTimesScreen';
import QiblaCompass from './components/QiblaCompass';
import { IslamicCalendarScreen } from './components/IslamicCalendarScreen';
import { Transition } from './components/Transition';

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

  // Render full-screen views without the container wrapper
  if (view === 'main-navigation' || view === 'prayer-times' || view === 'qibla' || view === 'calendar') {
    return (
      <div className={`min-h-screen ${lang === 'ar' ? 'font-[Tajawal]' : 'font-[Inter]'}`}>
        {/* Safe area for Android status bar */}
        <div className="fixed top-0 left-0 right-0 h-12 bg-transparent z-40" />
        <div className="fixed top-16 right-4 z-50">
          {/*<LanguageSwitcher currentLang={lang} setLang={setLang} />*/}
        </div>

        {view === 'main-navigation' && (
          <MainNavigationScreen language={lang} onNavigate={handleNavigate} />
        )}

        {view === 'prayer-times' && (
          <PrayerTimesScreen lang={lang} onBack={handleBack} t={currentTranslation} />
        )}

        {view === 'qibla' && (
          <QiblaCompass lang={lang} onBack={handleBack} t={currentTranslation} />
        )}

        {view === 'calendar' && (
          <IslamicCalendarScreen language={lang} onBack={handleBack} />
        )}
      </div>
    );
  }

  // Render the original Sahw Assistant views with the container
  return (
    <div className={`min-h-screen text-slate-800 flex flex-col items-center p-4 pt-24 transition-all duration-300 ${lang === 'ar' ? 'font-[Tajawal]' : 'font-[Inter]'}`}>
      <div className="w-full max-w-md">
        <header className="flex justify-center mb-6">
          {/*<LanguageSwitcher currentLang={lang} setLang={setLang} />*/}
        </header>
        <main className="grid">
          <Transition show={view === 'welcome'}>
            <WelcomeScreen onSelect={handleWelcomeSelect} onBack={handleBack} t={currentTranslation} />
          </Transition>
          <Transition show={view === 'question'}>
            <QuestionScreen
              questionType={questionType}
              onSelect={handleQuestionSelect}
              onBack={handleBack}
              t={currentTranslation}
            />
          </Transition>
          <Transition show={view === 'result'}>
            <ResultScreen
              resultKey={resultKey}
              onStartOver={handleStartOver}
              onBack={handleBack}
              t={currentTranslation}
              lang={lang}
            />
          </Transition>
        </main>
      </div>
    </div>
  );
}
