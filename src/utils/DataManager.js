// src/utils/DataManager.js - Enhanced version

class DataManager {
  constructor() {
    this.cache = new Map();
    this.refreshIntervals = new Map();
    this.newTaskCallbacks = new Map();
    this.REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
  }

  // Generate cache key based on component and user
  getCacheKey(component, userId) {
    return `${component}_${userId}`;
  }

  // Set data in cache
  setData(component, userId, data) {
    const key = this.getCacheKey(component, userId);
    const existingData = this.cache.get(key);
    
    // Store new data
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      lastRefresh: Date.now()
    });

    // Check for new tasks if we have existing data
    if (existingData && existingData.data) {
      this.checkForNewTasks(component, existingData.data, data, userId);
    }

    console.log(`Cache updated for ${component}_${userId}: ${Array.isArray(data) ? data.length : 'N/A'} items`);
    return data;
  }

  // Get data from cache
  getData(component, userId) {
    const key = this.getCacheKey(component, userId);
    const cached = this.cache.get(key);
    
    if (cached) {
      console.log(`Cache hit for ${component}_${userId}: ${Array.isArray(cached.data) ? cached.data.length : 'N/A'} items`);
      return cached.data;
    }
    
    console.log(`Cache miss for ${component}_${userId}`);
    return null;
  }

  // Get data with fallback - returns empty array if no data
  getDataWithFallback(component, userId) {
    const data = this.getData(component, userId);
    return data || [];
  }

  // Check if data exists and is fresh
  hasData(component, userId) {
    const key = this.getCacheKey(component, userId);
    return this.cache.has(key);
  }

  // Check if data is fresh (within refresh interval)
  isDataFresh(component, userId) {
    const key = this.getCacheKey(component, userId);
    const cached = this.cache.get(key);
    
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    return age < this.REFRESH_INTERVAL;
  }

  // Get cache metadata
  getCacheMetadata(component, userId) {
    const key = this.getCacheKey(component, userId);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    return {
      timestamp: cached.timestamp,
      lastRefresh: cached.lastRefresh,
      age: Date.now() - cached.timestamp,
      isFresh: this.isDataFresh(component, userId),
      itemCount: Array.isArray(cached.data) ? cached.data.length : 0
    };
  }

  // Force refresh data
  async refreshData(component, userId, fetchFunction) {
    try {
      console.log(`Force refreshing ${component} data for user ${userId}`);
      const newData = await fetchFunction();
      this.setData(component, userId, newData);
      return newData;
    } catch (error) {
      console.error(`Error refreshing ${component} data:`, error);
      throw error;
    }
  }

  // Start auto-refresh for a component
  startAutoRefresh(component, userId, fetchFunction) {
    const key = this.getCacheKey(component, userId);
    
    // Clear existing interval if any
    if (this.refreshIntervals.has(key)) {
      clearInterval(this.refreshIntervals.get(key));
    }

    // Set up new interval
    const intervalId = setInterval(async () => {
      try {
        await this.refreshData(component, userId, fetchFunction);
        console.log(`Auto-refreshed ${component} data for user ${userId}`);
      } catch (error) {
        console.error(`Auto-refresh failed for ${component}:`, error);
      }
    }, this.REFRESH_INTERVAL);

    this.refreshIntervals.set(key, intervalId);
    console.log(`Started auto-refresh for ${component}_${userId}`);
  }

  // Stop auto-refresh for a component
  stopAutoRefresh(component, userId) {
    const key = this.getCacheKey(component, userId);
    
    if (this.refreshIntervals.has(key)) {
      clearInterval(this.refreshIntervals.get(key));
      this.refreshIntervals.delete(key);
      console.log(`Stopped auto-refresh for ${component}_${userId}`);
    }
  }

  // Register callback for new task notifications
  registerNewTaskCallback(userId, callback) {
    this.newTaskCallbacks.set(userId, callback);
    console.log(`Registered new task callback for user ${userId}`);
  }

  // Unregister callback
  unregisterNewTaskCallback(userId) {
    this.newTaskCallbacks.delete(userId);
    console.log(`Unregistered new task callback for user ${userId}`);
  }

  // Check for new tasks by comparing old and new data
  checkForNewTasks(component, oldData, newData, userId) {
    if (!Array.isArray(oldData) || !Array.isArray(newData)) return;

    const newTasks = this.findNewTasks(oldData, newData);
    
    if (newTasks.length > 0) {
      console.log(`Found ${newTasks.length} new tasks in ${component} for user ${userId}`);
      const callback = this.newTaskCallbacks.get(userId);
      if (callback) {
        callback({
          component,
          newTasks,
          count: newTasks.length
        });
      }
    }
  }

  // Find new tasks by comparing IDs or unique identifiers
  findNewTasks(oldData, newData) {
    // Get existing task identifiers
    const existingIds = new Set(oldData.map(task => this.getTaskId(task)));
    
    // Find tasks that don't exist in old data
    return newData.filter(task => !existingIds.has(this.getTaskId(task)));
  }

  // Get unique task identifier based on component type
  getTaskId(task) {
    // For HT tasks
    if (task.ticketId) return task.ticketId;
    
    // For FMS and PC tasks - use Row + FMS + What to Do combination
    if (task.row || task.fms || task.what_to_do) {
      const row = task.row || task.rowNumber || '';
      const fms = task.fms || '';
      const whatToDo = task.what_to_do || '';
      
      // Create unique ID from combination
      const combinedId = `${row}_${fms}_${whatToDo}`;
      return this.createHashFromString(combinedId);
    }
    
    // For delegation tasks - use row number
    if (task.rowNumber) return `delegation_${task.rowNumber}`;
    
    // Fallback: create hash from task content
    return this.createTaskHash(task);
  }

  // Create hash from string
  createHashFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Create simple hash from task object
  createTaskHash(task) {
    const str = JSON.stringify(task);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Get all cached data for overview
  getAllCachedData(userId) {
    const components = ['delegation', 'fms', 'ht', 'pc', 'hs'];
    const allData = {};
    
    components.forEach(component => {
      allData[component] = this.getDataWithFallback(component, userId);
    });
    
    return allData;
  }

  // Get summary statistics for all cached data
  getCacheSummary(userId) {
    const allData = this.getAllCachedData(userId);
    const summary = {};
    
    Object.keys(allData).forEach(component => {
      const data = allData[component];
      const metadata = this.getCacheMetadata(component, userId);
      
      summary[component] = {
        count: data.length,
        lastUpdate: metadata?.lastRefresh || null,
        isFresh: metadata?.isFresh || false,
        age: metadata?.age || 0
      };
    });
    
    return summary;
  }

  // Preload all data for a user (useful for overview)
  async preloadAllData(userId, fetchFunctions) {
    const results = {};
    const components = Object.keys(fetchFunctions);
    
    console.log(`Preloading data for user ${userId}: ${components.join(', ')}`);
    
    for (const component of components) {
      try {
        if (!this.isDataFresh(component, userId)) {
          console.log(`Preloading ${component} data...`);
          const data = await fetchFunctions[component]();
          this.setData(component, userId, data);
          results[component] = { success: true, count: data.length };
        } else {
          console.log(`${component} data is fresh, skipping preload`);
          results[component] = { success: true, cached: true };
        }
      } catch (error) {
        console.error(`Failed to preload ${component}:`, error);
        results[component] = { success: false, error: error.message };
      }
    }
    
    return results;
  }

  // Clear all cache and intervals
  clearAll() {
    // Clear all intervals
    this.refreshIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    
    // Clear all data
    this.cache.clear();
    this.refreshIntervals.clear();
    this.newTaskCallbacks.clear();
    
    console.log('Cleared all cache and intervals');
  }

  // Clear cache for specific user
  clearUserCache(userId) {
    const keysToDelete = [];
    
    this.cache.forEach((value, key) => {
      if (key.endsWith(`_${userId}`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      // Also stop auto-refresh if exists
      if (this.refreshIntervals.has(key)) {
        clearInterval(this.refreshIntervals.get(key));
        this.refreshIntervals.delete(key);
      }
    });
    
    console.log(`Cleared cache for user ${userId}: ${keysToDelete.length} items`);
  }

  // Get cache stats for debugging
  getCacheStats() {
    const stats = {};
    this.cache.forEach((value, key) => {
      stats[key] = {
        dataCount: Array.isArray(value.data) ? value.data.length : 'N/A',
        lastRefresh: new Date(value.lastRefresh).toLocaleTimeString(),
        age: Math.round((Date.now() - value.timestamp) / 1000 / 60) + ' minutes',
        isFresh: (Date.now() - value.timestamp) < this.REFRESH_INTERVAL
      };
    });
    return stats;
  }

  // Export cache data for debugging
  exportCacheData() {
    const exportData = {};
    this.cache.forEach((value, key) => {
      exportData[key] = {
        ...value,
        dataPreview: Array.isArray(value.data) ? value.data.slice(0, 3) : value.data
      };
    });
    return exportData;
  }

  // Import cache data (useful for testing)
  importCacheData(importData) {
    Object.keys(importData).forEach(key => {
      this.cache.set(key, importData[key]);
    });
    console.log(`Imported cache data for ${Object.keys(importData).length} keys`);
  }
}

// Export singleton instance
const dataManager = new DataManager();
export default dataManager;
