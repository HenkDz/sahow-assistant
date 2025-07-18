
import React from 'react';
import { Language } from '../types';

interface LanguageSwitcherProps {
  currentLang: Language;
  setLang: (lang: Language) => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLang, setLang }) => {
  const buttonBaseClasses = 'w-[90px] px-2 py-1.5 text-sm font-semibold rounded-full transition-colors duration-300 focus:outline-none relative z-10';

  return (
    <div className="relative flex items-center bg-white p-1 rounded-full shadow-inner" dir="ltr">
      <div
        className="absolute top-1 left-1 w-[90px] h-[calc(100%-8px)] bg-blue-600 rounded-full shadow transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(${currentLang === 'ar' ? '90px' : '0px'})` }}
      />
      <button
        onClick={() => setLang('en')}
        className={`${buttonBaseClasses} ${currentLang === 'en' ? 'text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
      >
        English
      </button>
      <button
        onClick={() => setLang('ar')}
        className={`${buttonBaseClasses} ${currentLang === 'ar' ? 'text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
      >
        العربية
      </button>
    </div>
  );
};

export default LanguageSwitcher;
