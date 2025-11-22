
import React, { useRef, useState } from 'react';
import { Paperclip, Loader2, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import mammoth from 'mammoth';
// @ts-ignore
import JSZip from 'jszip';

// Set worker source dynamically to match the library version from the CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@4.4.168/build/pdf.worker.mjs';

interface FileUploaderProps {
  onFileLoaded: (text: string, filename: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoaded, onError, disabled }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      let text = '';
      if (file.type === 'text/plain') {
        text = await readFileAsText(file);
      } else if (file.type === 'application/pdf') {
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
      } else {
        throw new Error('Unsupported file type. Please upload .txt, .pdf, .docx, or .odt files.');
      }

      if (!text.trim()) {
         throw new Error('No text could be extracted from this file.');
      }

      onFileLoaded(text, file.name);
    } catch (err) {
      console.error("File upload error:", err);
      const msg = err instanceof Error ? err.message : 'Failed to process file.';
      setError(msg);
      if (onError) {
        onError(msg);
      }
      // Clear error after a few seconds
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsProcessing(false);
      // Reset input value to allow selecting the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Safely extract string items
        const pageText = textContent.items
          .filter((item: any) => typeof item.str === 'string')
          .map((item: any) => item.str)
          .join(' ');
          
        fullText += `[Page ${i}]\n${pageText}\n\n`;
      }
      return fullText;
    } catch (e) {
      console.error(e);
      throw new Error("Failed to parse PDF. It might be password protected or contain only images (scanned).");
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
    <div className="relative inline-flex items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.pdf,.docx,.odt"
        className="hidden"
      />
      
      {error && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-red-50 text-red-700 text-xs p-2 rounded-lg border border-red-100 shadow-sm flex items-start gap-2 animate-in fade-in slide-in-from-bottom-1 z-20">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isProcessing}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
          ${disabled || isProcessing 
            ? 'text-slate-400 cursor-not-allowed' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }
        `}
        title="Attach PDF, DOCX, ODT or Text file"
      >
        {isProcessing ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Extracting...</span>
          </>
        ) : (
          <>
            <Paperclip size={14} />
            <span>Attach File</span>
          </>
        )}
      </button>
    </div>
  );
};