
import React, { useState } from 'react';
import { X, Table, Sparkles, Loader2 } from 'lucide-react';

interface SynthesisConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (dimensions: string[]) => void;
  documentCount: number;
}

export const SynthesisConfigModal: React.FC<SynthesisConfigModalProps> = ({ isOpen, onClose, onGenerate, documentCount }) => {
  const [dimensionsInput, setDimensionsInput] = useState('Hypothesis, Methodology, Key Findings, Limitations');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsSubmitting(true);
    const dimensions = dimensionsInput.split(',').map(d => d.trim()).filter(d => d.length > 0);
    onGenerate(dimensions);
    setIsSubmitting(false); // Parent will handle closing or state change
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Table className="text-blue-600" size={20} />
              Synthesis Matrix
            </h2>
            <p className="text-xs text-slate-500">Comparing {documentCount} documents</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Comparison Dimensions
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Enter comma-separated criteria (e.g., Sample Size, P-Values, Funding Source).
            </p>
            <textarea
              value={dimensionsInput}
              onChange={(e) => setDimensionsInput(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[100px]"
              placeholder="e.g. Methodology, Results, Conclusions..."
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 flex gap-2">
            <Sparkles size={16} className="shrink-0 mt-0.5" />
            <p>The AI will extract these specific details from each document and format them into a comparison table.</p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isSubmitting || !dimensionsInput.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Table size={18} />}
            Generate Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
