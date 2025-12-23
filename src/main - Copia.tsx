import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/visual-law.css'
import './styles/textbox.css'
import { initializeEnvironmentSecurity } from '@/lib/environmentSecurity'
import { createSecureFetch, getSecurityMetaTags } from '@/lib/securityHeaders'
import { initializeSecurityValidation } from '@/lib/securityValidator'
import { securityHardening } from '@/lib/securityHardening'

// Initialize comprehensive security systems
initializeEnvironmentSecurity();
initializeSecurityValidation();
securityHardening.initialize();

// Apply security headers to fetch requests
createSecureFetch();

// Add security meta tags to document head
const securityMetaTags = getSecurityMetaTags();
securityMetaTags.forEach(tag => {
  const meta = document.createElement('meta');
  Object.entries(tag).forEach(([key, value]) => {
    meta.setAttribute(key, value);
  });
  document.head.appendChild(meta);
});

createRoot(document.getElementById("root")!).render(<App />);
