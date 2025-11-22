
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Copy, Check, Globe, ExternalLink, ArrowRightCircle, Sparkles, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { MermaidDiagram } from './MermaidDiagram';
import { SynthesisTable } from './SynthesisTable';
import { SynthesisData, GroundingMetadata } from '../types';

interface AnalysisOutputProps {
  content: string;
  isLoading: boolean;
  isStreaming: boolean;
  onFollowUpClick: (question: string) => void;
}

export const AnalysisOutput: React.FC<AnalysisOutputProps> = ({ content, isLoading, isStreaming, onFollowUpClick }) => {
  const [copied, setCopied] = useState(false);
  const [copiedQuestionIdx, setCopiedQuestionIdx] = useState<number | null>(null);
  const [allQuestionsCopied, setAllQuestionsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyQuestion = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQuestionIdx(index);
    setTimeout(() => setCopiedQuestionIdx(null), 2000);
  };

  const handleCopyAllQuestions = (questions: string[]) => {
    navigator.clipboard.writeText(questions.join('\n'));
    setAllQuestionsCopied(true);
    setTimeout(() => setAllQuestionsCopied(false), 2000);
  };

  if (!content && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl border border-zinc-100 shadow-sm p-8">
        <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-8 ring-1 ring-zinc-100 shadow-sm">
          <BookOpen className="w-10 h-10 text-zinc-300" strokeWidth={1.5} /> 
        </div>
        <h3 className="text-zinc-900 font-semibold text-xl mb-3 tracking-tight">Ready to Analyze</h3>
        <p className="text-zinc-500 text-sm text-center max-w-xs leading-relaxed">
          Select a mode, drag in your research papers, or type a hypothesis to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden transition-all duration-500">
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-white z-10">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
          <h3 className="font-semibold text-zinc-800 text-xs uppercase tracking-widest">Companion Output</h3>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-md transition-colors text-xs font-medium"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 bg-white scroll-smooth">
        {isLoading && !content ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-6 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
              <div className="relative bg-white p-3 rounded-full border border-blue-100 shadow-sm">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-500">Generating deep analysis...</p>
          </div>
        ) : (
          <div className="prose prose-zinc max-w-none markdown-body serif animate-slide-up">
            <ReactMarkdown
              components={{
                code({node, inline, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  
                  if (!inline) {
                    if (language === 'mermaid') {
                      return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
                    }
                    if (language === 'synthesis-json') {
                      try {
                        const jsonString = String(children).replace(/\n$/, '');
                        const data: SynthesisData = JSON.parse(jsonString);
                        return <SynthesisTable data={data} />;
                      } catch (e) {
                         return <div className="text-red-500 text-xs border border-red-100 bg-red-50 p-2 rounded">Error parsing synthesis table.</div>;
                      }
                    }
                    
                    // Socratic Parsing
                    if (language === 'socratic-json' || language === 'socratic' || (language === 'json' && String(children).includes('['))) {
                        try {
                           const rawContent = String(children).replace(/\n$/, '');
                           let questions: string[] = [];
                           try {
                             const parsed = JSON.parse(rawContent);
                             if (Array.isArray(parsed)) questions = parsed;
                           } catch (jsonError) {
                             const quotedMatches = rawContent.match(/"([^"]+)"/g);
                             if (quotedMatches && quotedMatches.length >= 1) {
                               questions = quotedMatches.map(q => q.replace(/^"|"$/g, ''));
                             } else {
                               const listMatches = rawContent.match(/^\d+\.\s+(.*)$/gm);
                               if (listMatches && listMatches.length >= 1) {
                                 questions = listMatches.map(q => q.replace(/^\d+\.\s+/, '').trim());
                               }
                             }
                           }
                           
                           if (!questions || questions.length === 0) return null;
                           
                           return (
                               <div className="mt-12 pt-8 border-t border-zinc-100 animate-fade-in not-prose font-sans">
                                   <div className="flex items-center justify-between mb-6">
                                       <div className="flex items-center gap-2 text-zinc-800">
                                           <Sparkles size={16} className="text-purple-600" />
                                           <span className="text-xs font-bold uppercase tracking-widest">Socratic Pivot (Deepen Research)</span>
                                       </div>
                                       <button 
                                           onClick={() => handleCopyAllQuestions(questions)}
                                           className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-full transition-colors"
                                       >
                                           {allQuestionsCopied ? <Check size={12} /> : <Copy size={12} />}
                                           <span>{allQuestionsCopied ? 'Copied' : 'Copy All'}</span>
                                       </button>
                                   </div>
                                   <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                                       {questions.map((q, idx) => (
                                           <div 
                                               key={idx}
                                               className="relative h-[4.5rem] w-full sm:w-[48%] flex-1 min-w-[300px] group"
                                           >
                                               {/* Placeholder to reserve space in the layout */}
                                               <div className="h-full w-full opacity-0 pointer-events-none"></div>
                                               
                                               {/* Floating Interactive Card */}
                                               <div className="absolute inset-x-0 top-0 flex items-stretch rounded-xl bg-white border border-purple-100 shadow-sm transition-all duration-300 ease-out origin-top z-0 group-hover:z-50 group-hover:h-auto group-hover:min-h-full group-hover:shadow-xl group-hover:border-purple-300 group-hover:-translate-y-1 overflow-hidden">
                                                   <button
                                                       onClick={() => onFollowUpClick(q)}
                                                       className="flex-1 text-left p-3.5 flex items-start gap-3 text-zinc-700 text-sm transition-colors rounded-l-xl min-w-0"
                                                   >
                                                       <ArrowRightCircle size={18} className="shrink-0 mt-0.5 text-purple-400 group-hover:text-purple-600 transition-colors" />
                                                       <span className="block font-medium leading-relaxed truncate w-full group-hover:whitespace-normal group-hover:overflow-visible">
                                                          {q}
                                                       </span>
                                                   </button>
                                                   <button
                                                       onClick={(e) => {
                                                           e.stopPropagation();
                                                           handleCopyQuestion(q, idx);
                                                       }}
                                                       className="px-3 shrink-0 flex items-center justify-center border-l border-purple-50 bg-purple-50/30 hover:bg-purple-50 text-purple-400 hover:text-purple-700 transition-colors rounded-r-xl"
                                                   >
                                                       {copiedQuestionIdx === idx ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                                   </button>
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           );
                        } catch (e) { return null; }
                    }
                    // Grounding Parsing
                    if (language === 'grounding-json') {
                        try {
                            const jsonString = String(children).replace(/\n$/, '');
                            const metadata: GroundingMetadata = JSON.parse(jsonString);
                            if (!metadata.groundingChunks || metadata.groundingChunks.length === 0) return null;

                            return (
                                <div className="mt-8 pt-6 border-t border-zinc-100 not-prose font-sans">
                                    <div className="flex items-center gap-2 mb-4 text-zinc-500">
                                        <Globe size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Verified Sources</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {metadata.groundingChunks.map((chunk, i) => {
                                            if (!chunk.web) return null;
                                            return (
                                                <a 
                                                    key={i} 
                                                    href={chunk.web.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-xs hover:border-blue-300 hover:shadow-sm transition-all no-underline text-zinc-600 hover:text-blue-700"
                                                >
                                                    <span className="truncate max-w-[200px] font-medium">{chunk.web.title}</span>
                                                    <ExternalLink size={10} className="opacity-50 group-hover:opacity-100" />
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        } catch (e) { return null; }
                    }
                  }

                  return !inline && match ? (
                    <div className="relative group my-6 not-prose font-sans">
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 bg-white px-2 py-1 rounded border border-zinc-200 shadow-sm">
                          {match[1]}
                        </span>
                      </div>
                      <code className={`${className} block bg-zinc-50 p-4 rounded-lg border border-zinc-200 text-zinc-800 overflow-x-auto text-sm leading-relaxed`} {...props}>
                        {children}
                      </code>
                    </div>
                  ) : (
                    <code className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded text-[0.9em] font-mono border border-zinc-200" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-zinc-300 ml-1 animate-pulse align-middle"></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
