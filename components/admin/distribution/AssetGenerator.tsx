import React, { useState } from 'react';

export default function AssetGenerator({ workspace }: { workspace: any }) {
  const [copies, setCopies] = useState(workspace.generatedCopy);
  const [loading, setLoading] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const regenerateCopy = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/distribution/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: workspace._id, eventContext: workspace })
      });
      const data = await res.json();
      if (data.generatedCopy) {
        setCopies(data.generatedCopy);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#1c1b1b] p-4 rounded-xl border border-white/5">
        <div>
          <h3 className="font-bold text-lg">AI Content Generator</h3>
          <p className="text-xs text-on-surface/50">Auto-generated promotional copy (Fallback mode active: No API key needed)</p>
        </div>
        <button 
          onClick={regenerateCopy} 
          disabled={loading}
          className="bg-primary-container text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-container/80 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">{loading ? 'sync' : 'auto_awesome'}</span>
          {loading ? 'Generating...' : 'Regenerate Variations'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1c1b1b] p-6 rounded-xl border border-white/5">
          <h3 className="font-bold text-lg mb-4 text-[#FF6B1A]">Instagram Feed</h3>
          <div className="bg-white/5 p-4 rounded-lg relative min-h-[120px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <p className="text-white/80 whitespace-pre-wrap font-mono text-sm leading-relaxed">{copies?.instagramFeed || 'No copy generated.'}</p>
            )}
          </div>
          <button onClick={() => handleCopy(copies?.instagramFeed)} className="mt-4 w-full bg-white/5 hover:bg-white/10 px-4 py-3 border border-white/10 rounded-lg text-sm transition-colors font-bold flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">content_copy</span> Copy to Clipboard
          </button>
        </div>

        <div className="bg-[#1c1b1b] p-6 rounded-xl border border-white/5">
          <h3 className="font-bold text-lg mb-4 text-[#25D366]">WhatsApp Broadcast</h3>
          <div className="bg-white/5 p-4 rounded-lg relative min-h-[120px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary-container border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <p className="text-white/80 whitespace-pre-wrap font-mono text-sm leading-relaxed">{copies?.whatsapp || 'No copy generated.'}</p>
            )}
          </div>
          <button onClick={() => handleCopy(copies?.whatsapp)} className="mt-4 w-full bg-white/5 hover:bg-white/10 px-4 py-3 border border-white/10 rounded-lg text-sm transition-colors font-bold flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">content_copy</span> Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
