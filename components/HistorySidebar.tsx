
import React from 'react';
import { Session, ResearchMode } from '../types';
import { Plus, Trash2, Brain, Network, ShieldCheck, Sparkles, MessageSquare, Clock, X, Video, ExternalLink } from 'lucide-react';
import { MODES } from '../constants';

interface HistorySidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (session: Session) => void;
  onNewSession: () => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isOpen,
  onClose,
}) => {
  
  const getModeIcon = (modeId: ResearchMode) => {
    const mode = MODES[modeId];
    if (!mode) return <MessageSquare size={14} />;
    
    switch (mode.icon) {
      case 'Brain': return <Brain size={14} className="text-amber-600" />;
      case 'Network': return <Network size={14} className="text-violet-600" />;
      case 'ShieldCheck': return <ShieldCheck size={14} className="text-emerald-600" />;
      default: return <Sparkles size={14} className="text-slate-600" />;
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-50 border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-bold text-sm text-slate-700 tracking-wide uppercase">History</h2>
          <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* New Analysis Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 px-4 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm group"
          >
            <Plus size={16} className="text-slate-400 group-hover:text-blue-500" />
            New Analysis
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs text-center px-6">
              <Clock size={24} className="mb-3 opacity-20" />
              <p className="font-medium">No research history</p>
              <p className="opacity-70 mt-1">Your analyses will be saved here automatically.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  group relative flex flex-col gap-1 p-3 rounded-lg cursor-pointer border transition-all duration-200
                  ${currentSessionId === session.id 
                    ? 'bg-white border-slate-200 shadow-sm ring-1 ring-slate-200 z-10' 
                    : 'border-transparent hover:bg-white hover:border-slate-200'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden w-full">
                    <div className={`shrink-0 mt-0.5 p-1 rounded-md ${currentSessionId === session.id ? 'bg-slate-100' : 'bg-white group-hover:bg-slate-50'}`}>
                      {getModeIcon(session.mode)}
                    </div>
                    <h3 className={`text-sm font-medium truncate flex-1 ${currentSessionId === session.id ? 'text-slate-900' : 'text-slate-600'}`}>
                      {session.title || 'Untitled Research'}
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-1 pl-8">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {formatRelativeTime(session.timestamp)}
                  </span>
                  
                  <button
                    onClick={(e) => onDeleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                    title="Delete analysis"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paupanimation Promo Card */}
        <div className="p-4 border-t border-slate-200 bg-gradient-to-b from-slate-50 to-blue-50/50">
          <div className="bg-white border border-blue-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <Video size={16} />
              </div>
              <h3 className="text-xs font-bold text-slate-700">Need Dissemination?</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              You have the logic. Now you need the visual. I turn complex research into clear <strong>2D animations, infographics, and interactive apps.</strong>
            </p>
            <a 
              href="https://paupanimation.net/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 w-full py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              Visit Paupanimation <ExternalLink size={10} />
            </a>
          </div>
          <div className="mt-3 text-center">
             <a 
                href="https://www.linkedin.com/in/pau-palazon-radford-531299147"
                target="_blank"
                rel="noopener noreferrer" 
                className="text-[10px] text-slate-400 hover:text-blue-600 transition-colors font-medium"
             >
               Created by Pau Palazón Radford
             </a>
          </div>
        </div>
      </div>
    </>
  );
};
