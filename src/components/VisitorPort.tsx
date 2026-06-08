import { useState, useEffect } from 'react';

interface VisitorPortProps {
  visitorName: string | null;
  onSetName: (name: string) => void;
}

export function VisitorPort({ visitorName, onSetName }: VisitorPortProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    setTempName(visitorName || '');
  }, [visitorName]);

  const handleSubmit = () => {
    if (tempName.trim()) {
      const isNewVisitor = !visitorName;
      onSetName(tempName.trim());
      setIsEditing(false);
      
      // Dispatch event for BÖRÜ AI to react
      if (isNewVisitor) {
        window.dispatchEvent(new CustomEvent('yorkhan:visitor-welcome', {
          detail: { name: tempName.trim() }
        }));
      }
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 bg-gray-800/80 border border-purple-500/30 rounded-xl px-3 py-2">
        <span className="text-gray-400 text-xs">USER_OS:</span>
        <input
          type="text"
          value={tempName}
          onChange={e => setTempName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          placeholder="Lakabınızı girin"
          className="bg-transparent text-white text-sm w-24 focus:outline-none placeholder-gray-600"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          className="text-green-400 hover:text-green-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 ${
        visitorName
          ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
          : 'bg-gray-800/60 border-gray-600/30 hover:border-gray-500/50'
      }`}
      title="Kimlik portu - Tıklayarak düzenleyin"
    >
      {/* Status indicator */}
      <div className={`w-2 h-2 rounded-full ${visitorName ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
      
      {/* Label */}
      <span className={`text-xs font-mono ${visitorName ? 'text-green-400' : 'text-gray-400'}`}>
        {visitorName ? `USER_OS: ${visitorName}` : 'GUEST_OS: İsim Girin'}
      </span>
      
      {/* Edit icon */}
      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}