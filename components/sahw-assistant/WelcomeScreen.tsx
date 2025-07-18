
import React from 'react';
import { PlusIcon, MinusIcon, QuestionMarkCircleIcon } from '../icons/HeroIcons';
import { QuestionType, Language } from '../../types';
import ChoiceButton from './ChoiceButton';
import { Header } from '../Header';

interface WelcomeScreenProps {
  onSelect: (type: 'increase' | QuestionType) => void;
  onBack: () => void;
  t: Record<string, string>;
  lang: Language;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelect, onBack, t, lang }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header title={t.main_title} onBack={onBack} isRTL={lang === 'ar'} />

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <p className="text-lg text-blue-700">{t.main_subtitle}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
          <h2 className="text-xl font-bold text-blue-800 mb-6 text-center">{t.question_type}</h2>
          <div className="space-y-4">
            <ChoiceButton
              onClick={() => onSelect('increase')}
              icon={<PlusIcon className="w-7 h-7" />}
              text={t.btn_increase}
            />
            <ChoiceButton
              onClick={() => onSelect('decrease')}
              icon={<MinusIcon className="w-7 h-7" />}
              text={t.btn_decrease}
            />
            <ChoiceButton
              onClick={() => onSelect('doubt')}
              icon={<QuestionMarkCircleIcon className="w-7 h-7" />}
              text={t.btn_doubt}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
