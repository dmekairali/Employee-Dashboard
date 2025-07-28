// src/hooks/useCachedData.js - Enhanced version for Overview compatibility
import { useState, useEffect, useCallback, useRef } from 'react';
import dataManager from '../utils/DataManager';

export const useCachedData = (component, currentUser, fetchFunction, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const isMountedRef = useRef(true);

  const userId = currentUser?.name || currentUser?.id;
  const { 
    autoRefresh = true, 
    silentLoad = false,
    fallbackToEmpty = true 
  } = options;

  // Load data function with enhanced error handling
  const loadData = useCallback(async (forceRefresh = false, silent = false) => {
    if (!userId || !fetchFunction) {
      if (isMountedRef.current) {
        setLoading(false);
        setError('Missing user ID or fetch function');
      }
      return [];
    }

    try {
      if (!silent) setLoading(true);
      setError(null);

      // Check if we have fresh cached data and don't need to force refresh
      if (!forceRefresh && dataManager.hasData(component, userId) && dataManager.isDataFresh(component, userId)) {
        const cachedData = dataManager.getData(component, userId);
        if (isMountedRef.current) {
          setData(cachedData || []);
          setLoading(false);
          setLastRefresh(new Date());
        }
        return cachedData || [];
      }

      // Try to get cached data first (even if stale) to show something immediately
      const cachedData = dataManager.getData(component, userId);
      if (cachedData && !silent && isMountedRef.current) {
        setData(cachedData);
        setLoading(false);
      }

      // Fetch new data
      let newData;
      try {
        newData = await fetchFunction();
        console.log(`[useCachedData] Fetched data for ${component}:`, newData);
      } catch (fetchError) { {
        // If fetch fails but we have cached data, use that
        if (cachedData && fallbackToEmpty) {
          console.warn(`Fetch failed for ${component}, using cached data:`, fetchError);
          if (isMountedRef.current) {
            setData(cachedData);
            setLoading(false);
            setLastRefresh(new Date());
          }
          return cachedData;
        }
        throw fetchError;
      }
      
      // Store in cache and set state
      dataManager.setData(component, userId, newData);
      
      if (isMountedRef.current) {
        setData(newData || []);
        setLastRefresh(new Date());
      }
      
      return newData || [];
    } catch (err) {
      console.error(`Error loading ${component} data:`, err);
      
      if (isMountedRef.current) {
        setError(err.message);
        
        // Try to use cached data as fallback
        const cachedData = dataManager.getData(component, userId);
        if (cachedData && fallbackToEmpty) {
          setData(cachedData);
        } else if (fallbackToEmpty) {
          setData([]);
        }
      }
      
      return [];
    } finally {
      if (isMountedRef.current && !silent) {
        setLoading(false);
      }
    }
  }, [component, userId, fetchFunction, fallbackToEmpty]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    return await loadData(true);
  }, [loadData]);

  // Silent refresh function (for background updates)
  const silentRefresh = useCallback(async () => {
    return await loadData(true, true);
  }, [loadData]);

  // Initialize data on component mount
  useEffect(() => {
    isMountedRef.current = true;
    
    if (userId && fetchFunction) {
      // For Overview component, load data silently if requested
      loadData(false, silentLoad);
      
      // Start auto-refresh if enabled
      if (autoRefresh) {
        dataManager.startAutoRefresh(component, userId, fetchFunction);
      }
    }

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (userId && autoRefresh) {
        dataManager.stopAutoRefresh(component, userId);
      }
    };
  }, [component, userId, fetchFunction, loadData, autoRefresh, silentLoad]);

  // Listen for cache updates (for real-time updates from other components)
  useEffect(() => {
    const checkForUpdates = () => {
      if (userId && dataManager.hasData(component, userId) && isMountedRef.current) {
        const cachedData = dataManager.getData(component, userId);
        if (cachedData && JSON.stringify(cachedData) !== JSON.stringify(data)) {
          setData(cachedData);
          setLastRefresh(new Date());
        }
      }
    };

    // Check for updates every 30 seconds
    const interval = setInterval(checkForUpdates, 30000);
    
    return () => clearInterval(interval);
  }, [component, userId, data]);

  // Get cache metadata
  const cacheMetadata = userId ? dataManager.getCacheMetadata(component, userId) : null;

  return {
    data: data || [],
    loading,
    error,
    refresh,
    silentRefresh,
    lastRefresh,
    cacheMetadata,
    isStale: cacheMetadata ? !cacheMetadata.isFresh : false,
    isEmpty: (!data || data.length === 0) && !loading && !error
  };
};

// Hook specifically for Overview that loads all data
export const useOverviewData = (currentUser) => {
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const userId = currentUser?.name || currentUser?.id;

  const loadAllData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Get all cached data without triggering API calls
      const cachedData = dataManager.getAllCachedData(userId);
      setAllData(cachedData);
      setLastRefresh(new Date());
      
    } catch (err) {
      console.error('Error loading overview data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadAllData();

      // Check for updates every minute
      const interval = setInterval(loadAllData, 60000);
      return () => clearInterval(interval);
    }
  }, [userId, loadAllData]);

  const getCacheSummary = useCallback(() => {
    return userId ? dataManager.getCacheSummary(userId) : {};
  }, [userId]);

  return {
    data: allData,
    loading,
    error,
    refresh: loadAllData,
    lastRefresh,
    cacheSummary: getCacheSummary()
  };
};

// Hook for preloading all data (useful for initial load)
export const useDataPreloader = (currentUser) => {
  const [preloadStatus, setPreloadStatus] = useState({});
  const [preloading, setPreloading] = useState(false);

  const userId = currentUser?.name || currentUser?.id;

  const preloadAllData = useCallback(async () => {
    if (!userId) return;

    setPreloading(true);
    
    try {
      // Define fetch functions for all components
      const fetchFunctions = {};
      
      // Only add fetch functions for modules the user has access to
      if (currentUser.permissions?.canViewDelegation) {
        fetchFunctions.delegation = async () => {
          // This would be the actual fetch function from DelegationTasks component
          return dataManager.getData('delegation', userId) || [];
        };
      }

      if (currentUser.permissions?.canViewFMS) {
        fetchFunctions.fms = async () => {
          return dataManager.getData('fms', userId) || [];
        };
      }

      if (currentUser.permissions?.canViewHT) {
        fetchFunctions.ht = async () => {
          return dataManager.getData('ht', userId) || [];
        };
      }

      if (currentUser.permissions?.canViewPC) {
        fetchFunctions.pc = async () => {
          return dataManager.getData('pc', userId) || [];
        };
      }

      if (currentUser.permissions?.canViewHS) {
        fetchFunctions.hs = async () => {
          return dataManager.getData('hs', userId) || [];
        };
      }

      const results = await dataManager.preloadAllData(userId, fetchFunctions);
      setPreloadStatus(results);
      
    } catch (error) {
      console.error('Error preloading data:', error);
    } finally {
      setPreloading(false);
    }
  }, [userId, currentUser.permissions]);

  return {
    preloadAllData,
    preloadStatus,
    preloading
  };
};
