// src/components/ManagementDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Users, 
  DollarSign, 
  MessageSquare, 
  UserPlus, 
  Zap,
  AlertCircle,
  Clock,
  User,
  CheckCircle,
  TrendingUp,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Activity,
  Clipboard,
  Shield,
  UserCheck
} from 'lucide-react';

const ManagementDashboard = ({ currentUser }) => {
  const [selectedTab, setSelectedTab] = useState('fms');
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [allData, setAllData] = useState({
    delegation: [],
    fms: [],
    ht: [],
    hs: []
  });

  // Sorting states for tables
  const [sortConfig, setSortConfig] = useState({
    fms: { key: null, direction: 'asc' },
    delegation: { key: null, direction: 'asc' },
    helpTicket: { key: null, direction: 'asc' },
    helpSlip: { key: null, direction: 'asc' }
  });

  // Load fresh data function (using synchronous/parallel API calls)
  const loadFreshData = useCallback(async () => {
    setLoading(true);
    setLoadingProgress('Loading all data synchronously...');
    
    try {
      const results = {
        delegation: [],
        fms: [],
        ht: [],
        hs: []
      };

      // Prepare all API calls to run in parallel
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
      
      console.log('Management Dashboard - Synchronous Data Load Complete:', {
        delegation: results.delegation.length,
        fms: results.fms.length,
        ht: results.ht.length,
        hs: results.hs.length,
        totalTime: 'Parallel execution'
      });
      
    } catch (error) {
      console.error('Error loading management data:', error);
      setLoadingProgress('Error loading data: ' + error.message);
    } finally {
      // Add a small delay to show the loading screen
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
    
    // Calculate pending tasks
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

    // Active workers
    const activeWorkers = new Set([
      ...allData.delegation.map(task => task.doer_name || task.doer).filter(Boolean),
      ...allData.fms.map(task => task.doer).filter(Boolean),
      ...allData.ht.map(task => task.issueDelegatedTo).filter(Boolean),
      ...allData.hs.map(task => task.assignedTo).filter(Boolean)
    ]).size;

    // Active PCs
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
      
      // Handle numeric sorting
      if (!isNaN(aVal) && !isNaN(bVal)) {
        return sortConfig[table].direction === 'asc' 
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal);
      }
      
      // Handle string sorting
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

  // Tab configuration (removed Quick Analysis)
  const tabs = [
    { id: 'fms', label: 'FMS', icon: DollarSign },
    { id: 'delegation', label: 'Delegation', icon: Users },
    { id: 'help-ticket', label: 'Help Ticket', icon: MessageSquare },
    { id: 'help-slip', label: 'Help Slip', icon: UserPlus }
  ];

  // Loading view (using exact Overview loading style)
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {currentUser.name.split(' ')[0]}!
              </h1>
              <p className="text-lg opacity-90 mb-1">Management Dashboard</p>
              <div className="flex items-center space-x-6 text-sm opacity-80">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Loading Data...</span>
                </div>
              </div>
              <p className="text-sm opacity-75">{currentUser.role} • {currentUser.department}</p>
              <p className="text-xs opacity-60">{currentUser.email}</p>
            </div>
          </div>
        </div>

        {/* Loading Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="w-6 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="w-32 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Loading Message with Progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Management Dashboard</h3>
            <p className="text-gray-600 mb-4">
              Initializing modules and loading data in background...
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-6">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>

          {/* Loading Progress */}
          <div className="max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">Loading Progress</h4>
            
            {/* Module Loading Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {currentUser.permissions.canViewDelegation && (
                <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 transition-all">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-600 animate-pulse" />
                    <div>
                      <p className="font-medium text-gray-900">Delegation Tasks</p>
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
                      <p className="font-medium text-gray-900">FMS Tasks</p>
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

            {/* Loading Messages Log */}
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

  // Render FMS Analysis with sorting
  const renderFMSAnalysis = () => {
    // Group FMS by name
    const fmsGroups = {};
    allData.fms.forEach(task => {
      const fmsName = task.fms || 'Unknown';
      if (!fmsGroups[fmsName]) {
        fmsGroups[fmsName] = {
          name: fmsName,
          total: 0,
          pcs: new Set(),
          doers: {},
          link: getFMSLinks[fmsName] || null
        };
      }
      
      fmsGroups[fmsName].total++;
      if (task.pc || task.pcdeo) {
        fmsGroups[fmsName].pcs.add(task.pc || task.pcdeo);
      }
      
      const doer = task.doer || 'Unknown';
      if (!fmsGroups[fmsName].doers[doer]) {
        fmsGroups[fmsName].doers[doer] = 0;
      }
      fmsGroups[fmsName].doers[doer]++;
    });

    const sortedFMSData = getSortedData(Object.values(fmsGroups), 'fms');

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">FMS Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton table="fms" column="name">FMS Name</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton table="fms" column="total">Total Tasks</SortButton>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active PCs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Top Doers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedFMSData.map((fms, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{fms.name}</span>
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
                    <td className="px-6 py-4 text-gray-900">{fms.pcs.size}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {Object.entries(fms.doers).slice(0, 3).map(([doer, count]) => (
                          <div key={doer} className="text-sm text-gray-600">
                            {doer}: {count}
                          </div>
                        ))}
                        {Object.keys(fms.doers).length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{Object.keys(fms.doers).length - 3} more
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
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
      {/* Header with metrics */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Management Dashboard</h1>
            <p className="text-lg opacity-90">Comprehensive overview of all operations</p>
          </div>
          <button 
            onClick={handleRefresh}
            className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{executiveSummary.totalTasks}</div>
            <div className="text-sm opacity-80">Total Tasks</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{executiveSummary.totalPending}</div>
            <div className="text-sm opacity-80">Pending Tasks</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{executiveSummary.activeWorkers}</div>
            <div className="text-sm opacity-80">Active Workers</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{executiveSummary.pendingRate}%</div>
            <div className="text-sm opacity-80">Pending Rate</div>
          </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{executiveSummary.pendingDelegation}</div>
              <div className="text-sm text-gray-500">Pending Delegation</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600 font-medium flex items-center">
              <Activity className="w-4 h-4 mr-1" />
              Delegation Tasks
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{executiveSummary.pendingFMS}</div>
              <div className="text-sm text-gray-500">Delayed FMS</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              FMS Tasks
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{executiveSummary.pendingHT}</div>
              <div className="text-sm text-gray-500">Open Tickets</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-red-600 font-medium flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Help Tickets
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{executiveSummary.pendingHS}</div>
              <div className="text-sm text-gray-500">Pending Slips</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-orange-600 font-medium flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Help Slips
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  selectedTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {selectedTab === 'quick-analysis' && (
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
