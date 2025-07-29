import React, { useState, useCallback, useMemo } from 'react';
import { 
  Clipboard, 
  RefreshCw, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  ExternalLink, 
  BarChart3, 
  AlertTriangle,
  TrendingUp,
  Loader,
  CheckSquare
} from 'lucide-react';
import { useCachedData } from '../hooks/useCachedData';
import PCTasksChecklist from './PCTasksChecklist';

const PCTasks = ({ currentUser }) => {
  const [selectedTab, setSelectedTab] = useState('fms');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState('fms');
  const [expandedGroups, setExpandedGroups] = useState({});

  // Fetch PC FMS data with the correct API endpoint
  const fetchPCFMSData = useCallback(async () => {
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
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PC FMS data: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      if (rows.length === 0) {
        return [];
      }

      // Get header row
      const headers = rows[0];
      
      // Process data rows (skip header) and filter by current user's PC column
      const fmsTasks = rows.slice(1)
        .filter(row => row && row.length > 0) // Filter out empty rows
        .map((row, index) => {
          const task = {};
          
          // Map each column to its header
          headers.forEach((header, colIndex) => {
            if (header && row[colIndex] !== undefined) {
              const key = cleanHeaderName(header);
              task[key] = row[colIndex];
            }
          });

          // Add computed fields
          task.id = index + 1;
          task.rowNumber = index + 2; // Actual row number in sheet (1 for header + index)
          
          return task;
        })
        .filter(task => {
          // Filter tasks by current user's name in PC column
          const taskPC = getPCDeo(task);
          return taskPC === currentUser.name;
        });

      return fmsTasks;
    } catch (error) {
      console.error('Error fetching PC FMS data:', error);
      throw error;
    }
  }, [currentUser.name]);

  // Use cached data hook
  const { data: allTasks, loading, error, refresh, lastRefresh } = useCachedData(
    'pc', 
    currentUser, 
    fetchPCFMSData
  );

  const cleanHeaderName = (header) => {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  // Helper functions (moved before useMemo to avoid initialization errors)
  const getTaskInfo = (task) => {
    return task.task_info || task.taskinfo || task.what_to_do || '';
  };

  const getWhatToDo = (task) => {
    return task.what_to_do || task.whattodo || '';
  };

  const getDoer = (task) => {
    return task.doer || task.assignedTo || '';
  };

  const getPCDeo = (task) => {
    return task.pc || task.pcdeo || task.pc_deo || '';
  };

  const getFMSType = (task) => {
    return task.fms || task.fms_type || 'Unknown';
  };

  const getDeadline = (task) => {
    return task.deadline || task.due_date || task.duedate || '';
  };

  const getDelay = (task) => {
    return task.delay || '';
  };

  const getLink = (task) => {
    return task.link || '';
  };

  // Check if task is overdue (has delay content)
  const isTaskOverdue = (task) => {
  const delay = parseFloat(task.delay || 0);
  return delay > 0; // Any positive number means overdue
};

  // Filter tasks - separate FMS tasks from Checklist tasks
  const { fmsTasks, checklistTasks } = useMemo(() => {
    if (!Array.isArray(allTasks)) {
      return { fmsTasks: [], checklistTasks: [] };
    }

    const fms = [];
    const checklist = [];

    allTasks.forEach(task => {
      const fmsType = getFMSType(task);
      if (fmsType.toLowerCase().includes('checklist task')) {
        checklist.push(task);
      } else {
        fms.push(task);
      }
    });

    return { fmsTasks: fms, checklistTasks: checklist };
  }, [allTasks]);

  // Use fmsTasks for the FMS tab (excluding checklist tasks)
  const tasks = selectedTab === 'fms' ? fmsTasks : allTasks;

  // Create hierarchical structure for AllTask view
  const getHierarchicalTasks = () => {
    let filteredTasks = tasks;

    // Filter by search term
    if (searchTerm) {
      filteredTasks = filteredTasks.filter(task =>
        getTaskInfo(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getWhatToDo(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDoer(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getFMSType(task).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Group tasks hierarchically: FMS -> Doer -> Tasks
    const hierarchy = {};
    
    filteredTasks.forEach(task => {
      const fmsType = getFMSType(task);
      const doer = getDoer(task) || 'Unassigned';
      
      if (!hierarchy[fmsType]) {
        hierarchy[fmsType] = {};
      }
      
      if (!hierarchy[fmsType][doer]) {
        hierarchy[fmsType][doer] = [];
      }
      
      hierarchy[fmsType][doer].push(task);
    });

    // Sort FMS types alphabetically
    const sortedHierarchy = {};
    Object.keys(hierarchy).sort((a, b) => a.localeCompare(b)).forEach(fmsType => {
      sortedHierarchy[fmsType] = {};
      
      // Sort doers within each FMS type alphabetically
      Object.keys(hierarchy[fmsType]).sort((a, b) => a.localeCompare(b)).forEach(doer => {
        sortedHierarchy[fmsType][doer] = hierarchy[fmsType][doer];
      });
    });

    return sortedHierarchy;
  };

  // Group tasks based on selected groupBy
  const getGroupedTasks = () => {
    let filteredTasks = tasks;

    // Filter by search term
    if (searchTerm) {
      filteredTasks = filteredTasks.filter(task =>
        getTaskInfo(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getWhatToDo(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDoer(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getFMSType(task).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Group tasks
    const grouped = {};
    
    if (groupBy === 'all') {
      return getHierarchicalTasks(); // Return hierarchical structure for AllTask
    } else if (groupBy === 'fms') {
      filteredTasks.forEach(task => {
        const fmsType = getFMSType(task);
        if (!grouped[fmsType]) {
          grouped[fmsType] = [];
        }
        grouped[fmsType].push(task);
      });
      
      // Sort FMS types alphabetically
      const sortedGrouped = {};
      Object.keys(grouped).sort((a, b) => a.localeCompare(b)).forEach(fmsType => {
        sortedGrouped[fmsType] = grouped[fmsType];
      });
      return sortedGrouped;
    } else if (groupBy === 'doer') {
      filteredTasks.forEach(task => {
        const doer = getDoer(task) || 'Unassigned';
        if (!grouped[doer]) {
          grouped[doer] = [];
        }
        grouped[doer].push(task);
      });
      
      // Sort doers alphabetically
      const sortedGrouped = {};
      Object.keys(grouped).sort((a, b) => a.localeCompare(b)).forEach(doer => {
        sortedGrouped[doer] = grouped[doer];
      });
      return sortedGrouped;
    }

    return grouped;
  };

  const groupedTasks = getGroupedTasks();

  // Helper function to extract delay in days
  const getDelayInDays = (task) => {
    const delay = getDelay(task);
    if (!delay || delay.trim() === '') return 0;
    
    // Try to extract number from delay text
    const match = delay.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Parse task info to extract structured data
  const parseTaskInfo = (taskInfo) => {
    if (!taskInfo) return {};
    
    // Try to extract structured information from task info
    const lines = taskInfo.split('\n').filter(line => line.trim());
    const parsed = { description: taskInfo };
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('amount:') || line.toLowerCase().includes('amt:')) {
        const amountMatch = line.match(/(?:amount|amt):\s*([^\n]+)/i);
        if (amountMatch) parsed.amount = amountMatch[1].trim();
      }
      
      if (line.toLowerCase().includes('party:') || line.toLowerCase().includes('client:')) {
        const partyMatch = line.match(/(?:party|client):\s*([^\n]+)/i);
        if (partyMatch) parsed.party = partyMatch[1].trim();
      }
    });
    
    return parsed;
  };

  // Get summary statistics
  const getSummaryStats = () => {
    if (!Array.isArray(tasks)) return {};
    
    const totalTasks = tasks.length;
    const overdueTasks = tasks.filter(task => isTaskOverdue(task));
    
    // Calculate average delay
    const totalDelay = overdueTasks.reduce((sum, task) => sum + getDelayInDays(task), 0);
    const avgDelay = overdueTasks.length > 0 ? (totalDelay / overdueTasks.length).toFixed(1) : '0';

    // Calculate doer-wise and FMS-wise task distribution
    const doerTaskCount = {};
    const doerDelaySum = {};
    const fmsOverdueCount = {};
    
    tasks.forEach(task => {
      const doer = getDoer(task) || 'Unknown';
      const fmsType = getFMSType(task);
      
      // Count doer tasks
      doerTaskCount[doer] = (doerTaskCount[doer] || 0) + 1;
      
      if (isTaskOverdue(task)) {
        doerDelaySum[doer] = (doerDelaySum[doer] || 0) + getDelayInDays(task);
        fmsOverdueCount[fmsType] = (fmsOverdueCount[fmsType] || 0) + 1;
      }
    });

    // Top doers with overdue tasks
    const topDoersOverdue = Object.keys(doerTaskCount)
      .map(doer => {
        const totalTasks = doerTaskCount[doer];
        const totalDelay = doerDelaySum[doer] || 0;
        const overdueCount = tasks.filter(task => getDoer(task) === doer && isTaskOverdue(task)).length;
        
        return {
          name: doer,
          count: overdueCount,
          total: totalTasks,
          percentage: totalTasks > 0 ? ((overdueCount / totalTasks) * 100).toFixed(1) : 0,
          avgDelay: overdueCount > 0 ? (totalDelay / overdueCount).toFixed(1) : 0
        };
      })
      .filter(data => data.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top FMS types with overdue tasks
    const topFMSOverdue = Object.keys(fmsOverdueCount)
      .map(fmsType => {
        const totalTasks = tasks.filter(task => getFMSType(task) === fmsType).length;
        const overdueCount = fmsOverdueCount[fmsType];
        const totalDelay = overdueTasks
          .filter(task => getFMSType(task) === fmsType)
          .reduce((sum, task) => sum + getDelayInDays(task), 0);
        
        return {
          name: fmsType,
          count: overdueCount,
          total: totalTasks,
          percentage: totalTasks > 0 ? ((overdueCount / totalTasks) * 100).toFixed(1) : 0,
          avgDelay: overdueCount > 0 ? (totalDelay / overdueCount).toFixed(1) : 0
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalTasks,
      totalOverdue: overdueTasks.length,
      overduePercentage: totalTasks > 0 ? ((overdueTasks.length / totalTasks) * 100).toFixed(1) : 0,
      avgDelayDays: avgDelay,
      topDoersOverdue,
      topFMSOverdue
    };
  };

  const summaryStats = getSummaryStats();

  const toggleGroupExpansion = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Render individual task item
  const renderTaskItem = (task, index) => {
    const taskInfo = parseTaskInfo(getTaskInfo(task));
    const isOverdue = isTaskOverdue(task);
    const delay = getDelay(task);
    const deadline = getDeadline(task);
    const link = getLink(task);
    
    return (
      <div 
        key={index} 
        className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${
          isOverdue ? 'border-red-500 bg-red-50/30' : 'border-green-500'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-green-600'}`} />
              <span className="text-sm text-gray-500">Task #{task.rowNumber || index + 1}</span>
              {isOverdue && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                  Overdue
                </span>
              )}
            </div>
            
            <h4 className="font-semibold text-gray-900 mb-2">
              {getTaskInfo(task) || getWhatToDo(task) || 'No task description'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Doer: {getDoer(task) || 'Not assigned'}</span>
                </div>
                
                {deadline && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Deadline: {deadline}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>FMS: {getFMSType(task)}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                {taskInfo.amount && (
                  <div>
                    <span className="font-medium">Amount:</span> {taskInfo.amount}
                  </div>
                )}
                
                {taskInfo.party && (
                  <div>
                    <span className="font-medium">Party:</span> {taskInfo.party}
                  </div>
                )}
                
                {isOverdue && delay && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <Clock className="w-4 h-4" />
                    <span>Delay: {delay}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
              title="Open task link"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    );
  };

  // Render regular grouped view (FMS or Doer)
  const renderRegularGroupedView = (grouped) => {
    return Object.keys(grouped).map(groupName => (
      <div key={groupName} className="bg-white rounded-lg border border-gray-200">
        {/* Group Header */}
        <div 
          className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleGroupExpansion(groupName)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{groupName}</h3>
                <p className="text-sm text-gray-500">
                  {grouped[groupName].length} tasks • {grouped[groupName].filter(task => isTaskOverdue(task)).length} overdue
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {grouped[groupName].length}
              </span>
              {expandedGroups[groupName] ? 
                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </div>
          </div>
        </div>

        {/* Group Tasks */}
        {expandedGroups[groupName] && (
          <div className="divide-y divide-gray-200">
            {grouped[groupName].map((task, index) => renderTaskItem(task, index))}
          </div>
        )}
      </div>
    ));
  };

  // Render hierarchical view for AllTask
  const renderHierarchicalView = (hierarchy) => {
    return Object.keys(hierarchy).map(fmsType => {
      const fmsKey = `fms-${fmsType}`;
      const fmsDoers = hierarchy[fmsType];
      
      // Calculate totals for this FMS
      const fmsTotalTasks = Object.values(fmsDoers).reduce((sum, tasks) => sum + tasks.length, 0);
      const fmsOverdueTasks = Object.values(fmsDoers).reduce((sum, tasks) => 
        sum + tasks.filter(task => isTaskOverdue(task)).length, 0
      );

      return (
        <div key={fmsKey} className="bg-white rounded-lg border border-gray-200 mb-4">
          {/* FMS Header */}
          <div 
            className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleGroupExpansion(fmsKey)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{fmsType}</h3>
                  <p className="text-sm text-gray-500">
                    {fmsTotalTasks} tasks • {fmsOverdueTasks} overdue • {Object.keys(fmsDoers).length} doers
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {fmsTotalTasks}
                </span>
                {expandedGroups[fmsKey] ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
            </div>
          </div>

          {/* FMS Doers */}
          {expandedGroups[fmsKey] && (
            <div className="border-l-4 border-blue-200 ml-4">
              {Object.keys(fmsDoers).map(doer => {
                const doerKey = `${fmsKey}-${doer}`;
                const doerTasks = fmsDoers[doer];
                const doerOverdue = doerTasks.filter(task => isTaskOverdue(task)).length;
                
                return (
                  <div key={doerKey} className="border-b border-gray-100 last:border-b-0">
                    {/* Doer Header */}
                    <div 
                      className="p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleGroupExpansion(doerKey)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-gray-900">{doer}</span>
                          <span className="text-sm text-gray-500">
                            ({doerTasks.length} tasks{doerOverdue > 0 && `, ${doerOverdue} overdue`})
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            doerOverdue > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {doerTasks.length}
                          </span>
                          {expandedGroups[doerKey] ? 
                            <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          }
                        </div>
                      </div>
                    </div>

                    {/* Doer Tasks */}
                    {expandedGroups[doerKey] && (
                      <div className="ml-6 divide-y divide-gray-100">
                        {doerTasks.map((task, index) => renderTaskItem(task, index))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading PC tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading PC Tasks</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Clipboard className="w-6 h-6 mr-3 text-green-600" />
            PC Dashboard
          </h2>
          <p className="text-gray-600">
            Process Coordinator tasks for {currentUser.name}
            {lastRefresh && (
              <span className="text-sm text-gray-500 ml-2">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={refresh}
          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setSelectedTab('fms')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'fms'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              FMS ({fmsTasks.length})
            </button>
            <button
              onClick={() => setSelectedTab('checklist')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'checklist'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckSquare className="w-4 h-4 inline mr-1" />
              Checklist ({checklistTasks.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === 'checklist' ? (
        <PCTasksChecklist 
          tasks={checklistTasks}
          currentUser={currentUser}
          loading={loading}
          error={error}
        />
      ) : (
        <>
          {/* Summary Section - Only show for FMS tab */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Summary & Insights
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Overall Stats */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Overall Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Tasks:</span>
                    <span className="font-semibold">{summaryStats.totalTasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overdue:</span>
                    <span className="font-semibold text-red-600">{summaryStats.totalOverdue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overdue %:</span>
                    <span className={`font-semibold ${summaryStats.overduePercentage > 30 ? 'text-red-600' : 'text-green-600'}`}>
                      {summaryStats.overduePercentage}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Avg Delay:</span>
                    <span className={`font-semibold ${parseFloat(summaryStats.avgDelayDays) > 5 ? 'text-red-600' : parseFloat(summaryStats.avgDelayDays) > 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {summaryStats.avgDelayDays} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Overdue Doers */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Top Overdue Doers</h4>
                <div className="space-y-2">
                  {summaryStats.topDoersOverdue?.slice(0, 3).map((doer, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate">{doer.name}</span>
                      <span className="font-semibold text-red-600">{doer.count}</span>
                    </div>
                  ))}
                  {summaryStats.topDoersOverdue?.length === 0 && (
                    <p className="text-sm text-gray-500">No overdue tasks</p>
                  )}
                </div>
              </div>

              {/* Top Overdue FMS */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Top Overdue FMS</h4>
                <div className="space-y-2">
                  {summaryStats.topFMSOverdue?.slice(0, 3).map((fms, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate">{fms.name}</span>
                      <span className="font-semibold text-red-600">{fms.count}</span>
                    </div>
                  ))}
                  {summaryStats.topFMSOverdue?.length === 0 && (
                    <p className="text-sm text-gray-500">No overdue tasks</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="fms">Group by FMS</option>
                  <option value="doer">Group by Doer</option>
                  <option value="all">All Tasks (Hierarchical)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tasks Display */}
          <div className="space-y-4">
            {Object.keys(groupedTasks).length === 0 ? (
              <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No FMS Tasks Found</h3>
                <p className="text-gray-600">
                  {tasks.length === 0 
                    ? `No FMS tasks assigned to ${currentUser.name}` 
                    : 'No tasks match your current search criteria'
                  }
                </p>
              </div>
            ) : (
              <>
                {groupBy === 'all' 
                  ? renderHierarchicalView(groupedTasks)
                  : renderRegularGroupedView(groupedTasks)
                }
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PCTasks;
