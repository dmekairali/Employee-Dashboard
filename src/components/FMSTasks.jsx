import React, { useState, useCallback } from 'react';
import { 
  FileText, 
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
  DollarSign,
  Hash
} from 'lucide-react';
import { useCachedData } from '../hooks/useCachedData';

const FMSTasks = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [fmsFilter, setFmsFilter] = useState('all');
  const [doerFilter, setDoerFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedFMS, setExpandedFMS] = useState({});

  // Fetch function for FMS data
  const fetchFMSData = useCallback(async () => {
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
      
      // Process data rows (skip header) and filter by current user
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
          // Filter tasks by current user's name in Doer column
          const taskDoer = getDoer(task);
          return taskDoer === currentUser.name;
        });

      return fmsTasks;
    } catch (error) {
      console.error('Error fetching FMS data:', error);
      throw error;
    }
  }, [currentUser.name]);

  // Use cached data hook
  const { data: tasks, loading, error, refresh, lastRefresh } = useCachedData(
    'fms', 
    currentUser, 
    fetchFMSData
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

  // Helper functions to extract data from task info
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
    return task.pcdeo || '';
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

  // Group tasks by FMS
  const groupedTasks = tasks.reduce((groups, task) => {
    const fmsType = getFMSType(task);
    if (!groups[fmsType]) {
      groups[fmsType] = [];
    }
    groups[fmsType].push(task);
    return groups;
  }, {});

  // Get unique FMS types and doers for filters
  const fmsTypes = ['all', ...new Set(tasks.map(task => getFMSType(task)))];
  const doers = ['all', ...new Set(tasks.map(task => getDoer(task)).filter(doer => doer))];

  const filteredGroupedTasks = Object.keys(groupedTasks).reduce((filtered, fmsType) => {
    const fmsTasks = groupedTasks[fmsType].filter(task => {
      const matchesSearch = searchTerm === '' || 
        getTaskInfo(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getWhatToDo(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDoer(task).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFMS = fmsFilter === 'all' || getFMSType(task) === fmsFilter;
      const matchesDoer = doerFilter === 'all' || getDoer(task) === doerFilter;
      
      return matchesSearch && matchesFMS && matchesDoer;
    });

    if (fmsTasks.length > 0) {
      filtered[fmsType] = fmsTasks;
    }
    
    return filtered;
  }, {});

  const getTotalStats = () => {
    const total = tasks.length;
    const fmsTypeCount = Object.keys(groupedTasks).length;
    const uniqueDoers = new Set(tasks.map(task => getDoer(task)).filter(doer => doer)).size;
    
    return { total, fmsTypeCount, uniqueDoers };
  };

  const stats = getTotalStats();

  const toggleFMSExpansion = (fmsType) => {
    setExpandedFMS(prev => ({
      ...prev,
      [fmsType]: !prev[fmsType]
    }));
  };

  const TaskModal = ({ task, onClose }) => {
    const taskInfo = parseTaskInfo(getTaskInfo(task));

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
        ></div>

        <div
          className="relative bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl overflow-y-auto"
          onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
        >
          {/* Header */}
          <div className="bg-white p-6 border-b border-gray-200 rounded-t-xl sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">FMS Task Details</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
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
                    <label className="text-sm text-gray-500">Mobile</label>
                    <p>{taskInfo.mobile}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Invoice Amount</label>
                    <p className="font-semibold text-green-600">{taskInfo.invoiceAmount}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Invoice No</label>
                    <p>{taskInfo.invoiceNo}</p>
                  </div>
                </div>
              </div>
              
              {/* Right column */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Task Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-500">Assigned To</label>
                    <p className="font-medium">{getDoer(task)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Doer Email</label>
                    <p>{getDoerEmail(task)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Planned Date</label>
                    <p>{getPlannedDate(task)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Delay</label>
                    <p className={getDelay(task) ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {getDelay(task) || 'No delay'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Week</label>
                    <p>{getWeek(task)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">PC Deo</label>
                    <p>{getPCDeo(task)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Task Info</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  {getCleanTaskInfo(task)}
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">What to Do</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {getWhatToDo(task)}
                </p>
              </div>
            </div>

            {getLink(task) && (
              <div className="mt-6">
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
        <Loader className="w-8 h-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading FMS tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading FMS Tasks</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
            <FileText className="w-6 h-6 mr-3 text-purple-600" />
            FMS Tasks
          </h2>
          <p className="text-gray-600">
            Tasks assigned to {currentUser.name}
            {lastRefresh && (
              <span className="text-sm text-gray-500 ml-2">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={refresh}
          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">FMS Types</p>
              <p className="text-2xl font-bold text-blue-600">{stats.fmsTypeCount}</p>
            </div>
            <Hash className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Assigned Doers</p>
              <p className="text-2xl font-bold text-green-600">{stats.uniqueDoers}</p>
            </div>
            <User className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
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
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <select
            value={fmsFilter}
            onChange={(e) => setFmsFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {fmsTypes.map(fms => (
              <option key={fms} value={fms}>
                {fms === 'all' ? 'All FMS Types' : fms}
              </option>
            ))}
          </select>
          
          <select
            value={doerFilter}
            onChange={(e) => setDoerFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {doers.map(doer => (
              <option key={doer} value={doer}>
                {doer === 'all' ? 'All Doers' : doer}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FMS Tasks Grouped */}
      <div className="space-y-4">
        {Object.keys(filteredGroupedTasks).length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No FMS Tasks Found</h3>
            <p className="text-gray-600">
              {tasks.length === 0 
                ? `No FMS tasks assigned to ${currentUser.name}`
                : 'No tasks match your current filters'
              }
            </p>
          </div>
        ) : (
          Object.keys(filteredGroupedTasks).map(fmsType => (
            <div key={fmsType} className="bg-white rounded-lg border border-gray-200">
              {/* FMS Group Header */}
              <div 
                className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleFMSExpansion(fmsType)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{fmsType}</h3>
                      <p className="text-sm text-gray-500">{filteredGroupedTasks[fmsType].length} tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {filteredGroupedTasks[fmsType].length}
                    </span>
                    {expandedFMS[fmsType] ? 
                      <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </div>
              </div>

              {/* FMS Tasks List */}
              {expandedFMS[fmsType] && (
                <div className="divide-y divide-gray-200">
                  {filteredGroupedTasks[fmsType].map((task, index) => {
                    const taskInfo = parseTaskInfo(getTaskInfo(task));
                    return (
                      <div 
                        key={index} 
                        className="p-4 hover:bg-gray-50 cursor-pointer"
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
                              {getDelay(task) && (
                                <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                  Delayed
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {getWhatToDo(task)}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {getDoer(task)}
                              </span>
                              {taskInfo.invoiceAmount && (
                                <span className="flex items-center">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  ₹{taskInfo.invoiceAmount}
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
                                <ExternalLink className="w-4 h-4 text-purple-500 hover:text-purple-700" />
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
          ))
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
    </div>
  );
};

export default FMSTasks;