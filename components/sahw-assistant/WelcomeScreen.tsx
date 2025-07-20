
import React from 'react';
import { PlusIcon, MinusIcon, QuestionMarkCircleIcon } from '../icons/HeroIcons';
import { QuestionType } from '../../types';
import ChoiceButton from './ChoiceButton';
import { Header } from '../shared/Header';
import { useTranslation } from '../../i18n/I18nProvider';

interface WelcomeScreenProps {
  onSelect: (type: 'increase' | QuestionType) => void;
  onBack: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSelect, onBack }) => {
  const { t, isRTL } = useTranslation('sahw_assistant');
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header title={t('main.title')} onBack={onBack} isRTL={isRTL} />

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <p className="text-lg text-blue-700">{t('main.subtitle')}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
          <h2 className="text-xl font-bold text-blue-800 mb-6 text-center">{t('questions.type')}</h2>
          <div className="space-y-4">
            <ChoiceButton
              onClick={() => onSelect('increase')}
              icon={<PlusIcon className="w-7 h-7" />}
              text={t('buttons.increase')}
            />
            <ChoiceButton
              onClick={() => onSelect('decrease')}
              icon={<MinusIcon className="w-7 h-7" />}
              text={t('buttons.decrease')}
            />
            <ChoiceButton
              onClick={() => onSelect('doubt')}
              icon={<QuestionMarkCircleIcon className="w-7 h-7" />}
              text={t('buttons.doubt')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
