
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, AlertCircle, Loader2, CheckCircle, Plus } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import mammoth from 'mammoth';
// @ts-ignore
import JSZip from 'jszip';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@4.4.168/build/pdf.worker.mjs';

interface FileImporterProps {
  onFileParsed: (text: string, filename: string) => void;
  disabled?: boolean;
  isCompact?: boolean;
}

export const FileImporter: React.FC<FileImporterProps> = ({ onFileParsed, disabled, isCompact = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setError(null);
    setSuccessMsg(null);
    setIsProcessing(true);

    let successCount = 0;
    const errors: string[] = [];

    for (const file of acceptedFiles) {
      try {
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 5MB limit.`);
        }

        let text = '';
        if (file.type === 'application/pdf') {
          text = await readPdfText(file);
        } else if (
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          file.name.endsWith('.docx')
        ) {
          text = await readDocxText(file);
        } else if (
          file.type === 'application/vnd.oasis.opendocument.text' ||
          file.name.endsWith('.odt')
        ) {
          text = await readOdtText(file);
        } else if (
          file.type === 'text/plain' || 
          file.name.endsWith('.md') || 
          file.name.endsWith('.txt')
        ) {
          text = await readFileAsText(file);
        } else {
          throw new Error(`File ${file.name} has unsupported format.`);
        }

        if (!text.trim()) {
          throw new Error(`Could not extract text from ${file.name}.`);
        }

        onFileParsed(text, file.name);
        successCount++;

      } catch (err) {
        console.error(`Import error for ${file.name}:`, err);
        errors.push(err instanceof Error ? err.message : `Failed to parse ${file.name}`);
      }
    }

    setIsProcessing(false);

    if (errors.length > 0) {
      setError(errors.length === 1 ? errors[0] : `${errors.length} files failed to load.`);
    }
    
    if (successCount > 0) {
      setSuccessMsg(`Loaded ${successCount} file${successCount !== 1 ? 's' : ''}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }

  }, [onFileParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt', '.md'],
      'text/markdown': ['.md'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.oasis.opendocument.text': ['.odt']
    },
    multiple: true,
    disabled: disabled || isProcessing
  });

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read text file."));
      reader.readAsText(file);
    });
  };

  const readPdfText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const maxPages = Math.min(pdf.numPages, 50); 
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .filter((item: any) => typeof item.str === 'string')
          .map((item: any) => item.str)
          .join(' ');
          
        fullText += `[Page ${i}]\n${pageText}\n\n`;
      }
      return fullText;
    } catch (e) {
      console.error(e);
      throw new Error("Failed to parse PDF. Ensure it is not password protected.");
    }
  };

  const readDocxText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (e) {
      console.error(e);
      throw new Error("Failed to parse DOCX file.");
    }
  };

  const readOdtText = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = new JSZip();
      const content = await zip.loadAsync(arrayBuffer);
      const xmlContent = await content.file("content.xml")?.async("string");
      
      if (!xmlContent) {
        throw new Error("Invalid ODT file structure.");
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const paragraphs = xmlDoc.getElementsByTagName("text:p");
      
      let text = "";
      for (let i = 0; i < paragraphs.length; i++) {
        // Add simple newline for paragraphs
        if (paragraphs[i].textContent) {
            text += paragraphs[i].textContent + "\n\n";
        }
      }
      return text;
    } catch (e) {
      console.error(e);
      throw new Error("Failed to parse ODT file.");
    }
  };

  return (
    <div className="mb-4">
      <div
        {...getRootProps()}
        className={`
          relative group border-2 border-dashed rounded-xl text-center transition-all duration-200 ease-in-out outline-none
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50/50' 
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'border-red-200 bg-red-50/30' : ''}
          ${successMsg ? 'border-green-200 bg-green-50/30' : ''}
          ${isCompact ? 'p-3 flex items-center justify-center gap-3' : 'p-6'}
        `}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className={`flex items-center ${isCompact ? 'gap-2' : 'flex-col'}`}>
            <Loader2 className={`animate-spin text-blue-600 ${isCompact ? 'w-4 h-4' : 'w-6 h-6 mb-2'}`} />
            <span className="text-sm font-medium text-blue-600">Processing...</span>
          </div>
        ) : successMsg ? (
           <div className={`flex items-center text-green-600 ${isCompact ? 'gap-2' : 'flex-col'}`}>
            <CheckCircle className={`${isCompact ? 'w-4 h-4' : 'w-6 h-6 mb-2'}`} />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        ) : error ? (
          <div className={`flex items-center text-red-500 ${isCompact ? 'gap-2' : 'flex-col'}`}>
            <AlertCircle className={`${isCompact ? 'w-4 h-4' : 'w-6 h-6 mb-2'}`} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        ) : (
          isCompact ? (
            // Compact View
            <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-500 transition-colors">
              <Plus size={16} />
              <span className="text-xs font-medium">Drag more files (PDF, DOCX, ODT, TXT)</span>
            </div>
          ) : (
            // Full View
            <div className="flex flex-col items-center justify-center gap-2">
              <div className={`
                p-3 rounded-full bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600 group-hover:shadow-sm transition-all
                ${isDragActive ? 'bg-white text-blue-500 scale-110' : ''}
              `}>
                {isDragActive ? <FileText size={24} /> : <UploadCloud size={24} />}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">
                  {isDragActive ? "Drop to analyze" : "Drag & drop research files"}
                </p>
                <p className="text-xs text-slate-400">
                  Supports PDF, DOCX, ODT, TXT, MD (Max 5MB)
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};