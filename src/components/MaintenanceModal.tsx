import { useState, useCallback } from 'react';

interface MaintenanceModalProps {
  isOpen: boolean;
  projectName: string;
  otherProjects: Array<{ name: string; onClick: () => void }>;
  onClose: () => void;
}

export function MaintenanceModal({ isOpen, projectName, otherProjects, onClose }: MaintenanceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-2xl"></div>
        
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-bold text-white text-center mb-3">
          Küçük Bir Mola
        </h2>
        
        {/* Message */}
        <p className="text-gray-400 text-center mb-6 leading-relaxed">
          <span className="text-white font-medium">{projectName}</span> projemiz şu anda elden geçiriliyor. Yeni özellikler ve iyileştirmeler ekliyoruz!
        </p>
        
        <div className="bg-gray-700/30 border border-gray-600/30 rounded-xl p-4 mb-6">
          <p className="text-gray-300 text-sm text-center">
            Sizi bekletmemek adına, stüdyomuzun diğer popüler projelerine göz atmak ister misiniz?
          </p>
        </div>
        
        {/* Other Projects */}
        {otherProjects.length > 0 && (
          <div className="space-y-2 mb-6">
            <p className="text-gray-500 text-xs text-center uppercase tracking-wider mb-3">Diğer Projeler</p>
            {otherProjects.slice(0, 3).map((project, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onClose();
                  project.onClick();
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 hover:from-purple-500/20 hover:to-cyan-500/20 border border-purple-500/20 hover:border-purple-500/40 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-between group"
              >
                <span>{project.name}</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-xl transition-colors"
        >
          Kapat
        </button>
      </div>
    </div>
  );
}