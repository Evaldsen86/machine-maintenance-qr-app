
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { toast } from '@/hooks/use-toast';

// Register a service worker to cache blob URLs if browser supports it
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
      
      // Check for updates to the service worker
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('New content is available; please refresh.');
              } else {
                console.log('Content is cached for offline use.');
              }
            }
          };
        }
      };
    }).catch(error => {
      console.error('ServiceWorker registration failed: ', error);
    });
  });
  
  // Handle service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service worker controller has changed, reloading page for fresh content');
  });
}

// Initialize IndexedDB for storing blob URLs if needed
const initIndexedDB = () => {
  try {
    const request = window.indexedDB.open('modelStorage', 1);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('models')) {
        const store = db.createObjectStore('models', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = () => {
      console.log('IndexedDB initialized for 3D model storage');
    };
    
    request.onerror = (event) => {
      console.error('IndexedDB initialization failed:', event);
    };
  } catch (err) {
    console.error('Error initializing IndexedDB:', err);
  }
};

// Start the initialization
initIndexedDB();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
