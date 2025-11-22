import React, { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';
import { Download, Copy, Check, AlertCircle } from 'lucide-react';

// Initialize mermaid configuration
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
  logLevel: 'error',
});

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Unique ID for each diagram to prevent conflicts
  const elementId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart) return;
      
      try {
        setError(null);
        // Mermaid requires the element to exist in DOM, but render returns SVG string
        // We use render to get the SVG string and inject it ourselves
        const { svg } = await mermaid.render(elementId.current, chart);
        setSvg(svg);
      } catch (err) {
        console.error("Mermaid rendering failed:", err);
        // Mermaid might leave debris if it fails, clean up visually
        setError("Could not render diagram. The syntax might be incomplete or invalid.");
      }
    };

    // Debounce rendering slightly to avoid flashing on streaming updates
    const timeoutId = setTimeout(() => {
        renderChart();
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [chart]);

  const handleCopy = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logic-map-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="p-4 my-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs flex items-start gap-2">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <div className="flex-1">
            <p className="font-semibold">Visualization Error</p>
            <p className="opacity-80">{error}</p>
            <pre className="mt-2 p-2 bg-white/50 rounded text-[10px] overflow-x-auto">{chart}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="relative my-6 group">
      <div 
        className="bg-white border border-slate-200 rounded-xl p-6 overflow-x-auto flex justify-center min-h-[150px]"
        ref={containerRef}
      >
        {svg ? (
            <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full" />
        ) : (
            <div className="flex items-center justify-center text-slate-300 text-sm animate-pulse">
                Rendering Structure...
            </div>
        )}
      </div>

      {/* Toolbar Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-1 shadow-sm">
        <button
          onClick={handleCopy}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          title="Copy Mermaid Code"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
        </button>
        <button
          onClick={handleDownload}
          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
          title="Download SVG"
        >
          <Download size={14} />
        </button>
      </div>
      <div className="text-center mt-2">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Visual Logic Map</span>
      </div>
    </div>
  );
};