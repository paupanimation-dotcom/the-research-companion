
import React from 'react';
import { Download } from 'lucide-react';
import { SynthesisData } from '../types';

interface SynthesisTableProps {
  data: SynthesisData;
}

export const SynthesisTable: React.FC<SynthesisTableProps> = ({ data }) => {
  if (!data || !data.rows || !data.dimensions) return null;

  const handleExportCSV = () => {
    const headers = ['Source', ...data.dimensions];
    const csvRows = [
      headers.join(','),
      ...data.rows.map(row => {
        const values = [
            `"${row.source_title.replace(/"/g, '""')}"`,
            ...data.dimensions.map(dim => `"${(row[dim] || '').replace(/"/g, '""')}"`)
        ];
        return values.join(',');
      })
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `synthesis-matrix-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-6 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cross-Source Synthesis</span>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
        >
          <Download size={12} /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-bold whitespace-nowrap min-w-[150px] sticky left-0 bg-slate-50 border-r border-slate-200">Source</th>
              {data.dimensions.map((dim, i) => (
                <th key={i} className="px-6 py-3 font-bold min-w-[200px]">{dim}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, idx) => (
              <tr key={idx} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 sticky left-0 bg-white border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  {row.source_title}
                </td>
                {data.dimensions.map((dim, i) => (
                  <td key={i} className="px-6 py-4 leading-relaxed align-top">
                    {row[dim] || <span className="text-slate-300 italic">N/A</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
