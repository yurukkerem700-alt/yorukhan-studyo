import { useState, useEffect, useRef, useCallback } from 'react';
import { LANG, CHARACTER_TYPES } from '../lib/language';

interface BoruAssistantProps {
  visitorBehavior: 'quick' | 'curious' | 'relaxed' | null;
  onSuggestProject: (projectName: string) => void;
  popularProjects: string[];
}

export function BoruAssistant({ visitorBehavior, onSuggestProject, popularProjects }: BoruAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isBot: boolean }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting based on visitor behavior
      const greeting = getGreeting();
      setTimeout(() => {
        setMessages([{ text: greeting, isBot: true }]);
      }, 500);
    }
  }, [isOpen, visitorBehavior]);

  const getGreeting = () => {
    if (visitorBehavior === 'quick') {
      return 'Merhaba! 🐺 Popüler oyunlarımıza hızlıca göz atmak ister misiniz?';
    } else if (visitorBehavior === 'curious') {
      return 'Merhaba! 🐺 Ben Börü, stüdyonun dostu. Projelerimizle ilgili sorularınızı memnuniyetle yanıtlarım!';
    } else {
      return 'Merhaba! 🐺 Hoş geldiniz. Size nasıl yardımcı olabilirim?';
    }
  };

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setInputValue('');
    setIsTyping(true);

    // Simulate thinking
    setTimeout(() => {
      const response = generateResponse(userMessage);
      setMessages(prev => [...prev, { text: response, isBot: true }]);
      setIsTyping(false);
    }, 800);
  }, [inputValue, popularProjects, visitorBehavior]);

  const generateResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    // Project suggestions
    if (lowerInput.includes('oyun') || lowerInput.includes('proje') || lowerInput.includes('ne var')) {
      if (popularProjects.length > 0) {
        return `Şu anda en çok sevilen projelerimiz: ${popularProjects.slice(0, 3).join(', ')}. İncelemek ister misiniz?`;
      }
      return 'Projelerimizi ana sayfada bulabilirsiniz. Hepsi özenle hazırlandı!';
    }
    
    // Greetings
    if (lowerInput.includes('merhaba') || lowerInput.includes('selam')) {
      return 'Merhaba! 🐺 Bugün size nasıl yardımcı olabilirim?';
    }
    
    // About
    if (lowerInput.includes('kim') || lowerInput.includes('ne yapıyorsunuz') || lowerInput.includes('hakkında')) {
      return 'YÖRÜKHAN, oyun ve uygulama atölyesi olarak yola çıktı. Her yaştan insanın keyif alacağı eserler üretmeyi amaçlıyoruz!';
    }
    
    // Help
    if (lowerInput.includes('yardım') || lowerInput.includes('nasıl')) {
      return 'Ana sayfada projelerimizi inceleyebilir, beğendiğiniz oyunu veya uygulamayı tek tıkla açabilirsiniz. Başka bir sorunuz var mı?';
    }
    
    // Default
    return 'Anladım! Başka bir konuda yardımcı olmamı ister misiniz? Projelerimiz hakkında bilgi alabilir veya öneri isteyebilirsiniz.';
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    setTimeout(() => handleSendMessage(), 100);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center hover:scale-110 transition-transform duration-300 group"
        aria-label="Börü Asistan"
      >
        <span className="text-3xl group-hover:animate-bounce">🐺</span>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse border-2 border-gray-900"></span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-cyan-600 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🐺</span>
            </div>
            <div>
              <h3 className="text-white font-bold">Börü</h3>
              <p className="text-white/70 text-xs">Stüdyo Rehberi</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-auto text-white/70 hover:text-white transition-colors"
              aria-label="Kapat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.isBot
                      ? 'bg-gray-700/50 text-white rounded-bl-sm'
                      : 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-br-sm'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-700/50 px-4 py-2 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            <button
              onClick={() => handleQuickAction('Popüler projeler neler?')}
              className="text-xs px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-full transition-colors"
            >
              Popüler Projeler
            </button>
            <button
              onClick={() => handleQuickAction('Stüdyo hakkında bilgi ver')}
              className="text-xs px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-full transition-colors"
            >
              Hakkımızda
            </button>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Mesajınızı yazın..."
                className="flex-1 bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity"
                aria-label="Gönder"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}