// Rate Limiting ve Anti-Spam Mekanizması

interface RateLimitConfig {
  maxCalls: number;
  windowMs: number;
}

interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

// In-memory rate limit tracker
const rateLimitStore = new Map<string, number[]>();

// Rate limiter - belirli bir zaman penceresinde maksimum çağrı sayısı
export function rateLimit(
  key: string,
  config: RateLimitConfig = { maxCalls: 10, windowMs: 60000 }
): boolean {
  const now = Date.now();
  const calls = rateLimitStore.get(key) || [];
  
  // Eski çağrıları temizle
  const validCalls = calls.filter(time => now - time < config.windowMs);
  
  if (validCalls.length >= config.maxCalls) {
    console.warn(`[YÖRÜKHAN] Rate limit exceeded for: ${key}`);
    return false;
  }
  
  validCalls.push(now);
  rateLimitStore.set(key, validCalls);
  return true;
}

// Debounce - fonksiyonun belirli bir süre bekledikten sonra çalışması
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}

// Throttle - fonksiyonun belirli aralıklarla çalışması
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  options: ThrottleOptions = { leading: true, trailing: true }
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      if (options.leading) {
        func.apply(this, args);
      }
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        if (options.trailing && lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

// Batch processor - verileri toplayıp toplu gönderme
export function createBatchProcessor<T>(
  processFn: (items: T[]) => void | Promise<void>,
  options: {
    maxBatchSize?: number;
    maxWaitMs?: number;
  } = {}
) {
  const { maxBatchSize = 10, maxWaitMs = 500 } = options;
  let batch: T[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  const flush = async () => {
    if (batch.length === 0) return;
    
    const items = [...batch];
    batch = [];
    
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    try {
      await processFn(items);
    } catch (error) {
      console.error('[YÖRÜKHAN] Batch processor error:', error);
    }
  };
  
  return {
    add: (item: T) => {
      batch.push(item);
      
      // Max batch size reached
      if (batch.length >= maxBatchSize) {
        flush();
        return;
      }
      
      // Start timeout if not already started
      if (!timeoutId) {
        timeoutId = setTimeout(flush, maxWaitMs);
      }
    },
    flush,
    clear: () => {
      batch = [];
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  };
}

// Telemetry batch processor
export const telemetryBatcher = createBatchProcessor(
  async (items) => {
    try {
      await fetch('/api/telemetry/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: items })
      });
    } catch (error) {
      console.error('[YÖRÜKHAN] Telemetry batch error:', error);
    }
  },
  { maxBatchSize: 5, maxWaitMs: 500 }
);

// Webhook rate limiter
export const webhookRateLimiter = {
  canSend: (type: string) => rateLimit(`webhook:${type}`, { maxCalls: 20, windowMs: 60000 }),
  reset: (type: string) => rateLimitStore.delete(`webhook:${type}`)
};

// API rate limiter
export const apiRateLimiter = {
  canCall: (endpoint: string) => rateLimit(`api:${endpoint}`, { maxCalls: 100, windowMs: 60000 }),
  reset: (endpoint: string) => rateLimitStore.delete(`api:${endpoint}`)
};

// Clear all rate limits
export function clearAllRateLimits() {
  rateLimitStore.clear();
}