import React, { useState, useCallback } from 'react';
import { 
  Clipboard, 
  Calendar, 
  Clock, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle, 
  Search,
  Filter,
  RefreshCw,
  Eye,
  Building2,
  User,
  MessageCircle,
  Link,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Loader,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Hash,
  FileText,
  Timer,
  XCircle,
  BarChart3,
  Award,
  Target,
  Folder,
  Users
} from 'lucide-react';
import { useCachedData } from '../hooks/useCachedData';

const PCTasks = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('fms');
  const [groupBy, setGroupBy] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  // Fetch function for FMS data filtered by PC
  const fetchPCFMSData = useCallback(async () => {
    if (selectedTab !== 'fms') return [];
    
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
        throw new Error(`HTTP error! status: ${response.status}`);
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
  }, [currentUser.name, selectedTab]);

  // Use cached data hook
  const { data: tasks, loading, error, refresh, lastRefresh } = useCachedData(
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

  // Helper function to clean task info text
  const getCleanTaskInfo = (task) => {
    const taskInfo = getTaskInfo(task);
    if (!taskInfo) return '';
    
    return taskInfo
      .replace(/<br\s*\/?>/gi, ' ') // Remove <br> tags
      .replace(/\n/g, ' ') // Remove line breaks
      .replace(/\r/g, ' ') // Remove carriage returns
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim(); // Remove leading/trailing whitespace
  };
  const parseTaskInfo = (taskInfo) => {
    if (!taskInfo) return {};
    
    const info = {};
    const lines = taskInfo.split('<br>');
    
    lines.forEach(line => {
      if (line.includes('Oder ID') || line.includes('Order ID')) {
        info.orderId = line.split(' - ')[1] || '';
      } else if (line.includes('Name of the Client')) {
        info.clientName = line.split(' - ')[1] || '';
      } else if (line.includes('Mobile')) {
        info.mobile = line.split(' - ')[1] || '';
      } else if (line.includes('Invoice Amount')) {
        info.invoiceAmount = line.split(' - ')[1] || '';
      } else if (line.includes('Invoice No')) {
        info.invoiceNo = line.split(' - ')[1] || '';
      } else if (line.includes('Order Taken By')) {
        info.orderTakenBy = line.split(' - ')[1] || '';
      }
    });
    
    return info;
  };

  const getFMSType = (task) => {
    return task.fms || 'Unknown FMS';
  };

  const getTaskInfo = (task) => {
    return task.task_info || '';
  };

  const getWhatToDo = (task) => {
    return task.what_to_do || '';
  };

  const getDoer = (task) => {
    return task.doer || '';
  };

  const getPlannedDate = (task) => {
    return task.planned || '';
  };

  const getDelay = (task) => {
    return task.delay || '';
  };

  const getPCDeo = (task) => {
    return task.pc || '';
  };

  const getDoerEmail = (task) => {
    return task.doer_email || '';
  };

  const getWeek = (task) => {
    return task.week || '';
  };

  const getLink = (task) => {
    return task.link || '';
  };

  // Check if task is overdue (has delay content)
  const isTaskOverdue = (task) => {
    const delay = getDelay(task);
    return delay && delay.trim() !== '';
  };

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
    return match ? parseInt(match[1]) : 1; // Default to 1 day if no number found but delay exists
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    const overdueTasks = tasks.filter(task => isTaskOverdue(task));
    const totalTasks = tasks.length;
    
    // Calculate average delay in days
    let avgDelay = 0;
    if (overdueTasks.length > 0) {
      const totalDelayDays = overdueTasks.reduce((sum, task) => sum + getDelayInDays(task), 0);
      avgDelay = (totalDelayDays / overdueTasks.length).toFixed(1);
    }
    
    // Top 5 Doers with overdue tasks and their average delays
    const doerOverdueData = {};
    overdueTasks.forEach(task => {
      const doer = getDoer(task) || 'Unassigned';
      if (!doerOverdueData[doer]) {
        doerOverdueData[doer] = { count: 0, totalDelay: 0 };
      }
      doerOverdueData[doer].count += 1;
      doerOverdueData[doer].totalDelay += getDelayInDays(task);
    });
    
    const topDoersOverdue = Object.entries(doerOverdueData)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([doer, data]) => ({
        name: doer,
        count: data.count,
        percentage: totalTasks > 0 ? ((data.count / totalTasks) * 100).toFixed(1) : 0,
        avgDelay: data.count > 0 ? (data.totalDelay / data.count).toFixed(1) : 0
      }));

    // Top 5 FMS types with overdue tasks and their average delays
    const fmsOverdueData = {};
    overdueTasks.forEach(task => {
      const fms = getFMSType(task);
      if (!fmsOverdueData[fms]) {
        fmsOverdueData[fms] = { count: 0, totalDelay: 0 };
      }
      fmsOverdueData[fms].count += 1;
      fmsOverdueData[fms].totalDelay += getDelayInDays(task);
    });
    
    const topFMSOverdue = Object.entries(fmsOverdueData)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 5)
      .map(([fms, data]) => ({
        name: fms,
        count: data.count,
        percentage: totalTasks > 0 ? ((data.count / totalTasks) * 100).toFixed(1) : 0,
        avgDelay: data.count > 0 ? (data.totalDelay / data.count).toFixed(1) : 0
      }));

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

  const getActionRecommendations = () => {
    const recommendations = [];
    
    if (summaryStats.overduePercentage > 30) {
      recommendations.push({
        type: 'urgent',
        message: `High overdue rate (${summaryStats.overduePercentage}%) - Immediate attention required`,
        action: 'Review task assignments and deadlines'
      });
    }

    if (parseFloat(summaryStats.avgDelayDays) > 5) {
      recommendations.push({
        type: 'warning',
        message: `High average delay (${summaryStats.avgDelayDays} days) - Tasks are significantly behind schedule`,
        action: 'Identify bottlenecks and streamline processes to reduce delays'
      });
    }

    if (summaryStats.topDoersOverdue.length > 0) {
      const topDoer = summaryStats.topDoersOverdue[0];
      if (topDoer.count > 5) {
        recommendations.push({
          type: 'warning',
          message: `${topDoer.name} has ${topDoer.count} overdue tasks`,
          action: 'Consider redistributing workload or providing additional support'
        });
      }
    }

    if (summaryStats.topFMSOverdue.length > 0) {
      const topFMS = summaryStats.topFMSOverdue[0];
      if (topFMS.count > 3) {
        recommendations.push({
          type: 'info',
          message: `${topFMS.name} has highest overdue count (${topFMS.count})`,
          action: 'Review FMS process efficiency and bottlenecks'
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'Tasks are well-distributed and on track',
        action: 'Continue monitoring and maintain current pace'
      });
    }

    return recommendations;
  };

  const actionRecommendations = getActionRecommendations();

  // Render hierarchical AllTask view
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
          {/* FMS Level Header */}
          <div 
            className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 bg-green-50"
            onClick={() => toggleGroupExpansion(fmsKey)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Folder className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{fmsType}</h3>
                  <p className="text-sm text-gray-500">
                    {fmsTotalTasks} tasks • {fmsOverdueTasks} overdue • {Object.keys(fmsDoers).length} doers
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {fmsTotalTasks}
                </span>
                {fmsOverdueTasks > 0 && (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    {fmsOverdueTasks} overdue
                  </span>
                )}
                {expandedGroups[fmsKey] ? 
                  <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </div>
            </div>
          </div>

          {/* Doers Level - Only show when FMS is expanded */}
          {expandedGroups[fmsKey] && (
            <div className="pl-4">
              {Object.keys(fmsDoers).map(doer => {
                const doerKey = `${fmsKey}-doer-${doer}`;
                const doerTasks = fmsDoers[doer];
                const doerOverdueTasks = doerTasks.filter(task => isTaskOverdue(task)).length;

                return (
                  <div key={doerKey} className="border-l-2 border-gray-200">
                    {/* Doer Level Header */}
                    <div 
                      className="p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 bg-blue-25 ml-2"
                      onClick={() => toggleGroupExpansion(doerKey)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{doer}</h4>
                            <p className="text-sm text-gray-500">
                              {doerTasks.length} tasks • {doerOverdueTasks} overdue
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {doerTasks.length}
                          </span>
                          {doerOverdueTasks > 0 && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                              {doerOverdueTasks}
                            </span>
                          )}
                          {expandedGroups[doerKey] ? 
                            <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          }
                        </div>
                      </div>
                    </div>

                    {/* Tasks Level - Only show when Doer is expanded */}
                    {expandedGroups[doerKey] && (
                      <div className="pl-6 divide-y divide-gray-100">
                        {doerTasks.map((task, index) => {
                          const taskInfo = parseTaskInfo(getTaskInfo(task));
                          const isOverdue = isTaskOverdue(task);
                          return (
                            <div 
                              key={index} 
                              className={`p-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                                isOverdue ? 'border-l-red-500 bg-red-25' : 'border-l-blue-500 bg-blue-25'
                              }`}
                              onClick={() => {
                                setSelectedTask(task);
                                setShowModal(true);
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h5 className="font-medium text-gray-900 text-sm">
                                      {taskInfo.orderId || `Task ${task.id}`}
                                    </h5>
                                    {taskInfo.clientName && (
                                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                        {taskInfo.clientName}
                                      </span>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {isOverdue ? 'Overdue' : 'Upcoming'}
                                    </span>
                                  </div>
                                  
                                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                    {getWhatToDo(task)}
                                  </p>
                                  
                                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                                    {taskInfo.invoiceAmount && (
                                      <span className="flex items-center">
                                        <span className="w-3 h-3 mr-1">₹</span>
                                        {taskInfo.invoiceAmount}
                                      </span>
                                    )}
                                    <span className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {getPlannedDate(task)}
                                    </span>
                                    <span className="flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {getWeek(task)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 ml-4">
                                  {getLink(task) && (
                                    <a
                                      href={getLink(task)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                                      title="Open external link"
                                    >
                                      <ExternalLink className="w-3 h-3 text-green-500 hover:text-green-700" />
                                    </a>
                                  )}
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
            {grouped[groupName].map((task, index) => {
              const taskInfo = parseTaskInfo(getTaskInfo(task));
              const isOverdue = isTaskOverdue(task);
              return (
                <div 
                  key={index} 
                  className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${
                    isOverdue ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500 bg-blue-50'
                  }`}
                  onClick={() => {
                    setSelectedTask(task);
                    setShowModal(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {taskInfo.orderId || `Task ${task.id}`}
                        </h4>
                        {taskInfo.clientName && (
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {taskInfo.clientName}
                          </span>
                        )}
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {isOverdue ? 'Overdue' : 'Upcoming'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {getWhatToDo(task)}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {getDoer(task)}
                        </span>
                        <span className="flex items-center">
                          <Hash className="w-3 h-3 mr-1" />
                          {getFMSType(task)}
                        </span>
                        {taskInfo.invoiceAmount && (
                          <span className="flex items-center">
                            <span className="w-3 h-3 mr-1">₹</span>
                            {taskInfo.invoiceAmount}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {getPlannedDate(task)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {getWeek(task)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {getLink(task) && (
                        <a
                          href={getLink(task)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Open external link"
                        >
                          <ExternalLink className="w-4 h-4 text-green-500 hover:text-green-700" />
                        </a>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    ));
  };

  const TaskModal = ({ task, onClose }) => {
    const taskInfo = parseTaskInfo(getTaskInfo(task));
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">PC FMS Task Details</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">FMS Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">FMS Type</label>
                    <p className="font-medium">{getFMSType(task)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Order ID</label>
                    <p>{taskInfo.orderId}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Client Name</label>
                    <p>{taskInfo.clientName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Invoice Amount</label>
                    <p className="font-semibold text-green-600">{taskInfo.invoiceAmount}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Task Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Assigned To</label>
                    <p className="font-medium">{getDoer(task)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">PC Deo</label>
                    <p className="font-medium">{getPCDeo(task)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Planned Date</label>
                    <p>{getPlannedDate(task)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
  isTaskOverdue(task) ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
}`}>
  {isTaskOverdue(task) ? 'Overdue' : 'Upcoming'}
</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">What to Do</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {getWhatToDo(task)}
                </p>
              </div>
            </div>

            {getLink(task) && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Related Link</h4>
                <a 
                  href={getLink(task)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Link className="w-4 h-4 mr-1" />
                  Open Link
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
              FMS ({tasks.length})
            </button>
            <button
              disabled
              className="py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-300 cursor-not-allowed"
            >
              Checklist (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {selectedTab === 'fms' && (
        <>
          {/* Summary Section */}
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

              {/* Top Doers Overdue */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Top 5 Doers - Overdue</h4>
                <div className="space-y-3">
                  {summaryStats.topDoersOverdue.map((doer, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 truncate mr-2">{doer.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold">{doer.count}</span>
                          <span className="text-xs text-gray-500">({doer.percentage}%)</span>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          parseFloat(doer.avgDelay) > 5 ? 'bg-red-100 text-red-700' :
                          parseFloat(doer.avgDelay) > 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          Avg: {doer.avgDelay} days
                        </span>
                      </div>
                    </div>
                  ))}
                  {summaryStats.topDoersOverdue.length === 0 && (
                    <p className="text-sm text-gray-500">No overdue tasks</p>
                  )}
                </div>
              </div>

              {/* Top FMS Overdue */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Top 5 FMS - Overdue</h4>
                <div className="space-y-3">
                  {summaryStats.topFMSOverdue.map((fms, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 truncate mr-2">{fms.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold">{fms.count}</span>
                          <span className="text-xs text-gray-500">({fms.percentage}%)</span>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          parseFloat(fms.avgDelay) > 5 ? 'bg-red-100 text-red-700' :
                          parseFloat(fms.avgDelay) > 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          Avg: {fms.avgDelay} days
                        </span>
                      </div>
                    </div>
                  ))}
                  {summaryStats.topFMSOverdue.length === 0 && (
                    <p className="text-sm text-gray-500">No overdue tasks</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Recommendations */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Action Recommendations
              </h4>
              <div className="space-y-2">
                {actionRecommendations.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    rec.type === 'urgent' ? 'bg-red-50 border-red-200' :
                    rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    rec.type === 'info' ? 'bg-blue-50 border-blue-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      rec.type === 'urgent' ? 'text-red-800' :
                      rec.type === 'warning' ? 'text-yellow-800' :
                      rec.type === 'info' ? 'text-blue-800' :
                      'text-green-800'
                    }`}>{rec.message}</p>
                    <p className={`text-xs ${
                      rec.type === 'urgent' ? 'text-red-600' :
                      rec.type === 'warning' ? 'text-yellow-600' :
                      rec.type === 'info' ? 'text-blue-600' :
                      'text-green-600'
                    }`}>{rec.action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-4">
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
              
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Tasks (Hierarchical)</option>
                <option value="fms">Group by FMS</option>
                <option value="doer">Group by Doer</option>
              </select>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            {Object.keys(groupedTasks).length === 0 ? (
              <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
                <Clipboard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Found</h3>
                <p className="text-gray-600">
                  {tasks.length === 0 
                    ? `No FMS tasks assigned to PC: ${currentUser.name}`
                    : 'No tasks match your current filters'
                  }
                </p>
              </div>
            ) : (
              groupBy === 'all' ? renderHierarchicalView(groupedTasks) : renderRegularGroupedView(groupedTasks)
            )}
          </div>

          {/* Task Modal */}
          {showModal && selectedTask && (
            <TaskModal 
              task={selectedTask} 
              onClose={() => {
                setShowModal(false);
                setSelectedTask(null);
              }} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default PCTasks;