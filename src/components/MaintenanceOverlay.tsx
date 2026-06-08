import { useEffect, useState } from 'react';

interface MaintenanceOverlayProps {
  message?: string;
}

export function MaintenanceOverlay({ message }: MaintenanceOverlayProps) {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 bg-gray-950 z-[9999] flex items-center justify-center">
      <div className="text-center px-6">
        {/* Animated Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse">
            <span className="text-4xl font-bold text-white">Y</span>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          YÖRÜKHAN
        </h1>
        
        {/* Status Message */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl px-8 py-6 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-400 font-semibold text-lg">
              Sistem Güncellemesi
            </span>
          </div>
          
          <p className="text-gray-300 text-lg mb-2">
            {message || 'YÖRÜKHAN sistemleri güncelleniyor'}{dots}
          </p>
          
          <p className="text-gray-500 text-sm">
            Lütfen bekleyin. Kısa süre içinde geri döneceğiz.
          </p>
        </div>
        
        {/* Progress Animation */}
        <div className="mt-8 max-w-xs mx-auto">
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-gray-600 text-xs mt-8">
          © 2025 YÖRÜKHAN Stüdyo
        </p>
      </div>
    </div>
  );
}