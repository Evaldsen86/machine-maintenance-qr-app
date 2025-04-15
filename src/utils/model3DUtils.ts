import { Model3D } from "@/types";

/**
 * Checks if the current browser supports 3D USDZ files viewing
 * @returns boolean indicating if USDZ viewing is supported
 */
export const isUSDZSupported = (): boolean => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  console.log("USDZ support check - iOS:", isIOS);
  return isIOS;
};

/**
 * Checks if the current browser supports 3D GLB files viewing
 * @returns boolean indicating if GLB viewing is supported
 */
export const isGLBSupported = (): boolean => {
  // All modern browsers with WebGL support can view GLB files
  try {
    const canvas = document.createElement('canvas');
    const hasWebGL = !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
    console.log("GLB support check - WebGL:", hasWebGL);
    return hasWebGL;
  } catch (e) {
    console.error("WebGL not supported:", e);
    return false;
  }
};

/**
 * Check if device supports AR functionality
 * @returns boolean indicating if AR is supported
 */
export const isARSupported = (): boolean => {
  // Check if the browser supports WebXR
  const hasWebXR = 'xr' in navigator && 'isSessionSupported' in (navigator as any).xr;
  
  // Check if iOS device (for AR Quick Look support)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  // Check if Android with ARCore support (simplified check)
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  // Check for model-viewer with AR support
  const hasModelViewer = typeof document !== 'undefined' && 
                         !!customElements.get('model-viewer');
  
  console.log("AR support check - WebXR:", hasWebXR, "iOS:", isIOS, "Android:", isAndroid, "model-viewer:", hasModelViewer);
  
  // Return true for desktop browsers as well to allow the AR button to appear
  // The actual AR functionality will only be available on supported devices
  return true; // We're allowing AR button for all devices now
};

/**
 * Get a user-friendly message about 3D support based on browser capabilities
 */
export const get3DSupportMessage = (): string => {
  if (isGLBSupported()) {
    return "Din enhed understøtter 3D-visning. Klik på 'Vis i 3D' for at se 3D-modellen.";
  } else {
    return "Din enhed understøtter ikke 3D-visning. Prøv venligst med en moderne browser.";
  }
};

/**
 * Get a user-friendly message about AR support based on device capabilities
 */
export const getARSupportMessage = (): string => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  if (isIOS) {
    return "For at bruge AR på iOS: 1) Åbn denne side i Safari, 2) Tryk på AR-ikonet.";
  } else if (isAndroid) {
    return "For at bruge AR på Android: 1) Brug Chrome browser, 2) Tillad kameraadgang, 3) Tryk på AR-ikonet.";
  } else {
    return "AR (Augmented Reality) kræver en mobil enhed med AR-support. Prøv at scanne QR-koden med din mobiltelefon.";
  }
};

/**
 * Checks if a file is a valid 3D file based on extension
 */
export const isValid3DFile = (file: File): boolean => {
  // Check by file extension first - this is the most reliable method
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.glb') || fileName.endsWith('.usdz')) {
    return true;
  }
  
  // Some systems may correctly identify the mime type
  const mimeType = file.type.toLowerCase();
  return mimeType === 'model/gltf-binary' || 
         mimeType === 'model/usdz' || 
         mimeType.includes('gltf') || 
         mimeType.includes('glb');
};

/**
 * Checks if a file is a valid GLB file based on extension
 */
export const isValidGLBFile = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.glb');
};

/**
 * Checks if a file is a valid USDZ file based on extension
 */
export const isValidUSDZFile = (file: File): boolean => {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.usdz');
};

/**
 * Gets the file type from a 3D model file
 */
export const get3DFileType = (file: File): '3d-glb' | '3d-usdz' | null => {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.glb')) return '3d-glb';
  if (fileName.endsWith('.usdz')) return '3d-usdz';
  return null;
};

/**
 * Creates a basic Model3D object from a file
 */
export const createModel3DFromFile = (
  file: File, 
  thumbnailUrl?: string
): Model3D => {
  const fileUrl = URL.createObjectURL(file);
  const fileType = get3DFileType(file);
  
  if (!fileType) {
    throw new Error('Unsupported 3D file type');
  }
  
  console.log(`Creating Model3D object - Type: ${fileType}, File: ${file.name}, Thumbnail: ${thumbnailUrl || 'none'}`);
  
  // Generate a unique ID for this model
  const modelId = `model3d_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  // If service worker is available, ask it to cache the model
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_3D_MODEL',
      url: fileUrl,
      modelId: modelId
    });
  }
  
  // Store the blob data in IndexedDB for persistence
  storeModelInIndexedDB(modelId, file, fileUrl);
  
  return {
    id: modelId,
    fileUrl,
    fileType,
    fileName: file.name,
    thumbnail: thumbnailUrl || '',  // Ensure thumbnail is never undefined
  };
};

/**
 * Store model blob data in IndexedDB for persistence
 */
const storeModelInIndexedDB = (modelId: string, file: File, fileUrl: string) => {
  try {
    const request = window.indexedDB.open('modelStorage', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['models'], 'readwrite');
      const store = transaction.objectStore('models');
      
      // Read the file as ArrayBuffer
      const reader = new FileReader();
      reader.onload = () => {
        const modelData = {
          id: modelId,
          name: file.name,
          type: file.type,
          data: reader.result,
          timestamp: Date.now()
        };
        
        const storeRequest = store.put(modelData);
        storeRequest.onsuccess = () => {
          console.log('Successfully stored 3D model in IndexedDB:', modelId);
        };
        storeRequest.onerror = (event) => {
          console.error('Error storing 3D model in IndexedDB:', event);
        };
      };
      
      reader.readAsArrayBuffer(file);
    };
    
    request.onerror = (event) => {
      console.error('Error accessing IndexedDB:', event);
    };
  } catch (err) {
    console.error('Error storing model in IndexedDB:', err);
  }
};

/**
 * Retrieves model data from IndexedDB and creates a blob URL
 */
export const retrieveModelFromIndexedDB = (modelId: string): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open('modelStorage', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['models'], 'readonly');
        const store = transaction.objectStore('models');
        const getRequest = store.get(modelId);
        
        getRequest.onsuccess = () => {
          const modelData = getRequest.result;
          if (modelData && modelData.data) {
            // Create a new blob and URL
            const blob = new Blob([modelData.data], { type: modelData.type });
            const url = URL.createObjectURL(blob);
            console.log('Successfully retrieved 3D model from IndexedDB:', modelId);
            resolve(url);
          } else {
            console.log('Model not found in IndexedDB:', modelId);
            resolve(null);
          }
        };
        
        getRequest.onerror = (event) => {
          console.error('Error retrieving model from IndexedDB:', event);
          resolve(null);
        };
      };
      
      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        resolve(null);
      };
    } catch (err) {
      console.error('Error in retrieveModelFromIndexedDB:', err);
      resolve(null);
    }
  });
};

/**
 * Check if there is a valid image source available (either preview or existing images)
 */
export const hasValidImageSource = (previewUrl: string | null, existingImages: string[]): boolean => {
  return !!previewUrl || (existingImages && existingImages.length > 0);
};

/**
 * Get instructions for accessing 3D models
 */
export const get3DViewingInstructions = (): string => {
  return "For at se 3D-modeller: 1) Upload et billede, 2) Tilføj en 3D-model til billedet, 3) Gem maskinen, 4) Klik på billedet i galleriet, 5) Tryk på '3D' eller 'Vis i 3D' knappen.";
};

/**
 * Logs the 3D model details for debugging
 */
export const debug3DModel = (model: Model3D | null): void => {
  if (!model) {
    console.log("No 3D model to debug");
    return;
  }
  
  console.log("3D Model debug info:", {
    fileName: model.fileName,
    fileUrl: model.fileUrl,
    fileType: model.fileType,
    hasThumbnail: !!model.thumbnail,
    thumbnailUrl: model.thumbnail
  });
  
  // Check if the model URL is valid and accessible
  fetch(model.fileUrl, { method: 'HEAD' })
    .then(response => {
      console.log(`Model URL response status: ${response.status}, ok: ${response.ok}`);
    })
    .catch(error => {
      console.error("Error accessing model URL:", error);
    });
};

/**
 * Check if a Model3D object has valid data
 */
export const isValidModel3D = (model: Model3D | null): boolean => {
  if (!model) return false;
  return !!model.fileUrl && !!model.fileType;
};

/**
 * Stores 3D model data in localStorage to persist it between page reloads
 */
export const store3DModel = (model: Model3D): string => {
  try {
    const storageKey = `model3d_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const modelData = {
      fileUrl: model.fileUrl,
      fileType: model.fileType,
      fileName: model.fileName,
      thumbnail: model.thumbnail,
      storedAt: new Date().toISOString()
    };
    
    localStorage.setItem(storageKey, JSON.stringify(modelData));
    console.log("3D model stored with key:", storageKey);
    return storageKey;
  } catch (error) {
    console.error("Error storing 3D model:", error);
    return "";
  }
};

/**
 * Ensures the model-viewer script is loaded
 */
export const loadModelViewerScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.querySelector('script[src*="modelviewer.min.js"]') || 
       (typeof customElements !== 'undefined' && customElements.get('model-viewer'))) {
      console.log("Model Viewer already loaded");
      resolve(true);
      return;
    }
    
    console.log("Loading model-viewer script...");
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js';
    
    script.onload = () => {
      console.log('Model Viewer script loaded successfully');
      // Wait a short time to ensure model-viewer is fully initialized
      setTimeout(() => {
        resolve(true);
      }, 500);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Model Viewer script:', error);
      resolve(false);
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Generates a data URL for a 3D model to make it viewable in AR
 * This is useful for blob URLs that might not be directly accessible
 */
export const generateDataUrlFrom3DModel = async (model: Model3D): Promise<string | null> => {
  try {
    // Fetch the model data
    const response = await fetch(model.fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch 3D model: ${response.status}`);
    }
    
    // Convert to blob
    const blob = await response.blob();
    
    // Convert to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error generating data URL from 3D model:", error);
    return null;
  }
};
