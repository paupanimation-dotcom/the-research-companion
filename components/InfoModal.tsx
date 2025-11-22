
import React from 'react';
import { X, Brain, Network, ShieldCheck, Sparkles, Info, Lock, Cpu, BookOpen, Globe, AlertTriangle, Users, Palette, ExternalLink } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Info className="text-blue-600" size={24} />
              About The Research Companion
            </h2>
            <p className="text-sm text-slate-500">Philosophy, Capabilities, and Reliability</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 text-slate-700">
          
          {/* Meet the Creator / Paupanimation */}
          <section className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Palette size={120} />
            </div>
            <div className="relative z-10">
                <h3 className="flex items-center gap-2 text-sm font-bold text-blue-300 uppercase tracking-widest mb-3">
                  <Users size={16} /> Meet the Creator
                </h3>
                <p className="text-lg font-semibold mb-2">Built by Pau Palazón Radford</p>
                <p className="text-sm text-slate-300 leading-relaxed mb-4 max-w-lg">
                  I created this tool because I understand the complexity of research. My day job isn't just coding—it's <strong>Research Dissemination</strong>. 
                  <br/><br/>
                  I run <strong>Paupanimation</strong>, a specialist 2D animation studio that helps researchers, universities (like UCL, Bristol, UPenn), and NGOs translate complex findings into clear, evidence-based explainer videos.
                </p>
                <div className="flex flex-wrap gap-3">
                    <a 
                        href="https://paupanimation.net/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-md"
                    >
                        View My Portfolio <ExternalLink size={14} />
                    </a>
                    <a 
                        href="https://www.linkedin.com/in/pau-palazon-radford-531299147" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700"
                    >
                        Connect on LinkedIn <ExternalLink size={14} />
                    </a>
                </div>
            </div>
          </section>

          {/* Philosophy: The Centaur Model */}
          <section className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
            <h3 className="flex items-center gap-2 text-sm font-bold text-blue-700 uppercase tracking-widest mb-2">
              <Brain size={16} /> The Centaur Model (Philosophy)
            </h3>
            <p className="text-sm leading-relaxed text-slate-700 mb-3">
              <strong>You are the Executive. The AI is the Engine.</strong>
            </p>
            <p className="text-sm leading-relaxed text-slate-600">
              In advanced chess, a "Centaur" (Human + AI) beats both pure humans and pure supercomputers. 
              This tool is designed to facilitate that symbiosis. 
              You provide the <strong>Judgment</strong> (Context, Ethics, Novelty). 
              The AI provides the <strong>Scale</strong> (Pattern Matching, Synthesis, Speed).
              <br/><br/>
              <em>Do not use this tool to replace your thinking. Use it to challenge and expand it.</em>
            </p>
          </section>

          {/* Structural Limitations (Intellectual Honesty) */}
          <section className="bg-amber-50/50 p-5 rounded-xl border border-amber-100">
             <h3 className="flex items-center gap-2 text-sm font-bold text-amber-700 uppercase tracking-widest mb-2">
              <AlertTriangle size={16} /> Structural Limitations
            </h3>
            <div className="space-y-3 text-sm text-slate-600">
              <p>
                <strong>1. The Hallucination Risk (Epistemic Fragility):</strong><br/>
                This model is a probabilistic engine, not a truth database. It can generate plausible-sounding but non-existent citations. 
                <span className="block mt-1 text-amber-800 font-medium">Mitigation: Always use the "Web Grounding" toggle to verify facts.</span>
              </p>
              <p>
                <strong>2. Regression to the Mean:</strong><br/>
                By default, AI models output the "average" consensus of their training data. They naturally suppress outlier ideas.
                <span className="block mt-1 text-amber-800 font-medium">Mitigation: Explicitly ask the model to be "radical", "contrarian", or "novel" in your prompts.</span>
              </p>
            </div>
          </section>

          {/* The 4 Modes */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
              Core Intelligence Modes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-amber-700 font-bold">
                  <Brain size={18} /> Kahneman Mode
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Bias Detection.</strong> Flag confirmation bias, base-rate neglect, and "What You See Is All There Is" (WYSIATI) errors. Forces System 2 thinking.
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-violet-700 font-bold">
                  <Network size={18} /> Medici Mode
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Cross-Disciplinary Insight.</strong> Finds patterns and analogies from unrelated fields (e.g., Biology → Economics) to spark novel hypotheses.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-emerald-700 font-bold">
                  <ShieldCheck size={18} /> Taleb Mode
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Integrity Audit.</strong> Checks for p-hacking, non-reproducible methods, and fragile assumptions. Estimates prior probabilities.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-slate-700 font-bold">
                  <Sparkles size={18} /> General Mode
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Holistic Partner.</strong> A balanced mix of all modes for writing assistance, summarization, and general inquiry.
                </p>
              </div>
            </div>
          </section>

          {/* Reliability & Features */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
              Reliability & Trust Mechanisms
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="shrink-0 p-2 bg-blue-100 text-blue-600 rounded-lg h-fit"><Globe size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Deep Search Grounding (Real-Time Verification)</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Toggle the "Web Search" icon to connect the AI to live Google Search. This allows the model to verify claims against real-world sources, find the latest papers, and provide clickable citations to reduce hallucinations.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 p-2 bg-blue-100 text-blue-600 rounded-lg h-fit"><BookOpen size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Active Source Management</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Unlike standard chatbots, this tool maintains a strict "Bookshelf" of your uploaded PDFs/Docs. It cites specific documents in its analysis.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 p-2 bg-blue-100 text-blue-600 rounded-lg h-fit"><Cpu size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Powered by Gemini 3.0 Pro</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Uses Google's most advanced reasoning model with a dedicated "Thinking Budget" to process complex logic before responding.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 p-2 bg-blue-100 text-blue-600 rounded-lg h-fit"><Lock size={18} /></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Local-First Privacy</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Your session history is stored in your browser's LocalStorage. We do not retain your research data on a central server.
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
