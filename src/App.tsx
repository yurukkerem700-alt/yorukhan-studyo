import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ParticleSystem } from './components/ParticleSystem';
import { MagneticButton } from './components/MagneticButton';
import { ProjectCard } from './components/ProjectCard';
import { DistributionChart } from './components/DistributionChart';
import { StatsOverview } from './components/StatsOverview';
import { MaintenanceOverlay } from './components/MaintenanceOverlay';
import { DegradedFallback } from './components/ErrorBoundary';
import { CyberButton } from './components/CyberButton';
import { SandboxModal } from './components/SandboxModal';
import { PopularProjects } from './components/PopularProjects';
import { VercelSyncModal } from './components/VercelSyncModal';
import { BoruAssistant } from './components/BoruAssistant';
import { MaintenanceModal } from './components/MaintenanceModal';
import { MusicControl, useAudio } from './hooks/useAudio';
import { isInDegradedMode, detectFeatures, isLowEndDevice } from './lib/errorHandler';
import { analyzeAllVisitors, calculateCharacterDistribution, determineCharacterProfile } from './lib/heuristicEngine';

interface Project {
  id: number;
  name: string;
  description: string;
  category: 'completed_games' | 'completed_apps' | 'dev_games' | 'dev_apps';
  image?: string;
  production_url?: string;
  github_url?: string;
  launch_type?: 'new_tab' | 'iframe' | 'download';
  status?: 'live' | 'beta' | 'maintenance';
}

interface TelemetryLog {
  id: number;
  project_id: number | null;
  project_name: string;
  visitor_name: string;
  clicked_at: string;
}

interface Analytics {
  totalUniqueVisitors: number;
  totalClicks: number;
  topProject: { name: string; clicks: number } | null;
  projectClicks: Record<string, number>;
}

function useInteractionTracker() {
  const metricsRef = useRef({ hoverDuration: 0, mouseVelocity: 0, interactionCount: 0, lastMoveTime: Date.now(), totalMovement: 0, rapidMovements: 0 });
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const hoverStartRef = useRef<number | null>(null);

  const trackHoverStart = useCallback(() => { hoverStartRef.current = Date.now(); }, []);
  const trackHoverEnd = useCallback(() => {
    if (hoverStartRef.current) {
      metricsRef.current.hoverDuration += Date.now() - hoverStartRef.current;
      metricsRef.current.interactionCount++;
      hoverStartRef.current = null;
    }
  }, []);

  const trackMouseMove = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    const timeDiff = now - metricsRef.current.lastMoveTime;
    if (timeDiff > 0) {
      const distance = Math.sqrt(Math.pow(e.clientX - lastPositionRef.current.x, 2) + Math.pow(e.clientY - lastPositionRef.current.y, 2));
      const velocity = distance / timeDiff;
      if (velocity > 2) metricsRef.current.rapidMovements++;
      metricsRef.current.mouseVelocity = (metricsRef.current.mouseVelocity + velocity) / 2;
      metricsRef.current.totalMovement += distance;
    }
    metricsRef.current.lastMoveTime = now;
    lastPositionRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const getInteractionLabel = useCallback(() => {
    const { hoverDuration, mouseVelocity, interactionCount, rapidMovements } = metricsRef.current;
    if (rapidMovements > 20 || mouseVelocity > 1.5) return 'Hızlı';
    if (hoverDuration > 15000 && interactionCount < 5) return 'İnceleyen';
    if (interactionCount > 15) return 'Aktif';
    if (hoverDuration > 5000) return 'Dikkatli';
    return 'Normal';
  }, []);

  return { trackHoverStart, trackHoverEnd, trackMouseMove, getInteractionLabel };
}

function WelcomeModal({ onComplete }: { onComplete: (name: string) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) { setError('Lütfen adınızı veya lakabınızı girin.'); return; }
    if (trimmedName.length < 2) { setError('İsim en az 2 karakter olmalı.'); return; }
    localStorage.setItem('yorukhan_visitor_name', trimmedName);
    onComplete(trimmedName);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="text-4xl font-bold text-white">Y</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Hoş Geldiniz!</h2>
            <p className="text-gray-400">Stüdyomuza katılmak için adınızı veya lakabınızı girin</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(''); }} className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" placeholder="Adınız veya lakabınız..." autoFocus />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity">Devam Et</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function LoginModal({ isOpen, onClose, onLogin }: { isOpen: boolean; onClose: () => void; onLogin: (user: string, pass: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'KEJDER' && password === 'KeReM1234') { onLogin(username, password); onClose(); }
    else { setError('Kullanıcı adı veya şifre hatalı'); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700/50 rounded-2xl p-6 max-w-sm w-full">
        <h3 className="text-xl font-bold text-white mb-4">Yönetim Girişi</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" placeholder="Kullanıcı adı" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" placeholder="Şifre" />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-xl transition-colors">İptal</button>
            <button type="submit" className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500 text-white py-2 rounded-xl hover:opacity-90 transition-opacity">Giriş</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategorySection({ title, accentColor, icon, projects, onProjectClick }: { title: string; accentColor: string; icon: React.ReactNode; projects: Project[]; onProjectClick: (project: Project) => void }) {
  if (projects.length === 0) return null;
  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 ${accentColor}`}>{icon}<h3 className="text-lg font-bold">{title}</h3><span className="text-gray-500 text-sm">({projects.length})</span></div>
      <div className="grid gap-4">{projects.map((project) => <ProjectCard key={project.id} project={project} onProjectClick={onProjectClick} />)}</div>
    </div>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [visitorName, setVisitorName] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [degradedMode, setDegradedMode] = useState(false);
  const [sandboxProject, setSandboxProject] = useState<Project | null>(null);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [showVercelSync, setShowVercelSync] = useState(false);
  const [maintenanceModalProject, setMaintenanceModalProject] = useState<Project | null>(null);
  const [featuresSupported, setFeaturesSupported] = useState({ particles: true, magnetic: true, tilt3d: true });

  const interactionTracker = useInteractionTracker();
  const { playClickSound, toggleMusic, isMusicPlaying, isMuted } = useAudio();

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/maintenance');
        const data = await res.json();
        setMaintenanceMode(data.active || false);
      } catch { setMaintenanceMode(false); }
    };
    checkMaintenance();

    const features = detectFeatures();
    const lowEnd = isLowEndDevice();
    const degraded = isInDegradedMode();
    setDegradedMode(degraded || lowEnd);
    setFeaturesSupported({ particles: features.webgl && features.canvas && !lowEnd && !degraded, magnetic: features.cssTransforms && !degraded, tilt3d: features.cssTransforms && features.cssTransitions && !degraded });

    const storedName = localStorage.getItem('yorukhan_visitor_name');
    if (storedName) setVisitorName(storedName);
    else setShowWelcomeModal(true);
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) { console.error('Projeler yüklenemedi:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!showWelcomeModal) fetchProjects(); }, [showWelcomeModal, fetchProjects]);

  const handleLogin = (user: string, pass: string) => { if (user === 'KEJDER' && pass === 'KeReM1234') setIsLoggedIn(true); };
  const handleLogout = () => setIsLoggedIn(false);
  const handleWelcomeComplete = (name: string) => { setVisitorName(name); setShowWelcomeModal(false); };

  const handleProjectClick = async (project: Project) => {
    playClickSound();
    if (project.status === 'maintenance') { setMaintenanceModalProject(project); return; }
    const currentVisitorName = visitorName || localStorage.getItem('yorukhan_visitor_name') || 'Misafir';
    try {
      await fetch('/api/telemetry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: project.id, project_name: project.name, visitor_name: currentVisitorName }) });
    } catch (err) { console.error('Kayıt hatası:', err); }

    const launchType = project.launch_type || 'new_tab';
    const url = project.production_url;
    if (!url) return;
    if (launchType === 'iframe') { setSandboxProject(project); setIsSandboxOpen(true); }
    else window.open(url, '_blank');
  };

  const closeSandbox = () => { setIsSandboxOpen(false); setSandboxProject(null); };
  const closeMaintenanceModal = () => setMaintenanceModalProject(null);

  const completedGames = projects.filter(p => p.category === 'completed_games');
  const completedApps = projects.filter(p => p.category === 'completed_apps');
  const devGames = projects.filter(p => p.category === 'dev_games');
  const devApps = projects.filter(p => p.category === 'dev_apps');
  const activeProjects = projects.filter(p => p.status !== 'maintenance' && p.production_url);
  const popularProjectsForModal = activeProjects.slice(0, 3).map(p => ({ name: p.name, onClick: () => handleProjectClick(p) }));

  const visitorBehavior = useMemo(() => {
    const label = interactionTracker.getInteractionLabel();
    if (label === 'Hızlı') return 'quick';
    if (label === 'İnceleyen') return 'curious';
    return 'relaxed';
  }, [interactionTracker]);

  if (isLoggedIn) return <AdminPanel onLogout={handleLogout} onProjectChange={fetchProjects} onOpenVercelSync={() => setShowVercelSync(true)} />;
  if (maintenanceMode) return <MaintenanceOverlay />;

  return (
    <div className="min-h-screen bg-gray-950 text-white" onMouseMove={interactionTracker.trackMouseMove}>
      {featuresSupported.particles && !degradedMode && <ParticleSystem />}
      {degradedMode && <DegradedFallback />}
      {showWelcomeModal && <WelcomeModal onComplete={handleWelcomeComplete} />}

      <header className="bg-gray-900/60 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <MagneticButton className="flex items-center gap-4" strength={0.2}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-lg opacity-50"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">Y</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">YÖRÜKHAN</h1>
              <p className="text-purple-400/80 text-sm font-medium">Oyun ve Uygulama Atölyesi</p>
            </div>
          </MagneticButton>
          <div className="flex items-center gap-3">
            <MusicControl isPlaying={isMusicPlaying} isMuted={isMuted} onToggle={toggleMusic} />
            <CyberButton onClick={() => setShowLoginModal(true)} variant="secondary" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              Giriş
            </CyberButton>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl translate-x-20"></div>
          </div>
          <div className="relative">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Projelerimiz</span>
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 mx-auto rounded-full mb-6"></div>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">Oyun ve uygulama atölyemizin kapısına hoş geldiniz. Hem bitirdiğimiz hem de üzerinde çalıştığımız tüm eserleri burada bulabilirsiniz.</p>
            {visitorName && (
              <div className="mt-6 inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-purple-300 text-sm">Hoş geldin, <span className="font-semibold text-purple-200">{visitorName}</span></span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-purple-500/30 rounded-full"></div>
              <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CategorySection title="Oyunlarımız" accentColor="bg-green-500/20 text-green-400" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} projects={completedGames} onProjectClick={handleProjectClick} />
            <CategorySection title="Uygulamalarımız" accentColor="bg-blue-500/20 text-blue-400" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} projects={completedApps} onProjectClick={handleProjectClick} />
            <CategorySection title="Yeni Oyunlar" accentColor="bg-yellow-500/20 text-yellow-400" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>} projects={devGames} onProjectClick={handleProjectClick} />
            <CategorySection title="Yeni Uygulamalar" accentColor="bg-orange-500/20 text-orange-400" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>} projects={devApps} onProjectClick={handleProjectClick} />
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800/50 mt-16 relative z-10 bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center"><span className="text-xs font-bold text-white">Y</span></div>
            <span className="text-gray-400 font-medium">YÖRÜKHAN</span>
          </div>
          <p className="text-gray-600 text-sm">© 2025 YÖRÜKHAN Stüdyo. Tüm hakları saklıdır.</p>
        </div>
      </footer>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
      <SandboxModal project={sandboxProject} isOpen={isSandboxOpen} onClose={closeSandbox} />
      <VercelSyncModal 
        isOpen={showVercelSync} 
        onClose={() => setShowVercelSync(false)} 
        onSyncComplete={() => { fetchProjects(); }} 
      />
      <MaintenanceModal isOpen={!!maintenanceModalProject} projectName={maintenanceModalProject?.name || ''} otherProjects={popularProjectsForModal} onClose={closeMaintenanceModal} />
      <BoruAssistant visitorBehavior={visitorBehavior} onSuggestProject={(name) => { const project = projects.find(p => p.name === name); if (project) handleProjectClick(project); }} popularProjects={activeProjects.map(p => p.name)} />
    </div>
  );
}

function AdminPanel({ onLogout, onProjectChange, onOpenVercelSync }: { onLogout: () => void; onProjectChange: () => void; onOpenVercelSync: () => void }) {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', image: '', category: 'completed_games' as Project['category'], production_url: '', github_url: '', launch_type: 'new_tab' as 'new_tab' | 'iframe' | 'download', status: 'live' as 'live' | 'beta' | 'maintenance' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ vercel_connected: boolean; github_connected: boolean } | null>(null);

  const fetchProjects = useCallback(async () => {
    try { const res = await fetch('/api/projects'); const data = await res.json(); setProjects(data); } catch (err) { console.error('Projeler yüklenemedi:', err); }
  }, []);

  const fetchTelemetry = useCallback(async () => {
    try { const res = await fetch('/api/telemetry'); const data = await res.json(); setTelemetryLogs(data.logs || []); setAnalytics(data.analytics || null); } catch (err) { console.error('Veri yüklenemedi:', err); }
  }, []);

  useEffect(() => { fetchProjects(); fetchTelemetry(); fetchSyncStatus(); const interval = setInterval(fetchTelemetry, 5000); return () => clearInterval(interval); }, [fetchProjects, fetchTelemetry]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess('');
    if (!formData.name.trim()) { setFormError('Proje adı gereklidir.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (res.ok) {
        setFormSuccess('Proje başarıyla eklendi!');
        setFormData({ name: '', description: '', image: '', category: 'completed_games', production_url: '', github_url: '', launch_type: 'new_tab', status: 'live' });
        fetchProjects(); onProjectChange();
      } else { setFormError('Proje eklenirken bir hata oluştu.'); }
    } catch { setFormError('Bağlantı hatası. Lütfen tekrar deneyin.'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    try { await fetch('/api/projects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); fetchProjects(); onProjectChange(); } catch (err) { console.error('Silme hatası:', err); }
  };

  const handleToggleMaintenance = async (projectId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'maintenance' ? 'live' : 'maintenance';
    try { await fetch('/api/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: projectId, status: newStatus }) }); fetchProjects(); onProjectChange(); } catch (err) { console.error('Durum güncelleme hatası:', err); }
  };

  const handlePurgeTelemetry = async () => {
    try { await fetch('/api/telemetry', { method: 'DELETE' }); setTelemetryLogs([]); setAnalytics(null); setPurgeConfirm(false); } catch (err) { console.error('Temizleme hatası:', err); }
  };

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/sync-projects');
      const data = await res.json();
      setSyncStatus({ vercel_connected: data.vercel_connected, github_connected: data.github_connected });
    } catch (err) {
      console.error('Sync durumu alınamadı:', err);
    }
  };

  const handleSyncProjects = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/sync-projects', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncResult({ success: true, message: data.message, count: data.synced?.length || 0 });
        fetchProjects();
        onProjectChange();
      } else {
        setSyncResult({ success: false, message: data.error || 'Senkronizasyon başarısız' });
      }
    } catch (err) {
      setSyncResult({ success: false, message: 'Bağlantı hatası. Lütfen tekrar deneyin.' });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { live: 'bg-green-500/20 text-green-400 border-green-500/30', beta: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', maintenance: 'bg-red-500/20 text-red-400 border-red-500/30' };
    const labels: Record<string, string> = { live: 'Canlı', beta: 'Deneme', maintenance: 'Bakımda' };
    return <span className={`px-2 py-1 text-xs rounded-lg border ${styles[status] || styles.live}`}>{labels[status] || status}</span>;
  };

  const visitorMetrics = useMemo(() => analyzeAllVisitors(telemetryLogs), [telemetryLogs]);
  const characterDistribution = useMemo(() => {
    const profiles = new Map<string, ReturnType<typeof determineCharacterProfile>>();
    visitorMetrics.forEach((metrics, name) => {
      profiles.set(name, determineCharacterProfile(metrics));
    });
    return calculateCharacterDistribution(profiles);
  }, [visitorMetrics]);
  const topCharacter = useMemo(() => { const sorted = Object.entries(characterDistribution).sort((a, b) => b[1] - a[1]); return sorted[0]?.[0] || ''; }, [characterDistribution]);

  const tabs = [
    { id: 'projects', label: 'Projeler', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { id: 'add', label: 'Yeni Ekle', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> },
    { id: 'insights', label: 'Misafir Hareketleri', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-800/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center"><span className="text-xl font-bold text-white">Y</span></div>
            <div><h1 className="text-xl font-bold">Yönetim Merkezi</h1><p className="text-gray-400 text-sm">Hoş geldin, KEJDER</p></div>
          </div>
          <CyberButton onClick={onLogout} variant="secondary" size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Çıkış Yap
          </CyberButton>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-8">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all overflow-hidden ${activeTab === tab.id ? 'text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border border-gray-700/50'}`}>
              {activeTab === tab.id && <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600"></div>}
              <span className="relative flex items-center gap-2">{tab.icon}{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50 rounded-2xl p-8">
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Tüm Projeler</h3>
                <button
                  onClick={onOpenVercelSync}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-white to-gray-200 hover:from-gray-100 hover:to-gray-300 text-black font-medium rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 22.525H0l12-21.05 12 21.05z" />
                  </svg>
                  Vercel'den Senkronize Et
                </button>
              </div>
              {projects.length === 0 ? <p className="text-gray-500 text-center py-12">Henüz proje eklenmemiş.</p> : (
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <div key={project.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                        {project.image ? <img src={project.image} alt={project.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold truncate">{project.name}</h4>
                        <p className="text-gray-400 text-sm truncate">{project.description || 'Açıklama yok'}</p>
                        <div className="flex items-center gap-2 mt-2">{getStatusBadge(project.status || 'live')}<span className="text-gray-500 text-xs">{project.category === 'completed_games' ? 'Oyun' : project.category === 'completed_apps' ? 'Uygulama' : project.category === 'dev_games' ? 'Yeni Oyun' : 'Yeni Uygulama'}</span></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggleMaintenance(project.id, project.status || 'live')} className={`p-2 rounded-lg transition-colors ${project.status === 'maintenance' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`} title={project.status === 'maintenance' ? 'Canlıya Al' : 'Bakıma Al'}>
                          {project.status === 'maintenance' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                        </button>
                        <button onClick={() => handleDelete(project.id)} className="p-2 bg-gray-700/50 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Sil"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'add' && (
            <div className="space-y-8">
              {/* Sync Section */}
              <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-cyan-400">◆</span>
                  Vercel & GitHub Senkronizasyonu
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Vercel ve GitHub hesaplarınızdaki projeleri otomatik olarak sisteme aktarın. 
                  API token'larını Vercel Environment Variables üzerinden ekleyin.
                </p>
                
                {/* Status Indicators */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${syncStatus?.vercel_connected ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-700/30 border border-gray-600/30'}`}>
                    <div className={`w-2 h-2 rounded-full ${syncStatus?.vercel_connected ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className={`text-sm ${syncStatus?.vercel_connected ? 'text-green-400' : 'text-gray-400'}`}>Vercel</span>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${syncStatus?.github_connected ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-700/30 border border-gray-600/30'}`}>
                    <div className={`w-2 h-2 rounded-full ${syncStatus?.github_connected ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className={`text-sm ${syncStatus?.github_connected ? 'text-green-400' : 'text-gray-400'}`}>GitHub</span>
                  </div>
                </div>

                {/* Sync Result */}
                {syncResult && (
                  <div className={`mb-4 p-4 rounded-xl ${syncResult.success ? 'bg-green-900/20 border border-green-700/30' : 'bg-red-900/20 border border-red-700/30'}`}>
                    <p className={syncResult.success ? 'text-green-300' : 'text-red-300'}>
                      {syncResult.message}
                      {syncResult.count && syncResult.count > 0 && ` (${syncResult.count} proje)`}
                    </p>
                  </div>
                )}

                {/* Sync Button */}
                <CyberButton 
                  onClick={handleSyncProjects} 
                  disabled={syncing}
                  variant="primary"
                >
                  {syncing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Projeleri Senkronize Et
                </CyberButton>
              </div>

              {/* Manual Add Section */}
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Manuel Proje Ekle</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-gray-300 mb-2">Proje Adı *</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" placeholder="Proje adını girin" /></div>
                    <div><label className="block text-sm font-medium text-gray-300 mb-2">Kategori *</label><select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"><option value="completed_games">Oyun</option><option value="completed_apps">Uygulama</option><option value="dev_games">Yeni Oyun</option><option value="dev_apps">Yeni Uygulama</option></select></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-300 mb-2">Açıklama</label><textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" placeholder="Proje açıklamasını girin" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-gray-300 mb-2">Canlı Adres</label><input type="text" name="production_url" value={formData.production_url} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50" placeholder="https://proje.vercel.app" /></div>
                    <div><label className="block text-sm font-medium text-gray-300 mb-2">Kaynak Kodlar (GitHub)</label><input type="text" name="github_url" value={formData.github_url} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500/50" placeholder="https://github.com/kullanici/proje" /></div>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-300 mb-2">Görsel URL</label><input type="text" name="image" value={formData.image} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" placeholder="https://example.com/image.jpg" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-medium text-gray-300 mb-2">Açılış Şekli</label><select name="launch_type" value={formData.launch_type} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50"><option value="new_tab">Yeni Sayfada Aç</option><option value="iframe">Burada Oyna</option><option value="download">İndir</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-300 mb-2">Durum</label><select name="status" value={formData.status} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"><option value="live">Canlı</option><option value="beta">Deneme Aşamasında</option><option value="maintenance">Geliştiriliyor</option></select></div>
                  </div>
                  {formError && <div className="bg-red-900/50 border border-red-700/50 rounded-xl px-4 py-3 text-red-300 text-sm">{formError}</div>}
                  {formSuccess && <div className="bg-green-900/50 border border-green-700/50 rounded-xl px-4 py-3 text-green-300 text-sm">{formSuccess}</div>}
                  <div className="flex justify-end">
                    <CyberButton type="submit" disabled={submitting} variant="success">
                      {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Proje Ekle
                    </CyberButton>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-8">
              <h3 className="text-xl font-bold text-white mb-6">Misafir Hareketleri</h3>
              <StatsOverview totalVisitors={analytics?.totalUniqueVisitors || 0} totalClicks={analytics?.totalClicks || 0} avgSessionDuration={45000} topCharacter={topCharacter} />
              <PopularProjects telemetryLogs={telemetryLogs} projects={projects} />
              <DistributionChart distribution={characterDistribution} />
              <div>
                <div className="flex items-center justify-between mb-4"><h4 className="text-lg font-bold text-white">Son Hareketler</h4><button onClick={() => setPurgeConfirm(true)} className="text-xs text-red-400 hover:text-red-300 transition-colors">Temizle</button></div>
                {purgeConfirm && (
                  <div className="mb-4 bg-red-900/20 border border-red-700/30 rounded-xl p-4">
                    <p className="text-red-300 text-sm mb-3">Tüm hareket verileri silinecek. Emin misiniz?</p>
                    <div className="flex gap-2"><button onClick={handlePurgeTelemetry} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30">Evet, Sil</button><button onClick={() => setPurgeConfirm(false)} className="px-3 py-1 bg-gray-700/50 text-gray-400 rounded-lg text-sm hover:bg-gray-600/50">İptal</button></div>
                  </div>
                )}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {telemetryLogs.slice(0, 20).map((log) => (
                    <div key={log.id} className="bg-gray-800/50 border border-gray-700/30 rounded-xl px-4 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">{log.visitor_name?.charAt(0) || '?'}</div>
                      <div className="flex-1"><p className="text-white text-sm font-medium">{log.visitor_name || 'Misafir'}</p><p className="text-gray-500 text-xs">{log.project_name || 'Proje'} • {formatDate(log.clicked_at)}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
