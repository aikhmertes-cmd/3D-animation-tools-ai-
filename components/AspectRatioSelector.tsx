import React from 'react';

export const supportedAspectRatios = ['16:9', '4:3', '1:1', '3:4', '9:16'] as const;
export type AspectRatio = typeof supportedAspectRatios[number];

interface AspectRatioSelectorProps {
  selectedRatio: AspectRatio;
  onSelectRatio: (ratio: AspectRatio) => void;
  isDisabled: boolean;
}

const RatioIcon: React.FC<{ ratio: AspectRatio }> = ({ ratio }) => {
  const baseClasses = "fill-current w-6 h-6";
  const getRectProps = () => {
    switch (ratio) {
      case '16:9': return { x: 3, y: 8, width: 18, height: 8, rx: 1 };
      case '4:3': return { x: 4, y: 6, width: 16, height: 12, rx: 1 };
      case '1:1': return { x: 5, y: 5, width: 14, height: 14, rx: 1 };
      case '3:4': return { x: 6, y: 4, width: 12, height: 16, rx: 1 };
      case '9:16': return { x: 8, y: 3, width: 8, height: 18, rx: 1 };
      default: return {};
    }
  };

  return (
    <svg viewBox="0 0 24 24" className={baseClasses}>
      <rect {...getRectProps()} />
    </svg>
  );
};


const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);


const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedRatio, onSelectRatio, isDisabled }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-2 flex flex-col items-center border border-gray-700 space-y-1 self-center md:self-start">
      {supportedAspectRatios.map((ratio) => {
        const isSelected = selectedRatio === ratio;
        const buttonClasses = `
          w-full flex items-center justify-center p-2 rounded-md transition-all duration-200 
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isSelected 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/50' 
            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
          }
        `;
        return (
          <button
            key={ratio}
            onClick={() => onSelectRatio(ratio)}
            disabled={isDisabled}
            className={buttonClasses}
            aria-pressed={isSelected}
            aria-label={`Aspect ratio ${ratio}`}
          >
            <RatioIcon ratio={ratio} />
            <span className="font-semibold text-sm w-10 text-center">{ratio}</span>
            {isSelected && <CheckIcon />}
          </button>
        );
      })}
    </div>
  );
};

export default AspectRatioSelector;