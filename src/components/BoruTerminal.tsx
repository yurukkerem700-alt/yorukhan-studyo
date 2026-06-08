import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  queryProjects, 
  adaptResponseToProfile, 
  processAdminCommand,
  generateWelcomeMessage,
  generateAIResponse 
} from '../lib/boruEngine';

interface Project {
  id: number;
  name: string;
  description: string;
  category: string;
  production_url?: string;
  github_url?: string;
  launch_type?: string;
  status?: string;
}

interface VisitorProfile {
  primaryLabel: string;
  curiosity: number;
  patience: number;
  determination: number;
  traits: string[];
}

interface TerminalLine {
  id: number;
  type: 'system' | 'user' | 'ai' | 'error' | 'success';
  content: string;
  timestamp: Date;
}

interface BoruTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  visitorName: string | null;
  visitorProfile: VisitorProfile | null;
  isAdmin: boolean;
}

export function BoruTerminal({ 
  isOpen, 
  onClose, 
  projects, 
  visitorName, 
  visitorProfile,
  isAdmin 
}: BoruTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lineIdRef = useRef(0);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Welcome message on first open
  useEffect(() => {
    if (isOpen && lines.length === 0 && visitorName) {
      addLine('system', generateWelcomeMessage(visitorName));
      addLine('system', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      if (isAdmin) {
        addLine('success', '🛡️ YÖNETİCİ MODU AKTİF - Komut sistemi hazır.');
      }
      if (visitorProfile) {
        addLine('system', `📋 Profil: ${visitorProfile.primaryLabel}`);
      }
      addLine('system', 'Yardım için "yardım" yazın.');
    }
  }, [isOpen, visitorName, isAdmin, visitorProfile]);

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    lineIdRef.current += 1;
    setLines(prev => [...prev, {
      id: lineIdRef.current,
      type,
      content,
      timestamp: new Date()
    }]);
  }, []);

  const typeWriterEffect = useCallback(async (text: string, type: TerminalLine['type']) => {
    const words = text.split(' ');
    let currentText = '';
    
    for (const word of words) {
      currentText += (currentText ? ' ' : '') + word;
      setLines(prev => {
        const newLines = [...prev];
        const lastLine = newLines[newLines.length - 1];
        if (lastLine && lastLine.type === type && lastLine.id === lineIdRef.current) {
          return [...newLines.slice(0, -1), { ...lastLine, content: currentText }];
        }
        return [...newLines, {
          id: lineIdRef.current,
          type,
          content: currentText,
          timestamp: new Date()
        }];
      });
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    addLine('user', `> ${userMessage}`);
    setIsProcessing(true);

    // Check for admin commands
    if (isAdmin && userMessage.toLowerCase().startsWith('/börü')) {
      const result = await processAdminCommand(userMessage);
      lineIdRef.current += 1;
      await typeWriterEffect(result.message, result.success ? 'success' : 'error');
      setIsProcessing(false);
      return;
    }

    // Try AI response
    const aiResponse = generateAIResponse(userMessage, projects, visitorProfile, isAdmin);
    
    if (aiResponse) {
      lineIdRef.current += 1;
      await typeWriterEffect(aiResponse, 'ai');
    } else {
      // Fallback to project query
      const queryResponse = queryProjects(projects, userMessage);
      const adaptedResponse = adaptResponseToProfile(queryResponse, visitorProfile);
      lineIdRef.current += 1;
      await typeWriterEffect(adaptedResponse, 'ai');
    }

    setIsProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
      style={{ height: '500px', maxHeight: 'calc(100vh - 8rem)' }}
    >
      {/* Terminal container */}
      <div 
        className="h-full rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(180deg, rgba(0, 20, 20, 0.98) 0%, rgba(0, 10, 10, 0.98) 100%)',
          border: '1px solid rgba(0, 255, 200, 0.2)',
          boxShadow: '0 0 30px rgba(0, 255, 200, 0.1), inset 0 0 30px rgba(0, 255, 200, 0.03)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: 'rgba(0, 255, 200, 0.2)', background: 'rgba(0, 255, 200, 0.05)' }}
        >
          <div className="flex items-center gap-3">
            {/* Status indicator */}
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: '#00ffc8', boxShadow: '0 0 10px #00ffc8' }}
            />
            <span 
              style={{ 
                fontFamily: 'monospace', 
                color: '#00ffc8', 
                fontSize: '14px',
                fontWeight: 'bold',
                letterSpacing: '3px'
              }}
            >
              BÖRÜ TERMINAL v2.0
            </span>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/20"
            style={{ color: 'rgba(255, 100, 100, 0.8)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Terminal output */}
        <div 
          ref={terminalRef}
          className="flex-1 overflow-y-auto p-4 space-y-2"
          style={{ fontFamily: 'monospace', fontSize: '13px' }}
        >
          {lines.map((line) => (
            <div 
              key={line.id}
              className={`whitespace-pre-wrap break-words ${
                line.type === 'user' ? 'text-gray-400' :
                line.type === 'system' ? 'text-cyan-400/80' :
                line.type === 'ai' ? 'text-green-400' :
                line.type === 'error' ? 'text-red-400' :
                'text-emerald-400'
              }`}
            >
              {line.type === 'user' && (
                <span className="text-cyan-500 mr-2">➜</span>
              )}
              {line.type === 'ai' && (
                <span className="text-green-500 mr-2">◈</span>
              )}
              {line.type === 'system' && (
                <span className="text-cyan-500 mr-2">●</span>
              )}
              {line.type === 'error' && (
                <span className="text-red-500 mr-2">✗</span>
              )}
              {line.type === 'success' && (
                <span className="text-emerald-500 mr-2">✓</span>
              )}
              {line.content}
            </div>
          ))}
          
          {isProcessing && (
            <div className="text-cyan-400/60 animate-pulse">
              <span className="mr-2">◈</span>
              İşleniyor...
            </div>
          )}
        </div>

        {/* Input */}
        <form 
          onSubmit={handleSubmit}
          className="p-3 border-t"
          style={{ borderColor: 'rgba(0, 255, 200, 0.2)' }}
        >
          <div className="flex items-center gap-2">
            <span 
              style={{ color: '#00ffc8', fontFamily: 'monospace' }}
            >
              {isAdmin ? '⚙️' : '>'}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              className="flex-1 bg-transparent outline-none text-green-400 placeholder-gray-600"
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
              placeholder={isAdmin ? "Komut veya soru yazın..." : "Soru sorun..."}
            />
          </div>
        </form>

        {/* Cyber corner decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/30 rounded-br-2xl pointer-events-none" />
      </div>
    </div>
  );
}