import { loadRemote } from '@module-federation/runtime';

class MicrofrontendLoader {
  constructor() {
    this.loadedComponents = new Map();
    this.loadingPromises = new Map();
  }

  async loadComponent(remoteName, componentName) {
    const key = `${remoteName}/${componentName}`;
    
    // Return cached component if already loaded
    if (this.loadedComponents.has(key)) {
      return this.loadedComponents.get(key);
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    // Create loading promise
    const loadingPromise = this.loadComponentInternal(remoteName, componentName);
    this.loadingPromises.set(key, loadingPromise);

    try {
      const component = await loadingPromise;
      this.loadedComponents.set(key, component);
      this.loadingPromises.delete(key);
      return component;
    } catch (error) {
      this.loadingPromises.delete(key);
      throw error;
    }
  }

  async loadComponentInternal(remoteName, componentName) {
    try {
      const module = await loadRemote(`${remoteName}/${componentName}`);
      return module.default || module;
    } catch (error) {
      console.error(`Failed to load ${remoteName}/${componentName}:`, error);
      
      // Return fallback component
      return this.getFallbackComponent(componentName);
    }
  }

  getFallbackComponent(componentName) {
    return () => (
      <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-yellow-800">
            Component "{componentName}" is temporarily unavailable
          </span>
        </div>
      </div>
    );
  }

  preloadComponent(remoteName, componentName) {
    return this.loadComponent(remoteName, componentName);
  }

  clearCache() {
    this.loadedComponents.clear();
    this.loadingPromises.clear();
  }
}

export const microfrontendLoader = new MicrofrontendLoader();