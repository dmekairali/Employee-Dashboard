// React Hook for Google Sheets integration
// src/hooks/useGoogleSheets.js

import { useState, useEffect, useCallback, useRef } from 'react';
import GoogleSheetsService from '../services/googleSheetsService';

// Main hook for fetching all dashboard data
export const useGoogleSheets = (options = {}) => {
  const {
    autoFetch = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes default
    retryAttempts = 3,
    retryDelay = 1000 // 1 second
  } = options;

  const [data, setData] = useState({
    fmsTasks: [],
    hrReplyPending: [],
    delegationTasks: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const refreshIntervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Fetch data with retry logic
  const fetchDataWithRetry = useCallback(async (attempt = 1) => {
    if (!mountedRef.current) return;

    try {
      setError(null);
      if (attempt === 1) {
        setLoading(true);
        setConnectionStatus('connecting');
      }

      console.log(`🔄 Fetching dashboard data (attempt ${attempt}/${retryAttempts})`);
      
      const startTime = Date.now();
      const dashboardData = await GoogleSheetsService.fetchAllDashboardData();
      const endTime = Date.now();
      
      if (!mountedRef.current) return;

      // Update state with new data
      setData(dashboardData);
      setLastUpdated(new Date());
      setConnectionStatus('connected');
      setLoading(false);
      
      console.log(`✅ Successfully fetched dashboard data in ${endTime - startTime}ms`);
      console.log('📊 Data summary:', {
        fmsTasks: dashboardData.fmsTasks?.length || 0,
        hrReplyPending: dashboardData.hrReplyPending?.length || 0,
        delegationTasks: dashboardData.delegationTasks?.length || 0,
        errors: dashboardData.errors?.length || 0
      });

      // Log any partial errors
      if (dashboardData.errors && dashboardData.errors.length > 0) {
        console.warn('⚠️ Partial errors occurred:', dashboardData.errors);
      }

    } catch (err) {
      console.error(`❌ Fetch attempt ${attempt} failed:`, err);
      
      if (!mountedRef.current) return;

      if (attempt < retryAttempts) {
        // Retry with exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1);
        console.log(`🔄 Retrying in ${delay}ms...`);
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchDataWithRetry(attempt + 1);
        }, delay);
      } else {
        // All retries failed
        setError(err.message);
        setConnectionStatus('error');
        setLoading(false);
        console.error('💥 All retry attempts failed');
      }
    }
  }, [retryAttempts, retryDelay]);

  // Manual refresh function
  const refreshData = useCallback(() => {
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    fetchDataWithRetry(1);
  }, [fetchDataWithRetry]);

  // Test connection function
  const testConnection = useCallback(async () => {
    try {
      setConnectionStatus('testing');
      const result = await GoogleSheetsService.testConnection();
      setConnectionStatus(result.success ? 'connected' : 'error');
      return result;
    } catch (err) {
      setConnectionStatus('error');
      console.error('Connection test failed:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Set up auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        console.log('🔄 Auto-refreshing dashboard data...');
        refreshData();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, refreshData]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchDataWithRetry(1);
    }
  }, [autoFetch, fetchDataWithRetry]);

  return {
    // Data
    data,
    loading,
    error,
    lastUpdated,
    connectionStatus,
    
    // Actions
    refreshData,
    testConnection,
    
    // Utility
    isConnected: connectionStatus === 'connected',
    hasError: !!error,
    hasData: data.fmsTasks.length > 0 || data.hrReplyPending.length > 0 || data.delegationTasks.length > 0
  };
};

// Hook for individual sheet data
export const useSheetData = (sheetRange, options = {}) => {
  const {
    transform = null,
    autoFetch = true,
    refreshInterval = 0 // No auto-refresh by default for individual sheets
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const mountedRef = useRef(true);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const fetchSheetData = useCallback(async () => {
    if (!sheetRange || !mountedRef.current) return;

    setLoading(true);
    setError(null);
    
    try {
      console.log(`📄 Fetching data from sheet range: ${sheetRange}`);
      
      const rawData = await GoogleSheetsService.fetchSheetData(sheetRange);
      const processedData = GoogleSheetsService.arrayToObjects(rawData);
      const finalData = transform ? transform(processedData) : processedData;
      
      if (!mountedRef.current) return;
      
      setData(finalData);
      setLastUpdated(new Date());
      
      console.log(`✅ Successfully fetched ${finalData.length} rows from ${sheetRange}`);
    } catch (err) {
      console.error(`❌ Error fetching sheet data for range ${sheetRange}:`, err);
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [sheetRange, transform]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchSheetData, refreshInterval);
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [refreshInterval, fetchSheetData]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchSheetData();
    }
  }, [autoFetch, fetchSheetData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchSheetData,
    hasData: data.length > 0
  };
};

// Hook for writing data to sheets
export const useSheetWriter = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastWrite, setLastWrite] = useState(null);

  const appendToSheet = useCallback(async (sheetName, values) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📝 Appending data to sheet: ${sheetName}`, values);
      
      const result = await GoogleSheetsService.appendToSheet(sheetName, values);
      setLastWrite(new Date());
      
      console.log('✅ Successfully appended data to sheet');
      return result;
    } catch (err) {
      console.error('❌ Error appending to sheet:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSheetData = useCallback(async (range, values) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📝 Updating sheet range: ${range}`, values);
      
      const result = await GoogleSheetsService.updateSheetData(range, values);
      setLastWrite(new Date());
      
      console.log('✅ Successfully updated sheet data');
      return result;
    } catch (err) {
      console.error('❌ Error updating sheet:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    lastWrite,
    appendToSheet,
    updateSheetData
  };
};

// Hook for connection monitoring
export const useConnectionMonitor = () => {
  const [status, setStatus] = useState('disconnected');
  const [lastCheck, setLastCheck] = useState(null);

  const checkConnection = useCallback(async () => {
    try {
      setStatus('checking');
      const result = await GoogleSheetsService.testConnection();
      setStatus(result.success ? 'connected' : 'error');
      setLastCheck(new Date());
      return result;
    } catch (err) {
      setStatus('error');
      setLastCheck(new Date());
      return { success: false, error: err.message };
    }
  }, []);

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    status,
    lastCheck,
    checkConnection,
    isConnected: status === 'connected',
    isError: status === 'error'
  };
};