
import React from 'react';
import { QuestionType, ResultKey } from '../../types';
import ChoiceButton from './ChoiceButton';
import { Header } from '../Header';
import { useTranslation } from '../../i18n/I18nProvider';

interface QuestionScreenProps {
  questionType: QuestionType | null;
  onSelect: (key: ResultKey) => void;
  onBack: () => void;
}

const QuestionScreen: React.FC<QuestionScreenProps> = ({ questionType, onSelect, onBack }) => {
  const { t, isRTL } = useTranslation();
  
  if (!questionType) return null;
  const isDecrease = questionType === 'decrease';
  
  const questionKey = isDecrease ? 'sahw_assistant:questions.decrease_type' : 'sahw_assistant:questions.doubt_type';
  const descriptionKey = isDecrease ? 'sahw_assistant:questions.decrease_desc' : 'sahw_assistant:questions.doubt_desc';
  
  const choices = isDecrease ? [
    { key: 'decrease_wajib', text: t('sahw_assistant:buttons.decrease_wajib') },
    { key: 'decrease_rukn', text: t('sahw_assistant:buttons.decrease_rukn') },
  ] : [
    { key: 'doubt_prevail', text: t('sahw_assistant:buttons.doubt_yes') },
    { key: 'doubt_no_prevail', text: t('sahw_assistant:buttons.doubt_no') },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 ${isRTL ? 'font-[Tajawal]' : 'font-[Inter]'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header title={t(questionKey)} onBack={onBack} isRTL={isRTL} />

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <p className="text-lg text-blue-700">{t(descriptionKey)}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
          <div className="space-y-4">
            {choices.map(choice => (
              <ChoiceButton
                key={choice.key}
                onClick={() => onSelect(choice.key as ResultKey)}
                text={choice.text}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionScreen;
