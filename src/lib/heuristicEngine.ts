// YÖRÜKHAN Karakter Hevristiği Motoru
// Algoritmik profilleme ve karakter matrisi hesaplamaları

export interface VisitorMetrics {
  name: string;
  totalHoverDuration: number;
  totalClicks: number;
  rapidMovements: number;
  totalMovement: number;
  avgVelocity: number;
  magneticInteractions: number;
  sessionDuration: number;
  projectClicks: number;
  clickPattern: 'aggressive' | 'moderate' | 'passive';
  explorationDepth: number;
}

export interface CharacterProfile {
  primaryLabel: string;
  secondaryLabel: string;
  curiosity: number;
  patience: number;
  determination: number;
  traits: string[];
}

// Fare hareket analizi
export function analyzeMouseBehavior(metrics: VisitorMetrics): {
  stressLevel: number;
  focusLevel: number;
  rhythmScore: number;
} {
  const { rapidMovements, totalMovement, avgVelocity, totalHoverDuration } = metrics;
  
  // Stres seviyesi (0-100): Hızlı hareketler ve yüksek velocity
  const stressLevel = Math.min(100, Math.round(
    (rapidMovements * 5) + 
    (avgVelocity * 30) - 
    (totalHoverDuration / 100)
  ));
  
  // Odak seviyesi (0-100): Uzun hover ve düşük kaotik hareket
  const focusLevel = Math.min(100, Math.max(0, Math.round(
    (totalHoverDuration / 50) - 
    (rapidMovements * 2) + 
    (metrics.explorationDepth * 10)
  )));
  
  // Ritim skoru (0-100): Hareketlerin tutarlılığı
  const movementConsistency = totalMovement > 0 
    ? Math.max(0, 100 - (rapidMovements / Math.max(1, metrics.totalClicks + 1)) * 50)
    : 50;
  const rhythmScore = Math.round(movementConsistency);
  
  return { stressLevel, focusLevel, rhythmScore };
}

// Merak analizi
export function analyzeCuriosity(metrics: VisitorMetrics): number {
  const { magneticInteractions, explorationDepth, totalHoverDuration, projectClicks } = metrics;
  
  // Merak skoru (0-100)
  const curiosityScore = Math.min(100, Math.round(
    (magneticInteractions * 8) +
    (explorationDepth * 15) +
    (totalHoverDuration / 200) +
    (projectClicks * 10)
  ));
  
  return curiosityScore;
}

// Sabır analizi
export function analyzePatience(metrics: VisitorMetrics): number {
  const { rapidMovements, avgVelocity, totalHoverDuration, clickPattern } = metrics;
  
  let patienceBase = 100;
  
  // Hızlı hareketler sabrı azaltır
  patienceBase -= rapidMovements * 3;
  
  // Yüksek velocity sabrı azaltır
  patienceBase -= avgVelocity * 20;
  
  // Uzun hover süresi sabrı artırır
  patienceBase += totalHoverDuration / 150;
  
  // Tıklama paterni etkisi
  if (clickPattern === 'aggressive') patienceBase -= 20;
  if (clickPattern === 'passive') patienceBase += 10;
  
  return Math.min(100, Math.max(0, Math.round(patienceBase)));
}

// Kararlılık analizi
export function analyzeDetermination(metrics: VisitorMetrics): number {
  const { projectClicks, totalClicks, explorationDepth, totalHoverDuration } = metrics;
  
  // Kararlılık skoru (0-100)
  const determinationScore = Math.min(100, Math.round(
    (projectClicks * 12) +
    (explorationDepth * 20) +
    (totalHoverDuration / 300) +
    (metrics.sessionDuration / 60)
  ));
  
  return determinationScore;
}

// Ana karakter etiketi belirleme
export function determineCharacterProfile(metrics: VisitorMetrics): CharacterProfile {
  const { stressLevel, focusLevel, rhythmScore } = analyzeMouseBehavior(metrics);
  const curiosity = analyzeCuriosity(metrics);
  const patience = analyzePatience(metrics);
  const determination = analyzeDetermination(metrics);
  
  const traits: string[] = [];
  let primaryLabel = '';
  let secondaryLabel = '';
  
  // Ana karakter belirleme mantığı
  
  // Odak ve Hırs Katsayısı
  if (focusLevel > 70 && determination > 60) {
    primaryLabel = 'Hedefe Kilitli';
    traits.push('Avcı');
  } else if (focusLevel < 30 && metrics.totalClicks < 3) {
    primaryLabel = 'Yüzeysel';
    traits.push('Çabuk Vazgeçen');
  }
  
  // Merak ve Etkileşim Katsayısı
  if (curiosity > 70 && metrics.magneticInteractions > 3) {
    if (primaryLabel) {
      secondaryLabel = 'Yüksek Meraklı';
    } else {
      primaryLabel = 'Detaycı Kaşif';
    }
    traits.push('Kaşif');
  } else if (curiosity < 40 && metrics.projectClicks > 2) {
    if (primaryLabel) {
      secondaryLabel = 'Sonuç Odaklı';
    } else {
      primaryLabel = 'Pragmatik';
    }
    traits.push('Pragmatik');
  }
  
  // Stres ve Sabır Matrisi
  if (stressLevel > 60 && patience < 40) {
    if (primaryLabel) {
      secondaryLabel = 'Baskı Altında';
    } else {
      primaryLabel = 'Sabırsız';
    }
    traits.push('Sabırsız');
  } else if (rhythmScore > 70 && patience > 60) {
    if (primaryLabel) {
      secondaryLabel = 'Soğukkanlı';
    } else {
      primaryLabel = 'Stratejist';
    }
    traits.push('Soğukkanlı');
  }
  
  // Varsayılan etiketler
  if (!primaryLabel) {
    primaryLabel = 'Normal Ziyaretçi';
  }
  if (!secondaryLabel) {
    secondaryLabel = 'Standart';
  }
  
  // Tam karakter etiketi oluştur
  const fullLabel = secondaryLabel && secondaryLabel !== 'Standart' 
    ? `${secondaryLabel} ${primaryLabel}`
    : primaryLabel;
  
  return {
    primaryLabel: fullLabel,
    secondaryLabel,
    curiosity,
    patience,
    determination,
    traits: [...new Set(traits)] // Tekrarları kaldır
  };
}

// Toplu ziyaretçi analizi
export function analyzeAllVisitors(
  telemetryLogs: Array<{ 
    visitor_name: string; 
    clicked_at: string;
    project_name?: string;
  }>
): Map<string, VisitorMetrics> {
  const visitorMap = new Map<string, VisitorMetrics>();
  
  telemetryLogs.forEach(log => {
    const name = log.visitor_name || 'Anonim';
    
    if (!visitorMap.has(name)) {
      visitorMap.set(name, {
        name,
        totalHoverDuration: 0,
        totalClicks: 0,
        rapidMovements: 0,
        totalMovement: 0,
        avgVelocity: 0,
        magneticInteractions: 0,
        sessionDuration: 0,
        projectClicks: 0,
        clickPattern: 'moderate',
        explorationDepth: 0
      });
    }
    
    const metrics = visitorMap.get(name)!;
    metrics.totalClicks++;
    
    if (log.project_name) {
      metrics.projectClicks++;
      metrics.explorationDepth = Math.min(10, metrics.projectClicks);
    }
    
    // Simüle edilmiş metrikler (gerçek verilerle replace edilebilir)
    metrics.totalHoverDuration += Math.random() * 3000 + 1000;
    metrics.magneticInteractions += Math.floor(Math.random() * 3);
    metrics.rapidMovements += Math.floor(Math.random() * 5);
    metrics.avgVelocity = (metrics.avgVelocity + Math.random() * 0.5) / 2;
    metrics.sessionDuration += 15000;
  });
  
  // Click pattern belirleme
  visitorMap.forEach(metrics => {
    if (metrics.totalClicks > 10) {
      metrics.clickPattern = 'aggressive';
    } else if (metrics.totalClicks < 3) {
      metrics.clickPattern = 'passive';
    }
  });
  
  return visitorMap;
}

// Karakter dağılımı hesaplama
export function calculateCharacterDistribution(
  profiles: Map<string, CharacterProfile>
): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  profiles.forEach(profile => {
    const label = profile.primaryLabel;
    distribution[label] = (distribution[label] || 0) + 1;
  });
  
  return distribution;
}