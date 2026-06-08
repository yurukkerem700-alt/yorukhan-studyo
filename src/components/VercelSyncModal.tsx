import { useState, useEffect } from 'react';

interface VercelProject {
  id: string;
  name: string;
  production_url: string | null;
  github_url: string | null;
  created_at: string;
  framework: string | null;
  last_deployed: string | null;
}

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
}

interface ProjectToSync {
  name: string;
  description: string;
  production_url: string | null;
  github_url: string | null;
  category: 'completed_games' | 'completed_apps' | 'dev_games' | 'dev_apps';
  launch_type: 'new_tab' | 'iframe' | 'download';
  status: 'live' | 'beta' | 'maintenance';
  selected: boolean;
}

export function VercelSyncModal({ isOpen, onClose, onSyncComplete }: SyncModalProps) {
  const [vercelProjects, setVercelProjects] = useState<VercelProject[]>([]);
  const [projectsToSync, setProjectsToSync] = useState<ProjectToSync[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchVercelProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vercel-sync');
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        setVercelProjects([]);
      } else {
        setVercelProjects(data.projects || []);
        // Initialize projects to sync with defaults
        const initial: ProjectToSync[] = (data.projects || []).map((p: VercelProject) => ({
          name: p.name,
          description: '',
          production_url: p.production_url,
          github_url: p.github_url,
          category: 'completed_apps' as const,
          launch_type: 'new_tab' as const,
          status: 'live' as const,
          selected: false
        }));
        setProjectsToSync(initial);
      }
    } catch (err) {
      setError('Vercel projeleri alınamadı');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVercelProjects();
    }
  }, [isOpen]);

  const toggleProject = (index: number) => {
    setProjectsToSync(prev => prev.map((p, i) => 
      i === index ? { ...p, selected: !p.selected } : p
    ));
  };

  const updateProject = (index: number, field: keyof ProjectToSync, value: string | boolean) => {
    setProjectsToSync(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const selectAll = () => {
    setProjectsToSync(prev => prev.map(p => ({ ...p, selected: true })));
  };

  const deselectAll = () => {
    setProjectsToSync(prev => prev.map(p => ({ ...p, selected: false })));
  };

  const handleSync = async () => {
    const selected = projectsToSync.filter(p => p.selected);
    if (selected.length === 0) {
      setError('Lütfen en az bir proje seçin');
      return;
    }

    setSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/vercel-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: selected })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message);
        setTimeout(() => {
          onSyncComplete();
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Senkronizasyon başarısız');
      }
    } catch (err) {
      setError('Senkronizasyon hatası');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  const selectedCount = projectsToSync.filter(p => p.selected).length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-300 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 22.525H0l12-21.05 12 21.05z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Vercel Proje Senkronizasyonu</h2>
              <p className="text-gray-400 text-sm">Vercel hesabınızdaki projeleri içe aktarın</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 border-2 border-gray-600 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400">Vercel projeleri yükleniyor...</p>
            </div>
          ) : error && vercelProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-400 font-medium mb-2">Hata</p>
              <p className="text-gray-400 text-sm">{error}</p>
              <p className="text-gray-500 text-xs mt-4">
                VERCEL_TOKEN environment variable'ını kontrol edin
              </p>
            </div>
          ) : vercelProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-400">Vercel hesabınızda proje bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Actions */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={selectAll} className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                    Tümünü Seç
                  </button>
                  <span className="text-gray-600">|</span>
                  <button onClick={deselectAll} className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
                    Tümünü Kaldır
                  </button>
                </div>
                <span className="text-sm text-gray-400">
                  {selectedCount} / {projectsToSync.length} proje seçili
                </span>
              </div>

              {/* Projects List */}
              <div className="space-y-3">
                {projectsToSync.map((project, index) => (
                  <div 
                    key={project.name} 
                    className={`bg-gray-800/50 border rounded-xl p-4 transition-all ${
                      project.selected 
                        ? 'border-purple-500/50 bg-purple-500/5' 
                        : 'border-gray-700/50 hover:border-gray-600/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleProject(index)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          project.selected 
                            ? 'bg-purple-500 border-purple-500' 
                            : 'border-gray-600 hover:border-purple-500'
                        }`}
                      >
                        {project.selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-medium">{project.name}</h4>
                          {project.github_url && (
                            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                              </svg>
                            </a>
                          )}
                          {project.production_url && (
                            <a href={project.production_url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>

                        {project.selected && (
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                            {/* Category */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Kategori</label>
                              <select
                                value={project.category}
                                onChange={(e) => updateProject(index, 'category', e.target.value)}
                                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                              >
                                <option value="completed_games">Tamamlanan Oyun</option>
                                <option value="completed_apps">Tamamlanan Uygulama</option>
                                <option value="dev_games">Geliştirme Oyun</option>
                                <option value="dev_apps">Geliştirme Uygulama</option>
                              </select>
                            </div>

                            {/* Launch Type */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Çalıştırma</label>
                              <select
                                value={project.launch_type}
                                onChange={(e) => updateProject(index, 'launch_type', e.target.value)}
                                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                              >
                                <option value="new_tab">Yeni Sekme</option>
                                <option value="iframe">Site İçi</option>
                                <option value="download">İndirme</option>
                              </select>
                            </div>

                            {/* Status */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Durum</label>
                              <select
                                value={project.status}
                                onChange={(e) => updateProject(index, 'status', e.target.value)}
                                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                              >
                                <option value="live">🟢 CANLI</option>
                                <option value="beta">🟡 BETA</option>
                                <option value="maintenance">🔴 BAKIMDA</option>
                              </select>
                            </div>

                            {/* Description */}
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Açıklama</label>
                              <input
                                type="text"
                                value={project.description}
                                onChange={(e) => updateProject(index, 'description', e.target.value)}
                                placeholder="Kısa açıklama..."
                                className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700/50 bg-gray-900/50">
          <div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSync}
              disabled={syncing || selectedCount === 0}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center gap-2"
            >
              {syncing && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? 'Senkronize Ediliyor...' : `${selectedCount} Projeyi İçe Aktar`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}