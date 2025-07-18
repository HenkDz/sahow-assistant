
import React from 'react';
import { QuestionType, ResultKey, Language } from '../../types';
import ChoiceButton from './ChoiceButton';
import { Header } from '../Header';

interface QuestionScreenProps {
  questionType: QuestionType | null;
  onSelect: (key: ResultKey) => void;
  onBack: () => void;
  t: Record<string, string>;
  lang: Language;
}

const QuestionScreen: React.FC<QuestionScreenProps> = ({ questionType, onSelect, onBack, t, lang }) => {
  if (!questionType) return null;
  const isDecrease = questionType === 'decrease';
  
  const questionKey = isDecrease ? 'q_decrease_type' : 'q_doubt_type';
  const descriptionKey = isDecrease ? 'q_decrease_desc' : 'q_doubt_desc';
  
  const options = isDecrease 
    ? [
        { key: 'decrease_wajib', text: t.btn_decrease_wajib },
        { key: 'decrease_rukn', text: t.btn_decrease_rukn },
      ] 
    : [
        { key: 'doubt_prevail', text: t.btn_doubt_yes },
        { key: 'doubt_no_prevail', text: t.btn_doubt_no },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Header title={t[questionKey]} onBack={onBack} isRTL={lang === 'ar'} />

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <p className="text-lg text-blue-700">{t[descriptionKey]}</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
          <div className="space-y-4">
            {options.map(option => (
              <ChoiceButton
                key={option.key}
                onClick={() => onSelect(option.key as ResultKey)}
                text={option.text}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionScreen;
