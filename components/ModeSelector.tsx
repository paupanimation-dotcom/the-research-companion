import React from 'react';
import { ResearchMode } from '../types';
import { MODES } from '../constants';
import { Brain, Network, ShieldCheck, Sparkles } from 'lucide-react';

interface ModeSelectorProps {
  selectedMode: ResearchMode;
  onSelectMode: (mode: ResearchMode) => void;
  disabled: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ selectedMode, onSelectMode, disabled }) => {
  const getIcon = (iconName: string, size: number = 18) => {
    switch (iconName) {
      case 'Brain': return <Brain size={size} />;
      case 'Network': return <Network size={size} />;
      case 'ShieldCheck': return <ShieldCheck size={size} />;
      default: return <Sparkles size={size} />;
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {Object.values(MODES).map((mode) => {
        const isActive = selectedMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onSelectMode(mode.id)}
            disabled={disabled}
            className={`
              relative flex flex-col items-start p-3 rounded-lg border transition-all duration-200 text-left group
              ${isActive 
                ? 'bg-white border-zinc-800 shadow-md ring-1 ring-black/5 z-10' 
                : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-2 mb-1.5 w-full">
              <div className={`
                p-1.5 rounded-md transition-colors 
                ${isActive ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 group-hover:text-zinc-700'}
              `}>
                 {getIcon(mode.icon)}
              </div>
              <div className="flex flex-col">
                <h3 className={`font-semibold text-sm leading-none ${isActive ? 'text-zinc-900' : 'text-zinc-600'}`}>
                  {mode.title}
                </h3>
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide mt-0.5">
                  {mode.subtitle}
                </span>
              </div>
            </div>
            <p className={`text-[11px] leading-relaxed line-clamp-2 ${isActive ? 'text-zinc-600' : 'text-zinc-400'}`}>
              {mode.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};