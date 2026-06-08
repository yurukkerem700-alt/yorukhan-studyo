// BÖRÜ AI Engine - Contextual Intelligence & Command Processing

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

interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}

// Project knowledge base queries
export function queryProjects(projects: Project[], query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Web tools / applications
  if (lowerQuery.includes('web araç') || lowerQuery.includes('uygulama') || lowerQuery.includes('app')) {
    const apps = projects.filter(p => p.category.includes('apps'));
    if (apps.length === 0) return 'Şu anda kayıtlı web uygulaması bulunmuyor.';
    
    const appNames = apps.map(p => `• ${p.name}`).join('\n');
    return `Kayıtlı web uygulamalarımız:\n${appNames}\n\nToplam ${apps.length} uygulama aktif.`;
  }
  
  // Games
  if (lowerQuery.includes('oyun') || lowerQuery.includes('game')) {
    const games = projects.filter(p => p.category.includes('games'));
    if (games.length === 0) return 'Şu anda kayıtlı oyun bulunmuyor.';
    
    const gameNames = games.map(p => `• ${p.name}`).join('\n');
    return `Kayıtlı oyunlarımız:\n${gameNames}\n\nToplam ${games.length} oyun mevcut.`;
  }
  
  // Completed projects
  if (lowerQuery.includes('tamamlan') || lowerQuery.includes('biten') || lowerQuery.includes('hazır')) {
    const completed = projects.filter(p => p.category.includes('completed'));
    return `Tamamlanan projeler: ${completed.length} adet.\n${completed.map(p => `✓ ${p.name}`).join('\n')}`;
  }
  
  // In development
  if (lowerQuery.includes('geliştir') || lowerQuery.includes('yapım') || lowerQuery.includes('mutfak')) {
    const dev = projects.filter(p => p.category.includes('dev'));
    return `Geliştirme aşamasındaki projeler: ${dev.length} adet.\n${dev.map(p => `⚡ ${p.name}`).join('\n')}`;
  }
  
  // Live projects
  if (lowerQuery.includes('canlı') || lowerQuery.includes('aktif') || lowerQuery.includes('production')) {
    const live = projects.filter(p => p.status === 'live' || !p.status);
    return `Canlı projeler: ${live.length} adet sistemde aktif.`;
  }
  
  // Specific project search
  const specificProject = projects.find(p => 
    lowerQuery.includes(p.name.toLowerCase()) || 
    p.name.toLowerCase().includes(lowerQuery.replace('nedir', '').replace('ne', '').trim())
  );
  
  if (specificProject) {
    return `📦 ${specificProject.name}\n${specificProject.description}\nKategori: ${specificProject.category}\nDurum: ${specificProject.status || 'live'}`;
  }
  
  // General project count
  if (lowerQuery.includes('kaç') || lowerQuery.includes('sayı') || lowerQuery.includes('toplam')) {
    return `Toplam ${projects.length} proje kayıtlı.\n• ${projects.filter(p => p.category.includes('completed')).length} tamamlanmış\n• ${projects.filter(p => p.category.includes('dev')).length} geliştirme aşamasında`;
  }
  
  // Default response
  return 'Bu konuda bilgi bulamıyorum. "oyunlar", "uygulamalar" veya "projeler" hakkında sorabilirsiniz.';
}

// Profile-aware response adaptation
export function adaptResponseToProfile(response: string, profile: VisitorProfile | null): string {
  if (!profile) return response;
  
  const isImpatient = profile.patience < 40;
  const isDetailOriented = profile.curiosity > 70;
  
  if (isImpatient) {
    // Shorten response for impatient visitors
    const lines = response.split('\n').slice(0, 3);
    return lines.join('\n') + '\n[...]';
  }
  
  if (isDetailOriented) {
    // Add technical context for detail-oriented visitors
    return response + '\n\n📊 Teknik Detaylar: Supabase PostgreSQL altyapısı üzerinde çalışmaktadır.';
  }
  
  return response;
}

// Admin command processor
export async function processAdminCommand(command: string): Promise<CommandResult> {
  const cmd = command.toLowerCase().trim();
  
  // Maintenance mode toggle
  if (cmd.includes('bakım') && cmd.includes('aç')) {
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true })
      });
      if (res.ok) {
        return { success: true, message: '🔴 BAKIM MODU AKTİF\nSite ziyaretçilere kapatıldı.' };
      }
      return { success: false, message: 'Bakım modu açılamadı.' };
    } catch {
      return { success: false, message: 'Sistem hatası.' };
    }
  }
  
  // Maintenance mode close
  if (cmd.includes('bakım') && cmd.includes('kapat')) {
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false })
      });
      if (res.ok) {
        return { success: true, message: '🟢 BAKIM MODU KAPALI\nSite tekrar erişime açıldı.' };
      }
      return { success: false, message: 'Bakım modu kapatılamadı.' };
    } catch {
      return { success: false, message: 'Sistem hatası.' };
    }
  }
  
  // Clear logs
  if (cmd.includes('log') && cmd.includes('temizle')) {
    try {
      const res = await fetch('/api/telemetry', {
        method: 'DELETE'
      });
      if (res.ok) {
        return { success: true, message: '🗑️ Telemetri logları temizlendi.\nVeritabanı sıfırlandı.' };
      }
      return { success: false, message: 'Loglar temizlenemedi.' };
    } catch {
      return { success: false, message: 'Sistem hatası.' };
    }
  }
  
  // Status report
  if (cmd.includes('durum') || cmd.includes('rapor')) {
    try {
      const res = await fetch('/api/telemetry');
      const data = await res.json();
      
      const totalClicks = data.logs?.length || 0;
      const uniqueVisitors = new Set(data.logs?.map((l: TelemetryLog) => l.visitor_name)).size;
      
      return {
        success: true,
        message: `📊 DURUM RAPORU\n━━━━━━━━━━━━━━━━\n• Toplam Tıklama: ${totalClicks}\n• Benzersiz Ziyaretçi: ${uniqueVisitors}\n• Sistem: AKTİF\n• Mod: PRODUCTION`
      };
    } catch {
      return { success: false, message: 'Rapor alınamadı.' };
    }
  }
  
  // Help
  if (cmd.includes('yardım') || cmd.includes('help') || cmd === '/börü') {
    return {
      success: true,
      message: `🛠️ BÖRÜ KOMUT SİSTEMİ\n━━━━━━━━━━━━━━━━━━━━\n/börü bakımı-aç    → Siteyi bakıma al\n/börü bakımı-kapat → Bakımı sonlandır\n/börü logları-temizle → Logları sıfırla\n/börü durum-raporu → Analiz özeti\n━━━━━━━━━━━━━━━━━━━━`
    };
  }
  
  return { success: false, message: 'Tanınmayan komut. "/börü yardım" yazın.' };
}

// Welcome message generator
export function generateWelcomeMessage(visitorName: string): string {
  const greetings = [
    `Hoş geldin ${visitorName}, YÖRÜKHAN sistemleri seni tarıyor...`,
    `Tarama tamamlandı. ${visitorName}, stüdyomuza erişim sağlandı.`,
    `Merhaba ${visitorName}. BÖRÜ AI çekirdeği çevrimiçi.`,
  ];
  
  return greetings.join('\n');
}

// AI response generator
export function generateAIResponse(
  input: string,
  projects: Project[],
  profile: VisitorProfile | null,
  isAdmin: boolean
): string | null {
  const lowerInput = input.toLowerCase();
  
  // Check for project queries
  if (lowerInput.includes('proje') || lowerInput.includes('oyun') || lowerInput.includes('uygulama') || lowerInput.includes('app') || lowerInput.includes('game')) {
    const baseResponse = queryProjects(projects, input);
    return adaptResponseToProfile(baseResponse, profile);
  }
  
  // Greeting
  if (lowerInput.includes('merhaba') || lowerInput.includes('selam') || lowerInput === 'hi' || lowerInput === 'hey') {
    const greeting = profile?.primaryLabel 
      ? `Merhaba! Seni bir "${profile.primaryLabel}" olarak tanımladım. Size nasıl yardımcı olabilirim?`
      : 'Merhaba! YÖRÜKHAN stüdyosu hakkında bilgi almak ister misiniz?';
    return greeting;
  }
  
  // Who are you
  if (lowerInput.includes('kimsin') || lowerInput.includes('nedir börü') || lowerInput.includes('börü ne')) {
    return 'Ben BÖRÜ, YÖRÜKHAN Stüdyosunun yapay zeka çekirdeğiyim. Projeler, oyunlar ve uygulamalar hakkında bilgi verebilirim.';
  }
  
  // Help
  if (lowerInput.includes('yardım') || lowerInput === 'help') {
    if (isAdmin) {
      return `🛠️ YÖNETİCİ MODU AKTİF\n\nSorular: "oyunlar", "uygulamalar", "projeler"\nKomutlar: "/börü bakımı-aç", "/börü durum-raporu"`;
    }
    return 'Projelerimiz hakkında bilgi almak için "oyunlar", "uygulamalar" veya "projeler" yazabilirsiniz.';
  }
  
  return null;
}

interface TelemetryLog {
  id: number;
  project_id: number | null;
  project_name: string;
  visitor_name: string;
}