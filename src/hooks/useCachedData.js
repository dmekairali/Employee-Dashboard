// src/hooks/useCachedData.js
import { useState, useEffect, useCallback } from 'react';
import dataManager from '../utils/DataManager';

export const useCachedData = (component, currentUser, fetchFunction) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const userId = currentUser?.name || currentUser?.id;

  // Load data function
  const loadData = useCallback(async (forceRefresh = false) => {
    if (!userId || !fetchFunction) return;

    try {
      setLoading(true);
      setError(null);

      // Check if we have cached data and don't need to force refresh
      if (!forceRefresh && dataManager.hasData(component, userId)) {
        const cachedData = dataManager.getData(component, userId);
        setData(cachedData || []);
        setLoading(false);
        setLastRefresh(new Date());
        return cachedData;
      }

      // Fetch new data
      const newData = await fetchFunction();
      
      // Store in cache and set state
      dataManager.setData(component, userId, newData);
      setData(newData || []);
      setLastRefresh(new Date());
      
      return newData;
    } catch (err) {
      console.error(`Error loading ${component} data:`, err);
      setError(err.message);
      
      // Try to use cached data as fallback
      const cachedData = dataManager.getData(component, userId);
      if (cachedData) {
        setData(cachedData);
      }
    } finally {
      setLoading(false);
    }
  }, [component, userId, fetchFunction]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    return await loadData(true);
  }, [loadData]);

  // Initialize data on component mount
  useEffect(() => {
    if (userId && fetchFunction) {
      loadData();
      
      // Start auto-refresh
      dataManager.startAutoRefresh(component, userId, fetchFunction);
    }

    // Cleanup on unmount
    return () => {
      if (userId) {
        dataManager.stopAutoRefresh(component, userId);
      }
    };
  }, [component, userId, fetchFunction, loadData]);

  // Update data when cache changes (for auto-refresh)
  useEffect(() => {
    const checkForUpdates = () => {
      if (userId && dataManager.hasData(component, userId)) {
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

  return {
    data,
    loading,
    error,
    refresh,
    lastRefresh
  };
};