import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader } from 'lucide-react';
import DashboardHeader from './management/DashboardHeader';
import ExecutiveSummary from './management/ExecutiveSummary';
import TabNavigation from './management/TabNavigation';
import AnalysisPanels from './management/AnalysisPanels';
import ActionFooter from './management/ActionFooter';

const ManagementDashboard = ({ currentUser }) => {
  const [selectedTab, setSelectedTab] = useState('quick-analysis');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [loadingProgress, setLoadingProgress] = useState('');
  
  // All data without user filtering - fresh API calls
  const [allData, setAllData] = useState({
    delegation: [],
    fms: [],
    ht: [],
    hs: []
  });

  // Load fresh data directly from API
  const loadFreshData = useCallback(async () => {
    setLoading(true);
    setLoadingProgress('Initializing data load...');
    
    try {
      const results = {
        delegation: [],
        fms: [],
        ht: [],
        hs: []
      };

      // Load Delegation Data
      if (currentUser.permissions?.canViewDelegation) {
        setLoadingProgress('Loading Delegation data...');
        try {
          const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_DELEGATION;
          const sheetName = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_DELEGATION;
          
          const apiUrl = '/api/sheets';
          const params = new URLSearchParams({
            sheetId: spreadsheetId,
            sheetName: sheetName,
            range: 'A8:BZ'
          });
          
          const response = await fetch(`${apiUrl}?${params}`);
          if (response.ok) {
            const data = await response.json();
            const rows = data.values || [];
            
            if (rows.length > 0) {
              const headers = rows[0];
              results.delegation = rows.slice(1)
                .filter(row => row && row.length > 0)
                .map((row, index) => {
                  const task = {};
                  headers.forEach((header, colIndex) => {
                    if (header && row[colIndex] !== undefined) {
                      const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                      task[key] = row[colIndex];
                    }
                  });
                  task.id = index + 1;
                  task.rowNumber = index + 9;
                  return task;
                });
            }
          }
        } catch (error) {
          console.error('Error loading Delegation data:', error);
        }
      }

      // Load FMS Data (same as PC data since they're the same tasks)
      if (currentUser.permissions?.canViewFMS || currentUser.permissions?.canViewPC) {
        setLoadingProgress('Loading FMS/PC data...');
        try {
          const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_FMS;
          const sheetName = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_FMS;
          
          const apiUrl = '/api/sheets';
          const params = new URLSearchParams({
            sheetId: spreadsheetId,
            sheetName: sheetName,
            range: 'A1:M'
          });
          
          const response = await fetch(`${apiUrl}?${params}`);
          if (response.ok) {
            const data = await response.json();
            const rows = data.values || [];
            
            if (rows.length > 0) {
              const headers = rows[0];
              results.fms = rows.slice(1)
                .filter(row => row && row.length > 0)
                .map((row, index) => {
                  const task = {};
                  headers.forEach((header, colIndex) => {
                    if (header && row[colIndex] !== undefined) {
                      const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                      task[key] = row[colIndex];
                    }
                  });
                  task.id = index + 1;
                  task.rowNumber = index + 2;
                  return task;
                });
            }
          }
        } catch (error) {
          console.error('Error loading FMS data:', error);
        }
      }

      // Load HT Data
      if (currentUser.permissions?.canViewHT) {
        setLoadingProgress('Loading Help Tickets data...');
        try {
          const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_HT;
          const sheetName = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_HT;
          
          const apiUrl = '/api/sheets';
          const params = new URLSearchParams({
            sheetId: spreadsheetId,
            sheetName: sheetName,
            range: 'A10:AZ'
          });
          
          const response = await fetch(`${apiUrl}?${params}`);
          if (response.ok) {
            const data = await response.json();
            const rows = data.values || [];
            
            if (rows.length > 0) {
              const headers = rows[0];
              results.ht = rows.slice(1)
                .filter(row => row && row.length > 0)
                .map((row, index) => {
                  const task = {};
                  headers.forEach((header, colIndex) => {
                    if (header && row[colIndex] !== undefined) {
                      const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                      task[key] = row[colIndex];
                    }
                  });
                  
                  // Direct column mapping for HT
                  task.ticketId = row[0] || '';
                  task.timestamp = row[1] || '';
                  task.name = row[2] || '';
                  task.emailId = row[3] || '';
                  task.department = row[4] || '';
                  task.challengeIssue = row[5] || '';
                  task.challengeLevel = row[6] || '';
                  task.issueDelegatedTo = row[7] || '';
                  task.replyPlanned = row[18] || '';
                  task.replyActual = row[19] || '';
                  
                  task.id = index + 1;
                  task.rowNumber = index + 11;
                  return task;
                });
            }
          }
        } catch (error) {
          console.error('Error loading HT data:', error);
        }
      }

      // Load HS Data
      if (currentUser.permissions?.canViewHS) {
        setLoadingProgress('Loading Help Slips data...');
        try {
          const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_HS;
          const sheetName = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_HS;
          
          const apiUrl = '/api/sheets';
          const params = new URLSearchParams({
            sheetId: spreadsheetId,
            sheetName: sheetName,
            range: 'A10:AZ'
          });
          
          const response = await fetch(`${apiUrl}?${params}`);
          if (response.ok) {
            const data = await response.json();
            const rows = data.values || [];
            
            if (rows.length > 0) {
              const headers = rows[0];
              results.hs = rows.slice(1)
                .filter(row => row && row.length > 0)
                .map((row, index) => {
                  const task = {};
                  headers.forEach((header, colIndex) => {
                    if (header && row[colIndex] !== undefined) {
                      const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                      task[key] = row[colIndex];
                    }
                  });
                  
                  // Direct column mapping for HS
                  task.helpSlipId = row[0] || '';
                  task.timestamp = row[1] || '';
                  task.name = row[2] || '';
                  task.emailId = row[3] || '';
                  task.department = row[4] || '';
                  task.challengeIssue = row[5] || '';
                  task.challengeLevel = row[6] || '';
                  task.replyPlanned = row[18] || '';
                  task.replyActual = row[19] || '';
                  
                  // For HS, assign all to Director as requested
                  task.assignedTo = 'Director';
                  
                  task.id = index + 1;
                  task.rowNumber = index + 11;
                  return task;
                });
            }
          }
        } catch (error) {
          console.error('Error loading HS data:', error);
        }
      }

      setAllData(results);
      setLastRefresh(new Date());
      setLoadingProgress('Data loaded successfully!');
      
      console.log('Management Dashboard - Fresh Data Loaded:', {
        delegation: results.delegation.length,
        fms: results.fms.length,
        ht: results.ht.length,
        hs: results.hs.length
      });
      
    } catch (error) {
      console.error('Error loading management data:', error);
      setLoadingProgress('Error loading data');
    } finally {
      setLoading(false);
    }
  }, [currentUser.permissions]);

  useEffect(() => {
    loadFreshData();
  }, [loadFreshData]);

  const handleRefresh = () => {
    loadFreshData();
  };

  const executiveSummary = useMemo(() => {
    const totalTasks = Object.values(allData).reduce((sum, tasks) => sum + tasks.length, 0);
    
    const pendingDelegation = allData.delegation.filter(task => 
      (task.delegation_status || 'pending').toLowerCase().includes('pending')
    ).length;

    const pendingFMS = allData.fms.filter(task => 
      task.delay && task.delay.trim() !== ''
    ).length;

    const pendingHT = allData.ht.filter(task => 
      (!task.replyActual || task.replyActual.trim() === '')
    ).length;

    const pendingHS = allData.hs.filter(task => 
      task.replyPlanned && task.replyPlanned.trim() !== '' &&
      (!task.replyActual || task.replyActual.trim() === '')
    ).length;

    const totalPending = pendingDelegation + pendingFMS + pendingHT + pendingHS;
    const pendingRate = totalTasks > 0 ? ((totalPending / totalTasks) * 100).toFixed(1) : 0;

    const activeWorkers = new Set([
      ...allData.delegation.map(task => task.doer_name || task.doer).filter(Boolean),
      ...allData.fms.map(task => task.doer).filter(Boolean),
      ...allData.ht.map(task => task.issueDelegatedTo).filter(Boolean),
      ...allData.hs.map(task => task.assignedTo).filter(Boolean)
    ]).size;

    const activePCs = new Set(allData.fms.map(task => task.pc || task.pcdeo).filter(Boolean)).size;

    return {
      totalTasks,
      totalPending,
      pendingRate: parseFloat(pendingRate),
      activeWorkers,
      activePCs,
      pendingDelegation,
      pendingFMS,
      pendingHT,
      pendingHS
    };
  }, [allData]);

  const getFMSLinks = useMemo(() => {
    const fmsLinks = {};
    allData.fms.forEach(task => {
      const fmsType = task.fms || 'Unknown';
      if (!fmsLinks[fmsType] && task.link && task.link.trim() !== '') {
        fmsLinks[fmsType] = task.link;
      }
    });
    return fmsLinks;
  }, [allData.fms]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Management Data</h3>
          <p className="text-gray-600">{loadingProgress}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardHeader
        executiveSummary={executiveSummary}
        lastRefresh={lastRefresh}
        onRefresh={handleRefresh}
      />
      <ExecutiveSummary summary={executiveSummary} />
      <TabNavigation selectedTab={selectedTab} onTabChange={setSelectedTab} />
      <AnalysisPanels
        selectedTab={selectedTab}
        allData={allData}
        getFMSLinks={getFMSLinks}
        executiveSummary={executiveSummary}
      />
      <ActionFooter onRefresh={handleRefresh} />
    </div>
  );
};

export default ManagementDashboard;
