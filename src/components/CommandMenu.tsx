import { useState, useEffect, useCallback, useRef } from 'react';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'project' | 'admin' | 'action';
  keywords?: string[];
}

interface CommandMenuProps {
  projects: Array<{ id: number; name: string; category: string }>;
  onNavigate: (path: string) => void;
  onOpenLogin: () => void;
  visitorName: string | null;
  onSetVisitorName: (name: string) => void;
}

export function CommandMenu({ projects, onNavigate, onOpenLogin, visitorName, onSetVisitorName }: CommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Build commands
  const commands: Command[] = [
    // Navigation
    {
      id: 'home',
      label: 'Ana Sayfaya Git',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      action: () => { setIsOpen(false); onNavigate('/'); },
      category: 'navigation',
      keywords: ['ana', 'home', 'main']
    },
    // Admin
    {
      id: 'admin',
      label: 'Yönetici Paneline Gir (/admin)',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
      action: () => { setIsOpen(false); onOpenLogin(); },
      category: 'admin',
      keywords: ['admin', 'kejder', 'panel', 'yönetici']
    },
    // Visitor Identity
    {
      id: 'identity',
      label: visitorName ? `Kimlik: ${visitorName}` : 'Ziyaretçi Portu (İsim Girin)',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      action: () => { setShowNameInput(true); },
      category: 'action',
      keywords: ['isim', 'name', 'kimlik', 'identity', 'guest', 'user']
    },
    // Projects
    ...projects.map(p => ({
      id: `project-${p.id}`,
      label: `Proje: ${p.name}`,
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
      action: () => { setIsOpen(false); /* scroll to project */ },
      category: 'project' as const,
      keywords: [p.name.toLowerCase(), 'proje', 'project']
    }))
  ];

  // Filter commands based on query
  const filteredCommands = query
    ? commands.filter(cmd => {
        const q = query.toLowerCase();
        return cmd.label.toLowerCase().includes(q) ||
               cmd.keywords?.some(k => k.includes(q)) ||
               cmd.id.includes(q);
      })
    : commands;

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setShowNameInput(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showNameInput) {
      if (e.key === 'Enter' && tempName.trim()) {
        onSetVisitorName(tempName.trim());
        setShowNameInput(false);
        setTempName('');
        setIsOpen(false);
      }
      if (e.key === 'Escape') {
        setShowNameInput(false);
        setTempName('');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
    }
  }, [filteredCommands, selectedIndex, showNameInput, tempName, onSetVisitorName]);

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigasyon',
    project: 'Projeler',
    admin: 'Yönetim',
    action: 'Eylemler'
  };

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const cat = cmd.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => { setIsOpen(false); setShowNameInput(false); }}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gray-900/95 border border-gray-700/50 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-cyan-500/5 to-purple-500/5 pointer-events-none" />
        
        {/* Search Input */}
        <div className="relative border-b border-gray-700/50">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Komut veya proje ara..."
            className="w-full bg-transparent text-white text-lg px-12 py-4 focus:outline-none placeholder-gray-500"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
            <kbd className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">ESC</kbd>
          </div>
        </div>
        
        {/* Name Input Modal */}
        {showNameInput && (
          <div className="p-4 border-b border-gray-700/50 bg-purple-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Lakabınızı girin..."
                  className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  autoFocus
                />
              </div>
              <button
                onClick={() => {
                  if (tempName.trim()) {
                    onSetVisitorName(tempName.trim());
                    setShowNameInput(false);
                    setTempName('');
                    setIsOpen(false);
                  }
                }}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        )}
        
        {/* Commands List */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {categoryLabels[category] || category}
              </div>
              {cmds.map((cmd, idx) => {
                const globalIndex = filteredCommands.indexOf(cmd);
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      globalIndex === selectedIndex
                        ? 'bg-purple-500/20 text-white'
                        : 'text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className={`${globalIndex === selectedIndex ? 'text-purple-400' : 'text-gray-500'}`}>
                      {cmd.icon}
                    </div>
                    <span className="flex-1">{cmd.label}</span>
                    {globalIndex === selectedIndex && (
                      <kbd className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400 border border-gray-700">Enter</kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          
          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              Sonuç bulunamadı
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-700/50 px-4 py-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">↓</kbd>
              navigasyon
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">Enter</kbd>
              seç
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">Ctrl</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">K</kbd>
            aç/kapat
          </span>
        </div>
        
        {/* Cyber corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500/30 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500/30 rounded-br-2xl pointer-events-none" />
      </div>
    </div>
  );
}