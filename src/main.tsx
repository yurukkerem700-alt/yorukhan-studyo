import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initGlobalErrorHandler, detectFeatures, isLowEndDevice } from './lib/errorHandler'
import { ErrorBoundary } from './components/ErrorBoundary'

// Initialize global error handler
initGlobalErrorHandler();

// Log feature detection on startup
const features = detectFeatures();
console.log('[YÖRÜKHAN] Features detected:', features);

// Check for low-end device
if (isLowEndDevice()) {
  console.log('[YÖRÜKHAN] Low-end device detected - some features may be disabled');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
