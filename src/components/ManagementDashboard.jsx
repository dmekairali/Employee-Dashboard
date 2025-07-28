import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  AlertCircle,
  Award,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ExternalLink,
  ChevronRight,
  Loader,
  Star,
  Flame,
  Shield,
  Map,
  Lightbulb,
  Flag,
  MessageSquare,
  Phone,
  Mail,
  Building2,
  Timer,
  DollarSign,
  Percent,
  Hash,
  UserX,
  UserCheck,
  Search,
  Settings,
  BookOpen,
  BrainCircuit,
  Gauge,
  LineChart,
  TrendingDown as TrendDown,
  Clipboard,
  UserPlus,
  Link,
  X
} from 'lucide-react';

const useSortableData = (items, config = null) => {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

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
            range: 'A1:BZ'
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

  // Load data on component mount and tab changes
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
    
    // Calculate pending tasks (work not done - focus on bottlenecks)
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

    // Active PCs (from FMS data)
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

  // Tab configuration
  const tabs = [
    { id: 'quick-analysis', label: 'Quick Analysis', icon: Zap },
    { id: 'fms', label: 'FMS', icon: DollarSign },
    { id: 'delegation', label: 'Delegation', icon: Users },
    { id: 'help-ticket', label: 'Help Ticket', icon: MessageSquare },
    { id: 'help-slip', label: 'Help Slip', icon: UserPlus }
  ];

  const [selectedFMS, setSelectedFMS] = useState(null);

  const FMSDetailsModal = ({ fms, onClose }) => {
    if (!fms) return null;

    const calculateDoerDetails = () => {
        const doerDetails = {};
        for (const task of fms.tasks) {
            const doer = task.doer || 'Unknown';
            if (!doerDetails[doer]) {
                doerDetails[doer] = {
                    total: 0,
                    pending: 0,
                    totalDelay: 0,
                    delayedCount: 0
                };
            }
            doerDetails[doer].total++;
            if (task.what_to_do && task.what_to_do.toLowerCase().includes('pending')) {
                doerDetails[doer].pending++;
            }
            if (task.planned) {
                const plannedDate = new Date(task.planned);
                const now = new Date();
                if (plannedDate < now) {
                    const delay = now.getTime() - plannedDate.getTime();
                    doerDetails[doer].totalDelay += delay;
                    doerDetails[doer].delayedCount++;
                }
            }
        }

        for (const doer in doerDetails) {
            const details = doerDetails[doer];
            details.pendingPercentage = details.total > 0 ? (details.pending / details.total) * 100 : 0;
            details.avgDelay = details.delayedCount > 0 ? details.totalDelay / details.delayedCount / (1000 * 60 * 60 * 24) : 0;
        }
        return doerDetails;
    };

    const doerDetails = calculateDoerDetails();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{fms.name} Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
                <h3 className="font-semibold">Doer Details:</h3>
                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending Tasks</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% Pending</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Delay (days)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {Object.entries(doerDetails).map(([doer, details]) => (
                            <tr key={doer}>
                                <td className="px-6 py-4">{doer}</td>
                                <td className="px-6 py-4">{details.pending}</td>
                                <td className="px-6 py-4">{details.pendingPercentage.toFixed(1)}%</td>
                                <td className="px-6 py-4">{details.avgDelay.toFixed(1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
            <div>
                <h3 className="font-semibold">Action Plan:</h3>
                <p>Coming Soon...</p>
            </div>
            <div>
                <h3 className="font-semibold">Insights:</h3>
                <p>Coming Soon...</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const { items: fmsItems, requestSort: requestFMSSort, sortConfig: fmsSortConfig } = useSortableData(allData.fms);
  const { items: delegationItems, requestSort: requestDelegationSort, sortConfig: delegationSortConfig } = useSortableData(allData.delegation);
  const { items: htItems, requestSort: requestHTSort, sortConfig: htSortConfig } = useSortableData(allData.ht);
  const { items: hsItems, requestSort: requestHSSort, sortConfig: hsSortConfig } = useSortableData(allData.hs);

  // Render FMS Analysis
  const renderFMSAnalysis = () => {
    const totalFmsTasks = allData.fms.length;

    const pcAnalysis = {};
    allData.fms.forEach(task => {
      const pc = task.pc || task.pcdeo || 'Unknown';
      if (!pcAnalysis[pc]) {
        pcAnalysis[pc] = {
          name: pc,
          total: 0,
          delayed: 0
        };
      }
      pcAnalysis[pc].total++;
      if (task.delay && task.delay.trim() !== '') {
        pcAnalysis[pc].delayed++;
      }
    });

    const topPCs = Object.values(pcAnalysis)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const fmsGroups = {};
    fmsItems.forEach(task => {
      const fmsName = task.fms || 'Unknown';
      if (!fmsGroups[fmsName]) {
        fmsGroups[fmsName] = {
          name: fmsName,
          total: 0,
          pcs: new Set(),
          doers: {},
          link: getFMSLinks[fmsName] || null,
          tasks: []
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
      fmsGroups[fmsName].tasks.push(task);
    });

    const getSortDirectionIcon = (name) => {
        if (!fmsSortConfig || fmsSortConfig.key !== name) {
          return null;
        }
        return fmsSortConfig.direction === 'ascending' ? <ArrowUp className="w-4 h-4 ml-2" /> : <ArrowDown className="w-4 h-4 ml-2" />;
    };

    return (
      <div className="space-y-6">
        <FMSDetailsModal fms={selectedFMS} onClose={() => setSelectedFMS(null)} />
        {/* PC Cards */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Coordinators Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topPCs.map((pc, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <Clipboard className="w-5 h-5 text-green-600" />
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    pc.delayed > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {pc.delayed > 0 ? `${pc.delayed} delayed` : 'On track'}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 truncate">{pc.name}</h4>
                <p className="text-sm text-gray-600">{pc.total} tasks</p>
              </div>
            ))}
          </div>
        </div>

        {/* FMS Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">FMS Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestFMSSort('name')}>
                    <div className="flex items-center">FMS Name {getSortDirectionIcon('name')}</div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestFMSSort('total')}>
                    <div className="flex items-center">Total Count {getSortDirectionIcon('total')}</div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestFMSSort('pcCount')}>
                    <div className="flex items-center">PC Count {getSortDirectionIcon('pcCount')}</div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.values(fmsGroups).map((fms, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-900">{fms.name}</span>
                        {fms.link && (
                          <a
                            href={fms.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                        {fms.total} ({((fms.total / totalFmsTasks) * 100).toFixed(1)}%)
                    </td>
                    <td className="px-6 py-4 text-gray-900">{fms.pcs.size}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {Object.entries(fms.doers).slice(0, 10).map(([doer, count]) => (
                          <div key={doer} className="text-sm text-gray-600">
                            {doer}: {count}
                          </div>
                        ))}
                        {Object.keys(fms.doers).length > 10 && (
                          <div className="text-xs text-gray-500">
                            +{Object.keys(fms.doers).length - 10} more
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedFMS(fms)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
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

  // Render Delegation Analysis
  const renderDelegationAnalysis = () => {
    const delegationGroups = {};
    delegationItems.forEach(task => {
      const delegatedBy = task.delegated_by || task.name || 'Unknown';
      const doer = task.doer_name || task.doer || 'Unknown';

      const key = `${delegatedBy} → ${doer}`;

      if (!delegationGroups[key]) {
        delegationGroups[key] = {
          delegatedBy,
          doer,
          total: 0,
          pending: 0,
          completed: 0
        };
      }

      delegationGroups[key].total++;

      const status = (task.delegation_status || 'pending').toLowerCase();
      if (status.includes('pending')) {
        delegationGroups[key].pending++;
      } else if (status.includes('completed')) {
        delegationGroups[key].completed++;
      }
    });

    const getSortDirectionIcon = (name) => {
        if (!delegationSortConfig || delegationSortConfig.key !== name) {
          return null;
        }
        return delegationSortConfig.direction === 'ascending' ? <ArrowUp className="w-4 h-4 ml-2" /> : <ArrowDown className="w-4 h-4 ml-2" />;
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Delegation Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestDelegationSort('delegatedBy')}>
                    <div className="flex items-center">Delegated By {getSortDirectionIcon('delegatedBy')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestDelegationSort('doer')}>
                    <div className="flex items-center">Doer Name {getSortDirectionIcon('doer')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestDelegationSort('total')}>
                    <div className="flex items-center">Total Tasks {getSortDirectionIcon('total')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestDelegationSort('pending')}>
                    <div className="flex items-center">Pending {getSortDirectionIcon('pending')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestDelegationSort('completed')}>
                    <div className="flex items-center">Completed {getSortDirectionIcon('completed')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestDelegationSort('efficiency')}>
                    <div className="flex items-center">Efficiency {getSortDirectionIcon('efficiency')}</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.values(delegationGroups).map((group, index) => {
                const efficiency = group.total > 0 ? ((group.completed / group.total) * 100).toFixed(1) : 0;
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{group.delegatedBy}</td>
                    <td className="px-6 py-4 text-gray-900">{group.doer}</td>
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

  // Render Help Ticket Analysis
  const renderHelpTicketAnalysis = () => {
    const htGroups = {};
    htItems.forEach(task => {
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

    const getSortDirectionIcon = (name) => {
        if (!htSortConfig || htSortConfig.key !== name) {
          return null;
        }
        return htSortConfig.direction === 'ascending' ? <ArrowUp className="w-4 h-4 ml-2" /> : <ArrowDown className="w-4 h-4 ml-2" />;
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Help Ticket Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestHTSort('name')}>
                    <div className="flex items-center">Assigned To {getSortDirectionIcon('name')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestHTSort('total')}>
                    <div className="flex items-center">Total Tickets {getSortDirectionIcon('total')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestHTSort('pending')}>
                    <div className="flex items-center">Pending Reply {getSortDirectionIcon('pending')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestHTSort('replied')}>
                    <div className="flex items-center">Replied {getSortDirectionIcon('replied')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestHTSort('highPriority')}>
                    <div className="flex items-center">High Priority {getSortDirectionIcon('highPriority')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestHTSort('responseRate')}>
                    <div className="flex items-center">Response Rate {getSortDirectionIcon('responseRate')}</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.values(htGroups).map((group, index) => {
                const responseRate = group.total > 0 ? ((group.replied / group.total) * 100).toFixed(1) : 0;
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

  // Render Help Slip Analysis
  const renderHelpSlipAnalysis = () => {
    const hsGroups = {};
    hsItems.forEach(task => {
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

    const getSortDirectionIcon = (name) => {
        if (!hsSortConfig || hsSortConfig.key !== name) {
          return null;
        }
        return hsSortConfig.direction === 'ascending' ? <ArrowUp className="w-4 h-4 ml-2" /> : <ArrowDown className="w-4 h-4 ml-2" />;
    };

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestHSSort('name')}>
                    <div className="flex items-center">Assigned To {getSortDirectionIcon('name')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestHSSort('total')}>
                    <div className="flex items-center">Total Slips {getSortDirectionIcon('total')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestHSSort('pending')}>
                    <div className="flex items-center">Pending Reply {getSortDirectionIcon('pending')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestHSSort('replied')}>
                    <div className="flex items-center">Replied {getSortDirectionIcon('replied')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestHSSort('raisedBy')}>
                    <div className="flex items-center">Unique Requesters {getSortDirectionIcon('raisedBy')}</div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestHSSort('responseRate')}>
                    <div className="flex items-center">Response Rate {getSortDirectionIcon('responseRate')}</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.values(hsGroups).map((group, index) => {
                const responseRate = group.total > 0 ? ((group.replied / group.total) * 100).toFixed(1) : 0;
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                      <Shield className="w-4 h-4 text-purple-600 mr-2" />
                      {group.name}
                    </td>
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
      {/* Management Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Gauge className="w-8 h-8 mr-3" />
              Management Command Center
            </h1>
            <p className="text-lg opacity-90">
              Organization-wide performance monitoring and bottleneck analysis
            </p>
            <div className="flex items-center space-x-6 mt-4 text-sm opacity-80">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Live Data (No Cache)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{executiveSummary.activeWorkers} Workers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Updated: {lastRefresh.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="bg-white/20 rounded-lg p-4 mb-4">
              <div className="text-2xl font-bold">{executiveSummary.totalPending}</div>
              <div className="text-sm opacity-75">Total Pending Tasks</div>
              <div className="text-xs opacity-60">{executiveSummary.pendingRate}% of total</div>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{executiveSummary.totalTasks}</div>
              <div className="text-sm text-gray-500">Total Tasks</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-600 font-medium flex items-center">
              <Activity className="w-4 h-4 mr-1" />
              Organization Wide
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{executiveSummary.totalPending}</div>
              <div className="text-sm text-gray-500">Pending Tasks</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, executiveSummary.pendingRate)}%` }}
            ></div>
          </div>
          <div className="mt-2 text-sm text-red-600 font-medium">
            {executiveSummary.pendingRate}% pending rate
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{executiveSummary.activeWorkers}</div>
              <div className="text-sm text-gray-500">Active Workers</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 font-medium flex items-center">
              <UserCheck className="w-4 h-4 mr-1" />
              Cross Modules
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clipboard className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{executiveSummary.activePCs}</div>
              <div className="text-sm text-gray-500">Active PCs</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-purple-600 font-medium flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Process Coordinators
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
                <p className="text-sm text-green-700">Financial tasks behind schedule</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="w-8 h-8 text-red-600" />
                  <span className="text-2xl font-bold text-red-900">{executiveSummary.pendingHT}</span>
                </div>
                <h3 className="font-semibold text-red-900">HT Pending Reply</h3>
                <p className="text-sm text-red-700">Help tickets awaiting response</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <UserPlus className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-900">{executiveSummary.pendingHS}</span>
                </div>
                <h3 className="font-semibold text-purple-900">HS Pending Reply</h3>
                <p className="text-sm text-purple-700">Help slips awaiting response</p>
              </div>
            </div>
          )}

          {selectedTab === 'fms' && renderFMSAnalysis()}
          {selectedTab === 'delegation' && renderDelegationAnalysis()}
          {selectedTab === 'help-ticket' && renderHelpTicketAnalysis()}
          {selectedTab === 'help-slip' && renderHelpSlipAnalysis()}
        </div>
      </div>

      {/* Export & Actions Footer */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Management Actions</h3>
            <p className="text-sm text-gray-600">Export reports and configure monitoring settings</p>
          </div>

          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Analysis</span>
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Configure Alerts</span>
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh All</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;
