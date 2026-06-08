// Global Error Handler ve Graceful Degradation

let isDegradedMode = false;
let errorCount = 0;
const MAX_ERRORS = 3;

export interface ErrorInfo {
  message: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: number;
}

const errorLog: ErrorInfo[] = [];

// Global error handler
export function initGlobalErrorHandler() {
  // Window onerror
  window.onerror = function(message, filename, lineno, colno, error) {
    handleError({
      message: String(message),
      filename,
      lineno,
      colno,
      timestamp: Date.now()
    });
    return true; // Prevent default browser error handling
  };

  // Unhandled promise rejection
  window.onunhandledrejection = function(event) {
    handleError({
      message: `Unhandled Promise: ${event.reason}`,
      timestamp: Date.now()
    });
  };

  // React error boundary fallback
  console.log('[YÖRÜKHAN] Global error handler initialized');
}

function handleError(error: ErrorInfo) {
  errorLog.push(error);
  errorCount++;
  
  console.error('[YÖRÜKHAN Error]', error);
  
  // If too many errors, enable degraded mode
  if (errorCount >= MAX_ERRORS && !isDegradedMode) {
    enableDegradedMode();
  }
}

export function enableDegradedMode() {
  isDegradedMode = true;
  console.warn('[YÖRÜKHAN] Degraded mode enabled - disabling advanced features');
  
  // Dispatch custom event for components to listen
  window.dispatchEvent(new CustomEvent('yorkhan:degraded-mode'));
}

export function disableDegradedMode() {
  isDegradedMode = false;
  errorCount = 0;
  window.dispatchEvent(new CustomEvent('yorkhan:normal-mode'));
}

export function isInDegradedMode() {
  return isDegradedMode;
}

export function getErrorLog() {
  return [...errorLog];
}

export function clearErrorLog() {
  errorLog.length = 0;
  errorCount = 0;
}

// Feature detection
export function detectFeatures() {
  const features = {
    webgl: false,
    canvas: false,
    cssTransforms: false,
    cssTransitions: false,
    requestAnimationFrame: false,
    performance: false
  };
  
  try {
    // WebGL detection
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    features.webgl = !!gl;
    
    // Canvas detection
    features.canvas = !!canvas.getContext('2d');
    
    // CSS features
    const div = document.createElement('div');
    features.cssTransforms = 'transform' in div.style || 'webkitTransform' in div.style;
    features.cssTransitions = 'transition' in div.style || 'webkitTransition' in div.style;
    
    // requestAnimationFrame
    features.requestAnimationFrame = typeof window.requestAnimationFrame === 'function';
    
    // Performance API
    features.performance = typeof window.performance !== 'undefined';
    
  } catch (e) {
    console.warn('[YÖRÜKHAN] Feature detection failed:', e);
  }
  
  return features;
}

// Check if device is low-end
export function isLowEndDevice() {
  // Check for low memory (if available)
  const nav = navigator as any;
  if (nav.deviceMemory && nav.deviceMemory < 4) {
    return true;
  }
  
  // Check for slow connection
  if (nav.connection) {
    const connection = nav.connection;
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return true;
    }
  }
  
  // Check hardware concurrency
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return true;
  }
  
  return false;
}

// Safe execution wrapper
export function safeExecute<T>(
  fn: () => T, 
  fallback?: T,
  context?: string
): T | undefined {
  try {
    return fn();
  } catch (error) {
    console.error(`[YÖRÜKHAN] Safe execute error${context ? ` in ${context}` : ''}:`, error);
    if (isDegradedMode) {
      return fallback;
    }
    handleError({
      message: String(error),
      timestamp: Date.now()
    });
    return fallback;
  }
}

// Async safe execution
export async function safeExecuteAsync<T>(
  fn: () => Promise<T>,
  fallback?: T,
  context?: string
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[YÖRÜKHAN] Async error${context ? ` in ${context}` : ''}:`, error);
    if (isDegradedMode) {
      return fallback;
    }
    handleError({
      message: String(error),
      timestamp: Date.now()
    });
    return fallback;
  }
}