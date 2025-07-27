// src/utils/DataManager.js

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

    return data;
  }

  // Get data from cache
  getData(component, userId) {
    const key = this.getCacheKey(component, userId);
    const cached = this.cache.get(key);
    
    if (cached) {
      return cached.data;
    }
    
    return null;
  }

  // Check if data exists and is fresh
  hasData(component, userId) {
    const key = this.getCacheKey(component, userId);
    return this.cache.has(key);
  }

  // Force refresh data
  async refreshData(component, userId, fetchFunction) {
    try {
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
  }

  // Stop auto-refresh for a component
  stopAutoRefresh(component, userId) {
    const key = this.getCacheKey(component, userId);
    
    if (this.refreshIntervals.has(key)) {
      clearInterval(this.refreshIntervals.get(key));
      this.refreshIntervals.delete(key);
    }
  }

  // Register callback for new task notifications
  registerNewTaskCallback(userId, callback) {
    this.newTaskCallbacks.set(userId, callback);
  }

  // Unregister callback
  unregisterNewTaskCallback(userId) {
    this.newTaskCallbacks.delete(userId);
  }

  // Check for new tasks by comparing old and new data
  checkForNewTasks(component, oldData, newData, userId) {
    if (!Array.isArray(oldData) || !Array.isArray(newData)) return;

    const newTasks = this.findNewTasks(oldData, newData);
    
    if (newTasks.length > 0) {
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
  }

  // Get cache stats for debugging
  getCacheStats() {
    const stats = {};
    this.cache.forEach((value, key) => {
      stats[key] = {
        dataCount: Array.isArray(value.data) ? value.data.length : 'N/A',
        lastRefresh: new Date(value.lastRefresh).toLocaleTimeString(),
        age: Math.round((Date.now() - value.timestamp) / 1000 / 60) + ' minutes'
      };
    });
    return stats;
  }
}

// Export singleton instance
const dataManager = new DataManager();
export default dataManager;