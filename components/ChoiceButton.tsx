
import React from 'react';

interface ChoiceButtonProps {
  onClick: () => void;
  text: string;
  icon?: React.ReactNode;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ onClick, text, icon }) => {
  return (
    <button
      onClick={onClick}
      className="group flex items-center justify-center w-full gap-3 text-lg font-bold text-white bg-blue-600 rounded-xl px-6 py-4 transition-all duration-200 ease-in-out hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {icon && <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>}
      <span>{text}</span>
    </button>
  );
};

export default ChoiceButton;
