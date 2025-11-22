import React, { useState } from 'react';
import { ResearchDocument } from '../types';
import { FileText, X, Book, CheckSquare, Square, Table, Link as LinkIcon, Check } from 'lucide-react';

interface SourceManagerProps {
  documents: ResearchDocument[];
  onRemoveDocument: (id: string) => void;
  onSynthesize: (selectedDocIds: string[]) => void;
  disabled?: boolean;
}

export const SourceManager: React.FC<SourceManagerProps> = ({ documents, onRemoveDocument, onSynthesize, disabled }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleSynthesizeClick = () => {
    onSynthesize(Array.from(selectedIds));
    setSelectedIds(new Set()); // Reset after action
  };

  if (documents.length === 0) return null;

  return (
    <div className="mb-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Sources</h3>
          <span className="px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-medium">{documents.length}</span>
        </div>
        {selectedIds.size > 1 && (
          <button
            onClick={handleSynthesizeClick}
            disabled={disabled}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wide rounded-full shadow-sm hover:bg-zinc-800 transition-all animate-in zoom-in duration-200"
          >
            <Table size={10} />
            Synthesize ({selectedIds.size})
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {documents.map((doc) => {
          const isSelected = selectedIds.has(doc.id);
          const isUrl = doc.type === 'url';
          
          return (
            <div 
              key={doc.id} 
              className={`
                group relative flex items-center gap-2 pl-2 pr-1 py-1 border rounded-md transition-all cursor-pointer select-none
                ${isSelected 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-100' 
                  : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                }
              `}
              onClick={() => !disabled && toggleSelection(doc.id)}
            >
               <div className={`shrink-0 ${isSelected ? 'text-blue-500' : 'text-zinc-400'}`}>
                  {isUrl ? <LinkIcon size={12} /> : <FileText size={12} />}
               </div>
               
               <span className="text-xs font-medium max-w-[150px] truncate" title={doc.title}>
                 {doc.title}
               </span>

               <div className="flex items-center pl-2 border-l border-zinc-100 ml-1 gap-1">
                 <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveDocument(doc.id);
                    }}
                    disabled={disabled}
                    className="p-1 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                 >
                    <X size={12} />
                 </button>
               </div>
               
               {/* Selection Indicator */}
               <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full flex items-center justify-center transition-transform ${isSelected ? 'scale-100 bg-blue-500' : 'scale-0'}`}>
                  <Check size={8} className="text-white" />
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};