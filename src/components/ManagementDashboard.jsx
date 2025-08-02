import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  DollarSign, 
  Users, 
  MessageSquare, 
  UserPlus, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Star,
  StarOff,
  Badge,
  Search,
  X
} from 'lucide-react';

const ManagementDashboard = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState('Initializing...');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [allData, setAllData] = useState({
    delegation: [],
    fms: [],
    ht: [],
    hs: []
  });
  
  // New state for pinned FMS items
  const [pinnedFMS, setPinnedFMS] = useState(new Set());
  const [savingPinnedStatus, setSavingPinnedStatus] = useState(false);
  
  // Sort configuration
  const [sortConfig, setSortConfig] = useState({
    fms: { key: null, direction: 'asc' },
    delegation: { key: null, direction: 'asc' },
    helpTicket: { key: null, direction: 'asc' },
    helpSlip: { key: null, direction: 'asc' }
  });

  // Load pinned FMS items from Pinned_FMS sheet on component mount
  useEffect(() => {
    loadPinnedFMSItems();
  }, []);

  // Load pinned FMS items from dedicated Pinned_FMS sheet
  const loadPinnedFMSItems = async () => {
    try {
      // Use the EMP login sheet spreadsheet ID (where you added Pinned_FMS sheet)
      const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_EMPLOYEES;
      const sheetName = 'Pinned_FMS';
      const params = new URLSearchParams({
        sheetId: spreadsheetId,
        sheetName: sheetName,
        range: 'A:C'
      });
      
      const response = await fetch(`/api/sheets?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        const rows = data.values || [];
        
        // Find user's pinned FMS items
        // Expected format: [Employee_Name, FMS_Name, Is_Pinned]
        const userPinnedItems = new Set();
        
        rows.forEach((row, index) => {
          if (index === 0) return; // Skip header row
          
          const [employeeName, fmsName, isPinned] = row;
          if (employeeName === currentUser.name && isPinned === 'TRUE') {
            userPinnedItems.add(fmsName);
          }
        });
        
        setPinnedFMS(userPinnedItems);
      }
    } catch (error) {
      console.error('Error loading pinned FMS items:', error);
      // If sheet doesn't exist, it's fine - no pinned items yet
    }
  };

  // Save/Update pinned FMS items in dedicated Pinned_FMS sheet
  const savePinnedFMSItems = async (newPinnedSet) => {
    try {
      setSavingPinnedStatus(true);
      
      // Use the EMP login sheet spreadsheet ID (where you added Pinned_FMS sheet)
      const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_EMPLOYEES;
      const sheetName = 'Pinned_FMS';
      const params = new URLSearchParams({
        sheetId: spreadsheetId,
        sheetName: sheetName,
        range: 'A:C'
      });
      
      // Get current Pinned_FMS sheet data
      const response = await fetch(`/api/sheets?${params}`);
      
      let existingRows = [];
      let hasHeader = false;
      
      if (response.ok) {
        const data = await response.json();
        existingRows = data.values || [];
        hasHeader = existingRows.length > 0;
      }
      
      // If no header exists, create one
      if (!hasHeader) {
        existingRows = [['Employee_Name', 'FMS_Name', 'Is_Pinned']];
      }
      
      // Remove existing entries for this user
      const filteredRows = existingRows.filter((row, index) => {
        if (index === 0) return true; // Keep header
        return row[0] !== currentUser.name; // Remove user's existing entries
      });
      
      // Add new entries for pinned FMS items
      Array.from(newPinnedSet).forEach(fmsName => {
        filteredRows.push([currentUser.name, fmsName, 'TRUE']);
      });
      
      // Update the entire sheet with new data using correct PUT parameters
      const updateResponse = await fetch('/api/sheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: spreadsheetId,  // Use EMP spreadsheet ID
          range: `${sheetName}!A:C`,     // Use full range format
          values: filteredRows
        })
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`Failed to update pinned FMS: ${errorData.error || updateResponse.statusText}`);
      }
      
      console.log('Successfully saved pinned FMS items to Pinned_FMS sheet in EMP spreadsheet');
      
    } catch (error) {
      console.error('Error saving pinned FMS items:', error);
      alert('Failed to save pinned status. Please try again.');
    } finally {
      setSavingPinnedStatus(false);
    }
  };

  // Toggle pinned status for FMS
  const toggleFMSPin = async (fmsName) => {
    const newPinnedSet = new Set(pinnedFMS);
    
    if (newPinnedSet.has(fmsName)) {
      newPinnedSet.delete(fmsName);
    } else {
      newPinnedSet.add(fmsName);
    }
    
    setPinnedFMS(newPinnedSet);
    await savePinnedFMSItems(newPinnedSet);
  };

  // Calculate delay count for FMS
  const calculateDelayCount = (fmsGroup) => {
    return fmsGroup.tasks?.filter(task => {
      const delay = parseFloat(task.delay || 0);
      return delay > 0;
    }).length || 0;
  };

  // Calculate how old in days for FMS - based on oldest 'Planned' date
  const calculateHowOldInDays = (fmsGroup) => {
    if (!fmsGroup.tasks || fmsGroup.tasks.length === 0) return 0;
    
    const today = new Date();
    let oldestDays = 0;
    
    fmsGroup.tasks.forEach(task => {
      const plannedDate = task.planned || task.planned_date || task.date_planned;
      if (plannedDate && plannedDate.trim() !== '') {
        try {
          const planned = new Date(plannedDate);
          if (!isNaN(planned.getTime())) {
            const diffTime = today - planned;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > oldestDays) {
              oldestDays = diffDays;
            }
          }
        } catch (error) {
          // Invalid date format, skip
        }
      }
    });
    
    return Math.max(0, oldestDays);
  };

  // Load fresh data from all sources
  const loadFreshData = useCallback(async () => {
    setLoading(true);
    setLoadingProgress('Starting data synchronization...');

    try {
      const results = {
        delegation: [],
        fms: [],
        ht: [],
        hs: []
      };

      // Prepare all API calls to run in parallel with correct parameters
      const apiCalls = [];

      // Delegation API call
      if (currentUser.permissions?.canViewDelegation) {
        const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_DELEGATION;
        const sheetName = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_DELEGATION;
        const params = new URLSearchParams({
          sheetId: spreadsheetId,
          sheetName: sheetName,
          range: 'A8:BZ'
        });
        apiCalls.push({
          type: 'delegation',
          promise: fetch(`/api/sheets?${params}`)
        });
      }

      // FMS API call
      if (currentUser.permissions?.canViewFMS || currentUser.permissions?.canViewPC) {
        const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_FMS;
        const sheetName = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_FMS;
        const params = new URLSearchParams({
          sheetId: spreadsheetId,
          sheetName: sheetName,
          range: 'A1:M'
        });
        apiCalls.push({
          type: 'fms',
          promise: fetch(`/api/sheets?${params}`)
        });
      }

      // HT API call
      if (currentUser.permissions?.canViewHT) {
        const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_HT;
        const sheetName = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_HT;
        const params = new URLSearchParams({
          sheetId: spreadsheetId,
          sheetName: sheetName,
          range: 'A10:AZ'
        });
        apiCalls.push({
          type: 'ht',
          promise: fetch(`/api/sheets?${params}`)
        });
      }

      // HS API call
      if (currentUser.permissions?.canViewHS) {
        const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_HS;
        const sheetName = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_HS;
        const params = new URLSearchParams({
          sheetId: spreadsheetId,
          sheetName: sheetName,
          range: 'A10:AZ'
        });
        apiCalls.push({
          type: 'hs',
          promise: fetch(`/api/sheets?${params}`)
        });
      }

      setLoadingProgress(`Making ${apiCalls.length} API calls simultaneously...`);

      // Execute all API calls in parallel
      const responses = await Promise.all(apiCalls.map(call => call.promise));
      
      setLoadingProgress('Processing responses...');

      // Process each response
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        const callType = apiCalls[i].type;
        
        if (response.ok) {
          const data = await response.json();
          const rows = data.values || [];
          
          if (rows.length > 0) {
            const headers = rows[0];
            const processedData = rows.slice(1)
              .filter(row => row && row.length > 0)
              .map((row, index) => {
                const task = {};
                headers.forEach((header, colIndex) => {
                  if (header && row[colIndex] !== undefined) {
                    const key = header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                    task[key] = row[colIndex];
                  }
                });
                
                // Add specific mappings based on type
                if (callType === 'delegation') {
                  task.id = index + 1;
                  task.rowNumber = index + 9;
                } else if (callType === 'fms') {
                  task.id = index + 1;
                  task.rowNumber = index + 2;
                } else if (callType === 'ht') {
                  // Direct column mapping for HT - FIXED: Don't override with empty string
                  task.ticketId = row[0] || '';
                  task.timestamp = row[1] || '';
                  task.name = row[2] || '';
                  task.emailId = row[3] || '';
                  task.department = row[4] || '';
                  task.challengeIssue = row[5] || '';
                  task.challengeLevel = row[6] || '';
                  // FIXED: Only set if not already set from header mapping and not empty
                  if (!task.issueDelegatedTo && row[7]) {
                    task.issueDelegatedTo = row[7];
                  }
                  task.replyPlanned = row[18] || '';
                  task.replyActual = row[19] || '';
                  task.issueDescription = row[5] || '';
                  task.id = index + 1;
                  task.rowNumber = index + 11;
                } else if (callType === 'hs') {
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
                  task.requestId = row[0] || '';
                  task.requestDescription = row[5] || '';
                  task.assignedTo = 'Director'; // For HS, assign all to Director
                  task.id = index + 1;
                  task.rowNumber = index + 11;
                }
                
                task.id = index + 1;
                task.rowNumber = index + 2;
                return task;
              });
            
            results[callType] = processedData;
          }
        } else {
          console.error(`Failed to fetch ${callType} data:`, response.status);
        }
      }

      setAllData(results);
      setLoadingProgress('All data loaded successfully');
      
      console.log('Management Dashboard - Data Load Complete:', {
        delegation: results.delegation?.length || 0,
        fms: results.fms?.length || 0,
        ht: results.ht?.length || 0,
        hs: results.hs?.length || 0
      });
      
    } catch (error) {
      console.error('Error loading management data:', error);
      setLoadingProgress('Error loading data: ' + error.message);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [currentUser.permissions]);

  // Load data on component mount
  useEffect(() => {
    loadFreshData();
  }, [loadFreshData]);

  // Manual refresh function
  const handleRefresh = () => {
    loadFreshData();
  };

  // Executive Summary Metrics
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

  // Get FMS links for header
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

  // Sorting functionality
  const handleSort = (table, key) => {
    setSortConfig(prev => ({
      ...prev,
      [table]: {
        key,
        direction: prev[table].key === key && prev[table].direction === 'asc' ? 'desc' : 'asc'
      }
    }));
  };

  const getSortedData = (data, table) => {
    if (!sortConfig[table].key) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig[table].key] || '';
      const bVal = b[sortConfig[table].key] || '';
      
      if (!isNaN(aVal) && !isNaN(bVal)) {
        return sortConfig[table].direction === 'asc' 
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal);
      }
      
      const comparison = aVal.toString().localeCompare(bVal.toString());
      return sortConfig[table].direction === 'asc' ? comparison : -comparison;
    });
  };

  const SortButton = ({ table, column, children }) => (
    <button
      onClick={() => handleSort(table, column)}
      className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
    >
      <span>{children}</span>
      {sortConfig[table].key === column ? (
        sortConfig[table].direction === 'asc' ? 
        <ArrowUp className="w-4 h-4" /> : 
        <ArrowDown className="w-4 h-4" />
      ) : (
        <ArrowUpDown className="w-4 h-4 opacity-50" />
      )}
    </button>
  );

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'fms', label: 'FMS', icon: DollarSign },
    { id: 'delegation', label: 'Delegation', icon: Users },
    { id: 'help-ticket', label: 'Help Ticket', icon: MessageSquare },
    { id: 'help-slip', label: 'Help Slip', icon: UserPlus }
  ];

  // Loading view
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {currentUser.name.split(' ')[0]}!
              </h1>
              <p className="text-blue-100">Management Command Center</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">Loading...</div>
              <div className="text-blue-200">Synchronizing data</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Loading Management Data...</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentUser.permissions.canViewDelegation && (
                <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 transition-all">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-600 animate-pulse" />
                    <div>
                      <p className="font-medium text-gray-900">Delegation</p>
                      <p className="text-sm text-gray-600">Loading...</p>
                    </div>
                  </div>
                </div>
              )}

              {currentUser.permissions.canViewFMS && (
                <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 transition-all">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-blue-600 animate-pulse" />
                    <div>
                      <p className="font-medium text-gray-900">FMS</p>
                      <p className="text-sm text-gray-600">Loading...</p>
                    </div>
                  </div>
                </div>
              )}

              {currentUser.permissions.canViewHT && (
                <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 transition-all">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-blue-600 animate-pulse" />
                    <div>
                      <p className="font-medium text-gray-900">Help Tickets</p>
                      <p className="text-sm text-gray-600">Loading...</p>
                    </div>
                  </div>
                </div>
              )}

              {currentUser.permissions.canViewHS && (
                <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 transition-all">
                  <div className="flex items-center space-x-3">
                    <UserPlus className="w-5 h-5 text-blue-600 animate-pulse" />
                    <div>
                      <p className="font-medium text-gray-900">Help Slips</p>
                      <p className="text-sm text-gray-600">Loading...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <h5 className="font-medium text-gray-900 mb-2">Loading Log:</h5>
              <div className="space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                  <span className="text-blue-600">
                    {loadingProgress}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced FMS Analysis with sorting and new columns
  const renderFMSAnalysis = () => {
    // Group FMS by name and collect all tasks for each FMS
    const fmsGroups = {};
    allData.fms.forEach(task => {
      const fmsName = task.fms || 'Unknown';
      if (!fmsGroups[fmsName]) {
        fmsGroups[fmsName] = {
          name: fmsName,
          total: 0,
          pcs: new Set(),
          pcNames: new Set(),
          doers: {},
          doerStats: {},
          tasks: [],
          link: getFMSLinks[fmsName] || null
        };
      }
      
      fmsGroups[fmsName].total++;
      fmsGroups[fmsName].tasks.push(task);
      
      if (task.pc || task.pcdeo) {
        fmsGroups[fmsName].pcs.add(task.pc || task.pcdeo);
        fmsGroups[fmsName].pcNames.add(task.pc || task.pcdeo);
      }
      
      const doer = task.doer || 'Unknown';
      if (!fmsGroups[fmsName].doers[doer]) {
        fmsGroups[fmsName].doers[doer] = 0;
        fmsGroups[fmsName].doerStats[doer] = { total: 0, pending: 0 };
      }
      fmsGroups[fmsName].doers[doer]++;
      fmsGroups[fmsName].doerStats[doer].total++;
      
      // Check if task is pending (has delay)
      const delay = parseFloat(task.delay || 0);
      if (delay > 0) {
        fmsGroups[fmsName].doerStats[doer].pending++;
      }
    });

    // Add calculated fields for each FMS group
    Object.values(fmsGroups).forEach(group => {
      group.delayCount = calculateDelayCount(group);
      group.howOldInDays = calculateHowOldInDays(group);
      group.important = pinnedFMS.has(group.name);
    });

    // Filter FMS data based on search term
    let filteredFMSGroups = Object.values(fmsGroups);
    if (searchTerm) {
      filteredFMSGroups = filteredFMSGroups.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Array.from(group.pcNames).some(pcName => 
          pcName.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        Object.keys(group.doers).some(doer => 
          doer.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort FMS data - pinned items first, then by selected sort
    const pinnedGroups = filteredFMSGroups.filter(group => pinnedFMS.has(group.name));
    const unpinnedGroups = filteredFMSGroups.filter(group => !pinnedFMS.has(group.name));
    
    const sortedPinned = getSortedData(pinnedGroups, 'fms');
    const sortedUnpinned = getSortedData(unpinnedGroups, 'fms');
    const sortedFMSData = [...sortedPinned, ...sortedUnpinned];

    // Copy row data function
    const copyRowData = (fms) => {
      const rowData = [
        fms.name,
        fms.total.toString(),
        fms.delayCount.toString(),
        fms.howOldInDays.toString(),
        Array.from(fms.pcNames).join(', '),
        Object.entries(fms.doerStats).map(([doer, stats]) => 
          `${doer}: ${stats.total} total, ${stats.pending} pending`
        ).join('; ')
      ].join('\t'); // Tab-separated for easy pasting into spreadsheets
      
      navigator.clipboard.writeText(rowData).then(() => {
        alert('Row data copied to clipboard!');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = rowData;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Row data copied to clipboard!');
      });
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">FMS Analysis</h3>
              <div className="flex items-center space-x-4">
                {/* Search Box */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search FMS, PC, or Doer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {pinnedFMS.size > 0 && (
                  <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    {pinnedFMS.size} Pinned
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton table="fms" column="name">FMS Name</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton table="fms" column="total">Total Tasks</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton table="fms" column="delayCount">Delay Count</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton table="fms" column="howOldInDays">How Old (Days)</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PC Names
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Top Doers (Total/Pending)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Copy
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedFMSData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? `No FMS found matching "${searchTerm}"` : 'No FMS data available'}
                    </td>
                  </tr>
                ) : (
                  sortedFMSData.map((fms, index) => (
                    <tr key={index} className={`hover:bg-gray-50 ${pinnedFMS.has(fms.name) ? 'bg-yellow-50 border-l-4 border-l-yellow-400' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleFMSPin(fms.name)}
                          disabled={savingPinnedStatus}
                          className={`p-1 rounded transition-colors ${
                            pinnedFMS.has(fms.name) 
                              ? 'text-yellow-600 hover:text-yellow-700' 
                              : 'text-gray-400 hover:text-yellow-600'
                          } ${savingPinnedStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={pinnedFMS.has(fms.name) ? 'Unpin FMS' : 'Pin as Important'}
                        >
                          {pinnedFMS.has(fms.name) ? (
                            <Star className="w-5 h-5 fill-current" />
                          ) : (
                            <StarOff className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{fms.name}</span>
                          {pinnedFMS.has(fms.name) && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              <Badge className="w-3 h-3 mr-1" />
                              Important
                            </span>
                          )}
                          {fms.link && (
                            <a 
                              href={fms.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{fms.total}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          fms.delayCount > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {fms.delayCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          fms.howOldInDays > 5 ? 'bg-red-100 text-red-800' : 
                          fms.howOldInDays > 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {fms.howOldInDays}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {Array.from(fms.pcNames).slice(0, 3).map((pcName, pcIndex) => (
                            <div key={pcIndex} className="text-sm text-gray-600">
                              {pcName}
                            </div>
                          ))}
                          {fms.pcNames.size > 3 && (
                            <div className="text-xs text-gray-500">
                              +{fms.pcNames.size - 3} more
                            </div>
                          )}
                          {fms.pcNames.size === 0 && (
                            <div className="text-xs text-gray-400">No PCs assigned</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {Object.entries(fms.doerStats).slice(0, 3).map(([doer, stats]) => (
                            <div key={doer} className="text-sm text-gray-600">
                              <span className="font-medium">{doer}:</span>
                              <span className="ml-1 text-blue-600">{stats.total}</span>
                              <span className="text-gray-400">/</span>
                              <span className={`ml-1 ${stats.pending > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {stats.pending}
                              </span>
                            </div>
                          ))}
                          {Object.keys(fms.doerStats).length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{Object.keys(fms.doerStats).length - 3} more
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => copyRowData(fms)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded hover:bg-blue-50"
                          title="Copy row data to clipboard"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  // Render Delegation Analysis (group by doer name, remove "Delegated By")
  const renderDelegationAnalysis = () => {
    const delegationGroups = {};
    
    allData.delegation.forEach(task => {
      const doer = task.doer_name || task.doer || 'Unknown';
      
      if (!delegationGroups[doer]) {
        delegationGroups[doer] = {
          name: doer,
          total: 0,
          pending: 0,
          completed: 0,
          delegatedBy: new Set()
        };
      }
      
      delegationGroups[doer].total++;
      const delegatedBy = task.delegated_by || task.name || 'Unknown';
      delegationGroups[doer].delegatedBy.add(delegatedBy);
      
      const status = (task.delegation_status || 'pending').toLowerCase();
      if (status.includes('pending') || status.includes('progress')) {
        delegationGroups[doer].pending++;
      } else if (status.includes('complete') || status.includes('done')) {
        delegationGroups[doer].completed++;
      }
    });

    const sortedDelegationGroups = getSortedData(Object.values(delegationGroups), 'delegation');

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Delegation Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <SortButton table="delegation" column="name">Assigned To</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <SortButton table="delegation" column="total">Total Tasks</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <SortButton table="delegation" column="pending">Pending</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <SortButton table="delegation" column="completed">Completed</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedDelegationGroups.map((group, index) => {
                const efficiency = group.total > 0 ? 
                  ((group.completed / group.total) * 100).toFixed(1) : '0.0';
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{group.name}</td>
                    <td className="px-6 py-4 text-gray-900">{group.total}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        group.pending > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {group.pending}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{group.completed}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        parseFloat(efficiency) > 80 ? 'bg-green-100 text-green-800' :
                        parseFloat(efficiency) > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {efficiency}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Help Ticket Analysis (keep existing grouped structure, add sorting)
  const renderHelpTicketAnalysis = () => {
    const htGroups = {};
    
    allData.ht.forEach(task => {
      const assignedTo = task.issueDelegatedTo || 'Unknown';
      
      if (!htGroups[assignedTo]) {
        htGroups[assignedTo] = {
          name: assignedTo,
          total: 0,
          pending: 0,
          replied: 0,
          highPriority: 0
        };
      }
      
      htGroups[assignedTo].total++;
      
      if (!task.replyActual || task.replyActual.trim() === '') {
        htGroups[assignedTo].pending++;
      } else {
        htGroups[assignedTo].replied++;
      }
      
      if (task.challengeLevel?.toUpperCase() === 'HIGH') {
        htGroups[assignedTo].highPriority++;
      }
    });

    const sortedHTGroups = getSortedData(Object.values(htGroups), 'helpTicket');

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Help Ticket Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <SortButton table="helpTicket" column="name">Assigned To</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <SortButton table="helpTicket" column="total">Total Tickets</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <SortButton table="helpTicket" column="pending">Pending Reply</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <SortButton table="helpTicket" column="replied">Replied</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <SortButton table="helpTicket" column="highPriority">High Priority</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedHTGroups.map((group, index) => {
                const responseRate = group.total > 0 ? ((group.replied / group.total) * 100).toFixed(1) : '0.0';
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{group.name}</td>
                    <td className="px-6 py-4 text-gray-900">{group.total}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        group.pending > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {group.pending}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{group.replied}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        group.highPriority > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {group.highPriority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        parseFloat(responseRate) > 80 ? 'bg-green-100 text-green-800' :
                        parseFloat(responseRate) > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {responseRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Help Slip Analysis (keep existing grouped structure, add sorting)
  const renderHelpSlipAnalysis = () => {
    const hsGroups = {};
    
    allData.hs.forEach(task => {
      const assignedTo = task.assignedTo || 'Director'; // All assigned to Director as requested
      
      if (!hsGroups[assignedTo]) {
        hsGroups[assignedTo] = {
          name: assignedTo,
          total: 0,
          pending: 0,
          replied: 0,
          raisedBy: new Set()
        };
      }
      
      hsGroups[assignedTo].total++;
      hsGroups[assignedTo].raisedBy.add(task.name || 'Unknown');
      
      if (task.replyPlanned && task.replyPlanned.trim() !== '' &&
          (!task.replyActual || task.replyActual.trim() === '')) {
        hsGroups[assignedTo].pending++;
      } else if (task.replyActual && task.replyActual.trim() !== '') {
        hsGroups[assignedTo].replied++;
      }
    });

    const sortedHSGroups = getSortedData(Object.values(hsGroups), 'helpSlip');

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Help Slip Analysis</h3>
          <p className="text-sm text-gray-600">All help slips are assigned to Director for management</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <SortButton table="helpSlip" column="name">Assigned To</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <SortButton table="helpSlip" column="total">Total Slips</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <SortButton table="helpSlip" column="pending">Pending Reply</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <SortButton table="helpSlip" column="replied">Replied</SortButton>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unique Requesters</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedHSGroups.map((group, index) => {
                const responseRate = group.total > 0 ?
                  ((group.replied / group.total) * 100).toFixed(1) : '0.0';
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{group.name}</td>
                    <td className="px-6 py-4 text-gray-900">{group.total}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        group.pending > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {group.pending}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{group.replied}</td>
                    <td className="px-6 py-4 text-gray-900">{group.raisedBy.size}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        parseFloat(responseRate) > 80 ? 'bg-green-100 text-green-800' :
                        parseFloat(responseRate) > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {responseRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {currentUser.name.split(' ')[0]}!
            </h1>
            <p className="text-blue-100">Management Command Center</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{executiveSummary.totalTasks}</div>
            <div className="text-blue-200">Total Tasks</div>
            <button
              onClick={handleRefresh}
              className="mt-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {selectedTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-900">{executiveSummary.pendingDelegation}</span>
                </div>
                <h3 className="font-semibold text-blue-900">Delegation Pending</h3>
                <p className="text-sm text-blue-700">Tasks awaiting completion</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <span className="text-2xl font-bold text-green-900">{executiveSummary.pendingFMS}</span>
                </div>
                <h3 className="font-semibold text-green-900">FMS Delayed</h3>
                <p className="text-sm text-green-700">Tasks with delays</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="w-8 h-8 text-red-600" />
                  <span className="text-2xl font-bold text-red-900">{executiveSummary.pendingHT}</span>
                </div>
                <h3 className="font-semibold text-red-900">Help Tickets Open</h3>
                <p className="text-sm text-red-700">Awaiting resolution</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <UserPlus className="w-8 h-8 text-orange-600" />
                  <span className="text-2xl font-bold text-orange-900">{executiveSummary.pendingHS}</span>
                </div>
                <h3 className="font-semibold text-orange-900">Help Slips Pending</h3>
                <p className="text-sm text-orange-700">In progress items</p>
              </div>
            </div>
          )}

          {selectedTab === 'fms' && renderFMSAnalysis()}
          {selectedTab === 'delegation' && renderDelegationAnalysis()}
          {selectedTab === 'help-ticket' && renderHelpTicketAnalysis()}
          {selectedTab === 'help-slip' && renderHelpSlipAnalysis()}
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;
