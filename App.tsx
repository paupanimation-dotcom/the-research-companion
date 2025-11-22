
import React, { useState, useEffect } from 'react';
import { ResearchMode, Session, ResearchDocument } from './types';
import { ModeSelector } from './components/ModeSelector';
import { AnalysisOutput } from './components/AnalysisOutput';
import { streamResearchAnalysis, generateSynthesisMatrix } from './services/geminiService';
import { PLACEHOLDERS } from './constants';
import { FileUploader } from './components/FileUploader';
import { FileImporter } from './components/FileImporter';
import { HistorySidebar } from './components/HistorySidebar';
import { SourceManager } from './components/SourceManager';
import { ExportMenu } from './components/ExportMenu';
import { SynthesisConfigModal } from './components/SynthesisConfigModal';
import { InfoModal } from './components/InfoModal';
import { Sparkles, Eraser, ArrowRight, Menu, Network, Info, Globe, Link as LinkIcon, Check, X as XIcon } from 'lucide-react';

const getRandomPlaceholder = () => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];

const App: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [documents, setDocuments] = useState<ResearchDocument[]>([]);
  const [selectedMode, setSelectedMode] = useState<ResearchMode>(ResearchMode.BIAS);
  const [analysisContent, setAnalysisContent] = useState('');
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [placeholder, setPlaceholder] = useState(getRandomPlaceholder());
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [shouldVisualize, setShouldVisualize] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [isSynthesisModalOpen, setIsSynthesisModalOpen] = useState(false);
  const [selectedDocIdsForSynthesis, setSelectedDocIdsForSynthesis] = useState<string[]>([]);
  
  // Link Input State
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState('');

  useEffect(() => {
    const savedSessions = localStorage.getItem('research_companion_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        const migrated = parsed.map((s: any) => ({ ...s, documents: s.documents || [] }));
        setSessions(migrated);
      } catch (e) { console.error("Failed to parse sessions", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('research_companion_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const addDocument = (text: string, filename: string, type?: 'pdf' | 'txt' | 'md' | 'url') => {
    const docType = type || (filename.toLowerCase().endsWith('.pdf') ? 'pdf' : filename.toLowerCase().endsWith('.md') ? 'md' : 'txt');
    const newDoc: ResearchDocument = { id: crypto.randomUUID(), title: filename, content: text, type: docType as any, uploadTimestamp: Date.now() };
    setDocuments(prev => [...prev, newDoc]);
  };

  const removeDocument = (id: string) => setDocuments(prev => prev.filter(doc => doc.id !== id));
  const handleFileLoaded = (text: string, filename: string) => addDocument(text, filename);
  const handleFileImport = (text: string, filename: string) => addDocument(text, filename);

  const confirmLinkInput = () => {
    if (linkInputValue.trim()) {
        addDocument("", linkInputValue.trim(), 'url');
        setUseSearch(true);
        setLinkInputValue('');
        setShowLinkInput(false);
    }
  };

  const cancelLinkInput = () => {
      setLinkInputValue('');
      setShowLinkInput(false);
  };

  const saveCurrentSession = (finalContent: string) => {
    const title = inputText.trim().substring(0, 50) + (inputText.length > 50 ? '...' : '') || (documents.length > 0 ? `Analysis of ${documents[0].title}` : 'Untitled Analysis');
    const timestamp = Date.now();
    if (currentSessionId) {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, inputText, analysisContent: finalContent, mode: selectedMode, title, timestamp, documents } : s).sort((a, b) => b.timestamp - a.timestamp));
    } else {
      const newSession: Session = { id: crypto.randomUUID(), title, mode: selectedMode, inputText, analysisContent: finalContent, timestamp, documents };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
    }
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setInputText('');
    setAnalysisContent('');
    setDocuments([]);
    setSelectedMode(ResearchMode.BIAS);
    setPlaceholder(getRandomPlaceholder());
    setIsSidebarOpen(false);
    setShouldVisualize(false);
    setUseSearch(false);
  };

  const handleSelectSession = (session: Session) => {
    setCurrentSessionId(session.id);
    setInputText(session.inputText);
    setAnalysisContent(session.analysisContent);
    setSelectedMode(session.mode);
    setDocuments(session.documents || []);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) handleNewSession();
  };

  const handleOpenSynthesis = (docIds: string[]) => {
    setSelectedDocIdsForSynthesis(docIds);
    setIsSynthesisModalOpen(true);
  };

  const handleRunSynthesis = async (dimensions: string[]) => {
    setIsSynthesisModalOpen(false);
    setIsStreaming(true);
    setAnalysisContent(prev => prev + `\n\n## Synthesis Matrix\nRunning comparative analysis on ${selectedDocIdsForSynthesis.length} documents...\n\n`);
    const selectedDocs = documents.filter(d => selectedDocIdsForSynthesis.includes(d.id));
    try {
        const jsonResult = await generateSynthesisMatrix(selectedDocs, dimensions);
        const tableBlock = `\n\`\`\`synthesis-json\n${jsonResult}\n\`\`\`\n`;
        setAnalysisContent(prev => prev + tableBlock);
        saveCurrentSession(analysisContent + tableBlock);
    } catch (e) {
        setAnalysisContent(prev => prev + "\n**Error generating synthesis matrix.**");
    } finally {
        setIsStreaming(false);
        setSelectedDocIdsForSynthesis([]);
    }
  };

  const handleAnalyze = async (textOverride?: string, previousContext?: string) => {
    const textToAnalyze = textOverride !== undefined ? textOverride : inputText;
    if (!textToAnalyze.trim() && documents.length === 0) return;
    setIsStreaming(true);
    setAnalysisContent('');
    let fullResponse = '';
    try {
      const stream = streamResearchAnalysis(textToAnalyze, selectedMode, documents, shouldVisualize, useSearch, previousContext);
      for await (const chunk of stream) {
        fullResponse += chunk;
        setAnalysisContent(prev => prev + chunk);
      }
      saveCurrentSession(fullResponse);
    } catch (error) { console.error("Error in analysis stream:", error); } 
    finally { setIsStreaming(false); setShouldVisualize(false); }
  };

  const handleFollowUpClick = (question: string) => {
      const currentContext = analysisContent;
      setInputText(question);
      handleAnalyze(question, currentContext);
  };

  const handleClearView = () => {
    if (window.confirm("Clear text and analysis?")) {
        setInputText('');
        setAnalysisContent('');
    }
  };

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 overflow-hidden font-sans">
      
      <HistorySidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-full relative w-full min-w-0">
        
        {/* Refined Minimal Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 shrink-0 z-20 sticky top-0">
          <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-zinc-500"><Menu size={20} /></button>
              <div className="flex items-center gap-2.5">
                <div className="bg-zinc-900 text-white p-1.5 rounded-md shadow-sm"><Sparkles size={16} /></div>
                <div>
                  <h1 className="font-bold text-sm text-zinc-900 tracking-tight">The Research Companion</h1>
                  <p className="text-[10px] text-zinc-400 font-medium -mt-0.5">Cognitive Prosthesis v1.0</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               <ExportMenu 
                inputText={inputText}
                analysisContent={analysisContent}
                mode={selectedMode}
                documents={documents}
                disabled={!analysisContent && !inputText && documents.length === 0}
              />
               <span className="h-4 w-px bg-zinc-200 hidden sm:block"></span>
               <button onClick={() => setIsInfoOpen(true)} className="text-zinc-400 hover:text-zinc-800 transition-colors"><Info size={18} /></button>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto bg-zinc-50">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 min-h-full flex flex-col">
            
            <ModeSelector selectedMode={selectedMode} onSelectMode={setSelectedMode} disabled={isStreaming} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[600px]">
              
              {/* Input Column */}
              <div className="flex flex-col gap-4">
                
                {/* Floating Input Card */}
                <div className="flex flex-col flex-1 bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative focus-within:ring-1 focus-within:ring-zinc-300">
                  
                  {/* Toolbar Area */}
                  <div className="px-4 py-3 border-b border-zinc-100 bg-white flex flex-wrap items-center gap-3 z-10">
                     <div className="flex items-center gap-2 mr-auto">
                        <FileUploader onFileLoaded={handleFileLoaded} disabled={isStreaming} />
                        
                        {/* Inline Link Input */}
                        {showLinkInput ? (
                            <div className="flex items-center gap-1 bg-zinc-50 rounded-lg border border-zinc-200 p-0.5 animate-in slide-in-from-left-2 fade-in duration-200">
                                <input 
                                    autoFocus
                                    type="url"
                                    value={linkInputValue}
                                    onChange={(e) => setLinkInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && confirmLinkInput()}
                                    placeholder="Paste URL..."
                                    className="bg-transparent border-none outline-none text-xs w-40 px-2 py-1 text-zinc-800 placeholder:text-zinc-400"
                                />
                                <button onClick={confirmLinkInput} className="p-1 hover:bg-green-100 text-zinc-400 hover:text-green-600 rounded-md"><Check size={12} /></button>
                                <button onClick={cancelLinkInput} className="p-1 hover:bg-red-100 text-zinc-400 hover:text-red-600 rounded-md"><XIcon size={12} /></button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setShowLinkInput(true)} 
                                disabled={isStreaming} 
                                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded transition-colors" 
                                title="Add Link"
                            >
                                <LinkIcon size={16} />
                            </button>
                        )}
                     </div>
                     
                     <div className="flex items-center gap-2">
                        <span className="w-px h-4 bg-zinc-200 mx-1"></span>
                        <button
                          onClick={() => setShouldVisualize(!shouldVisualize)}
                          disabled={isStreaming}
                          className={`p-1.5 rounded-md transition-all ${shouldVisualize ? 'bg-blue-50 text-blue-600' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'}`}
                          title="Visualize Logic"
                        >
                          <Network size={16} />
                        </button>
                        <button
                          onClick={() => setUseSearch(!useSearch)}
                          disabled={isStreaming}
                          className={`p-1.5 rounded-md transition-all ${useSearch ? 'bg-blue-50 text-blue-600' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600'}`}
                          title="Web Search Grounding"
                        >
                          <Globe size={16} />
                        </button>
                        <button onClick={handleClearView} disabled={(!inputText && !analysisContent)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Clear Text"><Eraser size={16} /></button>
                     </div>
                  </div>

                  {/* Input & Bookshelf Area */}
                  <div className="flex-1 flex flex-col relative">
                    <div className="px-4 pt-3">
                         <SourceManager documents={documents} onRemoveDocument={removeDocument} onSynthesize={handleOpenSynthesis} disabled={isStreaming} />
                         <FileImporter onFileParsed={handleFileImport} disabled={isStreaming} isCompact={documents.length > 0} />
                    </div>
                    
                    <textarea
                      value={inputText}
                      onChange={handleInputChange}
                      placeholder={documents.length > 0 ? "Ask a question about your sources..." : placeholder}
                      className="flex-1 w-full p-5 resize-none focus:outline-none text-base text-zinc-800 leading-relaxed placeholder:text-zinc-300 serif bg-transparent"
                      disabled={isStreaming}
                    />
                    
                    {/* Floating Action Button for Analysis */}
                    <div className="absolute bottom-5 right-5">
                       <button
                          onClick={() => handleAnalyze()}
                          disabled={(!inputText.trim() && documents.length === 0) || isStreaming}
                          className={`
                            flex items-center gap-2 pl-5 pr-4 py-3 rounded-full font-bold text-sm transition-all
                            ${(!inputText.trim() && documents.length === 0) || isStreaming 
                              ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed' 
                              : 'bg-zinc-900 text-white hover:bg-black hover:scale-105 active:scale-95 ring-1 ring-black/10 shadow-lg shadow-blue-900/20'
                            }
                          `}
                        >
                          {isStreaming ? 'Thinking...' : 'Run Analysis'}
                          {!isStreaming && <ArrowRight size={16} />}
                        </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Output Column */}
              <div className="flex flex-col h-full min-h-[500px] bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                 <AnalysisOutput 
                    content={analysisContent}
                    isLoading={isStreaming && !analysisContent}
                    isStreaming={isStreaming}
                    onFollowUpClick={handleFollowUpClick}
                  />
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <SynthesisConfigModal isOpen={isSynthesisModalOpen} onClose={() => setIsSynthesisModalOpen(false)} onGenerate={handleRunSynthesis} documentCount={selectedDocIdsForSynthesis.length} />
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </div>
  );
};

export default App;
