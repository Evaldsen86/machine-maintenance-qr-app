
// Service Worker for caching 3D models and handling blob URLs

const CACHE_NAME = 'model-cache-v2';
const DB_NAME = 'modelBlobStorage';
const DB_VERSION = 1;
const STORE_NAME = 'models';

// Install event - cache basic assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  
  // Skip waiting to make the new service worker active immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/placeholder.svg'
        ]);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  
  // Claim clients to control all open pages
  event.waitUntil(self.clients.claim());
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Initialize IndexedDB
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      console.error("Error opening IndexedDB:", request.error);
      reject(request.error);
    };
  });
};

// Helper function to store blob in IndexedDB
const storeBlobInDB = async (modelId, blob, type) => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const item = {
        id: modelId,
        blob: blob,
        type: type,
        timestamp: Date.now()
      };
      
      const request = store.put(item);
      
      transaction.oncomplete = () => {
        resolve(true);
      };
      
      transaction.onerror = (e) => {
        console.error("Transaction error:", e);
        reject(e);
      };
    });
  } catch (error) {
    console.error("Failed to store blob in IndexedDB:", error);
    throw error;
  }
};

// Helper function to retrieve blob from IndexedDB
const getBlobFromDB = async (modelId) => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(modelId);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = (e) => {
        console.error("Error reading from IndexedDB:", e);
        reject(e);
      };
    });
  } catch (error) {
    console.error("Failed to get blob from IndexedDB:", error);
    return null;
  }
};

// Fetch event - serve from cache, then network
self.addEventListener('fetch', (event) => {
  // Special handling for model URLs
  if (event.request.url.includes('model3d_') || 
      event.request.url.endsWith('.glb') || 
      event.request.url.endsWith('.usdz') ||
      event.request.url.includes('blob:')) {
    console.log('Service Worker: Fetching 3D model resource', event.request.url);
    
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            console.log('Service Worker: Serving cached model');
            return response;
          }
          
          return fetch(event.request).then((networkResponse) => {
            // Cache a copy of the response
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }).catch(error => {
            console.error('Service Worker: Failed to fetch model:', error);
            // Try to return a fallback if possible
            return cache.match('/placeholder.svg');
          });
        });
      })
    );
    return;
  }
  
  // Handle image URLs (including blob URLs)
  if (event.request.url.includes('/images/') || 
      event.request.url.endsWith('.jpg') || 
      event.request.url.endsWith('.png') || 
      event.request.url.endsWith('.jpeg') ||
      event.request.url.endsWith('.svg')) {
    
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }).catch(error => {
            console.error('Service Worker: Failed to fetch image:', error);
            return cache.match('/placeholder.svg');
          });
        });
      })
    );
    return;
  }
  
  // Standard fetch handling for other resources
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(error => {
          console.error('Service Worker: Failed to fetch resource:', error);
        });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'CACHE_3D_MODEL') {
    const { url, modelId, blobData, contentType } = event.data;
    console.log('Service Worker: Received request to cache 3D model', modelId, url);
    
    try {
      if (blobData) {
        // Store blob data directly
        const blob = new Blob([blobData], { type: contentType || 'application/octet-stream' });
        await storeBlobInDB(modelId, blob, contentType);
        console.log('Service Worker: 3D model blob stored in IndexedDB', modelId);
        
        // Also cache the blob URL if provided
        if (url) {
          const blobResponse = new Response(blob, { 
            status: 200, 
            headers: new Headers({ 'Content-Type': contentType || 'application/octet-stream' }) 
          });
          
          const cache = await caches.open(CACHE_NAME);
          await cache.put(`model3d_${modelId}`, blobResponse);
          console.log('Service Worker: 3D model also cached in Cache Storage', modelId);
        }
      } else if (url) {
        // Fetch from network and cache
        const cache = await caches.open(CACHE_NAME);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        
        // Cache the response
        await cache.put(`model3d_${modelId}`, response.clone());
        
        // Also store in IndexedDB
        const blob = await response.blob();
        await storeBlobInDB(modelId, blob, blob.type);
        
        console.log('Service Worker: 3D model cached successfully from URL', modelId);
      }
    } catch (err) {
      console.error('Service Worker: Failed to cache 3D model', err);
    }
  }
});
