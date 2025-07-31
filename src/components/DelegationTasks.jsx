import React, { useState, useCallback, useMemo } from 'react';
import { 
  Users, 
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
  Star,
  Target,
  Zap,
  Award,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy
} from 'lucide-react';
import { useCachedData } from '../hooks/useCachedData';

const DelegationTasks = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('80_20'); // Default sort by 80/20 score
  const [sortOrder, setSortOrder] = useState('desc'); // High to low priority
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch function for delegation data
  const fetchDelegationData = useCallback(async () => {
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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      if (rows.length === 0) {
        return [];
      }

      // Get header row (first row of our data)
      const headers = rows[0];
      
      // Find the index of "Doer Name" column
      const doerNameIndex = headers.findIndex(header => 
        header && header.toLowerCase().includes('doer name')
      );

      if (doerNameIndex === -1) {
        throw new Error('Doer Name column not found');
      }

      // Process data rows (skip header) and filter by current user
      const delegationTasks = rows.slice(1)
        .filter(row => row[doerNameIndex] === currentUser.name) // Filter by doer name
        .map((row, index) => {
          const task = {};
          
          // Map each column to its header
          headers.forEach((header, colIndex) => {
            if (header && row[colIndex] !== undefined) {
              // Clean header names for object keys
              const key = cleanHeaderName(header);
              task[key] = row[colIndex];
            }
          });

          // Add computed fields
          task.id = index + 1;
          task.rowNumber = index + 9; // Actual row number in sheet (8 + 1 for header + index)
          
          return task;
        });

      return delegationTasks;
    } catch (error) {
      console.error('Error fetching delegation data:', error);
      throw error;
    }
  }, [currentUser.name]);

  // Use cached data hook
  const { data: tasks, loading, error, refresh:originalRefresh, lastRefresh } = useCachedData(
    'delegation', 
    currentUser, 
    fetchDelegationData
  );


  // Add local loading state for manual refresh
const [isManualRefreshing, setIsManualRefreshing] = useState(false);

// Enhanced refresh function that ensures fresh data from server  
const refresh = useCallback(async () => {
  console.log(`🔄 Force refreshing Delegation data for ${currentUser.name} - fetching fresh from server...`);
  
  setIsManualRefreshing(true);
  
  try {
    // Import dataManager to clear cache first
    const { default: dataManager } = await import('../utils/DataManager');
    
    // Clear the specific cache entry to force fresh fetch
    const cacheKey = `delegation_${currentUser.name}`;
    dataManager.cache.delete(cacheKey);
    console.log(`🗑️ Cleared cache for ${cacheKey}`);
    
    // Directly call the fetch function to get fresh data from server
    const freshData = await fetchDelegationData();
    
    // Update cache with fresh data
    dataManager.setData('delegation', currentUser.name, freshData);
    
    console.log(`✅ Successfully refreshed Delegation data: ${freshData.length} tasks`);
    return freshData;
  } catch (error) {
    console.error('❌ Error during manual refresh:', error);
    throw error;
  } finally {
    setIsManualRefreshing(false);
  }
}, [fetchDelegationData, currentUser.name]);

// Combined loading state
const isRefreshing = loading || isManualRefreshing;

  const cleanHeaderName = (header) => {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  // Priority scoring functions with improved column name matching
  const getEaseToImplement = (task) => {
    // Look for various possible column names
    const possibleKeys = Object.keys(task).find(key => 
      key.toLowerCase().includes('easiest')
    );
    return parseFloat(task[possibleKeys] || 0);
  };

  const getRelativeImpact = (task) => {
    const possibleKeys = Object.keys(task).find(key => 
      (key.toLowerCase().includes('relative') && key.toLowerCase().includes('impact')) ||
      (key.toLowerCase().includes('impact') && key.toLowerCase().includes('result'))
    );
    return parseFloat(task[possibleKeys] || 0);
  };

  const getUrgency = (task) => {
    const possibleKeys = Object.keys(task).find(key => 
      key.toLowerCase().includes('urgency')
    );
    return parseFloat(task[possibleKeys] || 0);
  };

  const getImportance = (task) => {
    const possibleKeys = Object.keys(task).find(key => 
      key.toLowerCase().includes('importance')
    );
    return parseFloat(task[possibleKeys] || 0);
  };

  const getEmotionalEnergy = (task) => {
    const possibleKeys = Object.keys(task).find(key => 
      key.toLowerCase().includes('emotional') && key.toLowerCase().includes('energy')
    );
    return parseFloat(task[possibleKeys] || 0);
  };

  const getSignificance = (task) => {
    const possibleKeys = Object.keys(task).find(key => 
      key.toLowerCase().includes('saving') &&  key.toLowerCase().includes('future')
    );
    return parseFloat(task[possibleKeys] || 0);
  };

  const getROTI = (task) => {
    const possibleKeys = Object.keys(task).find(key => 
      key.toLowerCase().includes('roti')
    );
    return parseFloat(task[possibleKeys] || 0);
  };

  const get8020Score = (task) => {
    const possibleKeys = Object.keys(task).find(key => 
      key.includes('80') || key.includes('20') || key.toLowerCase().includes('eighty')
    );
    return parseFloat(task[possibleKeys] || 0);
  };

  // Calculate overall priority score based on 80/20 with new ranges
  const calculatePriorityLevel = (score) => {
    if (score >= 75) return 'urgent';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  };

  // Get priority label with score range
  const getPriorityLabel = (priority) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'Urgent (75-100)';
      case 'high': return 'High (50-75)';
      case 'medium': return 'Medium (25-50)';
      case 'low': return 'Low (0-25)';
      default: return 'Unknown';
    }
  };

  // Get short priority label
  const getShortPriorityLabel = (priority) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'Urgent';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  };

  const getPriorityColor = (priority) => {
    if (!priority) return 'border-l-gray-300 bg-white';
    const p = priority.toLowerCase();
    if (p.includes('urgent') || p === '5') return 'border-l-gray-300 bg-white';
    if (p.includes('high') || p === '4') return 'border-l-gray-300 bg-white';
    if (p.includes('medium') || p === '3') return 'border-l-gray-300 bg-white';
    if (p.includes('low') || p === '2' || p === '1') return 'border-l-gray-300 bg-white';
    return 'border-l-gray-300 bg-white';
  };

  const getPriorityBadge = (priority) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    const p = priority.toLowerCase();
    if (p.includes('urgent')) return 'bg-red-100 text-red-800';
    if (p.includes('high')) return 'bg-orange-100 text-orange-800';
    if (p.includes('medium')) return 'bg-yellow-100 text-yellow-800';
    if (p.includes('low')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('done')) return 'bg-green-100 text-green-800';
    if (s.includes('progress') || s.includes('working')) return 'bg-blue-100 text-blue-800';
    if (s.includes('pending') || s.includes('assigned')) return 'bg-yellow-100 text-yellow-800';
    if (s.includes('overdue') || s.includes('delayed')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getTaskTitle = (task) => {
    return task.task || 'Untitled Task';
  };

  const getTaskCompany = (task) => {
    return task.company || 'Unknown';
  };

  const getTaskStatus = (task) => {
    return task.delegation_status || 'pending';
  };

  const getTaskPriority = (task) => {
    const score = get8020Score(task);
    return calculatePriorityLevel(score);
  };

  const getTaskDate = (task) => {
    return task.task_created_date || task.first_date || new Date().toLocaleDateString();
  };

  const getDueDate = (task) => {
    return task.final_date || task.first_date || '';
  };

  const getSubmissionLink = (task) => {
    return task.submission_link || '';
  };

  const getTaskRemarks = (task) => {
    return task.all_remarks_history || task.doer_remarks || '';
  };

  // Check if task is overdue
  const isOverdue = (task) => {
    const dueDate = getDueDate(task);
    if (!dueDate) return false;
    const today = new Date();
    const taskDueDate = new Date(dueDate);
    return taskDueDate < today;
  };

  // Enhanced filtering and sorting
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = searchTerm === '' || 
        getTaskTitle(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTaskCompany(task).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        getTaskStatus(task).toLowerCase().includes(statusFilter);
      
      const taskPriority = getTaskPriority(task);
      const matchesPriority = priorityFilter === 'all' || 
        taskPriority.toLowerCase().includes(priorityFilter);
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case '80_20':
          valueA = get8020Score(a);
          valueB = get8020Score(b);
          break;
        case 'ease':
          valueA = getEaseToImplement(a);
          valueB = getEaseToImplement(b);
          break;
        case 'impact':
          valueA = getRelativeImpact(a);
          valueB = getRelativeImpact(b);
          break;
        case 'urgency':
          valueA = getUrgency(a);
          valueB = getUrgency(b);
          break;
        case 'importance':
          valueA = getImportance(a);
          valueB = getImportance(b);
          break;
        case 'roti':
          valueA = getROTI(a);
          valueB = getROTI(b);
          break;
        case 'date':
          valueA = new Date(getTaskDate(a));
          valueB = new Date(getTaskDate(b));
          break;
        default:
          valueA = getTaskTitle(a);
          valueB = getTaskTitle(b);
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    return filtered;
  }, [tasks, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => 
      getTaskStatus(task).toLowerCase().includes('completed')).length;
    const pending = tasks.filter(task => 
      getTaskStatus(task).toLowerCase().includes('pending')).length;
    const hold = tasks.filter(task => 
      getTaskStatus(task).toLowerCase().includes('hold')).length;
    const overdue = tasks.filter(task => isOverdue(task)).length;
    const highPriority = tasks.filter(task => 
      get8020Score(task) >= 50).length;
    
    return { total, completed, pending, hold, overdue, highPriority };
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const stats = getTaskStats();

  const copyTasksToClipboard = () => {
    const formatDate = (dateString) => {
      if (!dateString) return '';

      let date;
      const parts = dateString.split(/[-/]/);

      if (parts.length === 3) {
        const part1 = parseInt(parts[0], 10);
        const part2 = parseInt(parts[1], 10);
        const part3 = parseInt(parts[2], 10);

        if (isNaN(part1) || isNaN(part2) || isNaN(part3)) {
            // Handle non-numeric parts, likely 'DD-Mon-YYYY'
            date = new Date(dateString);
        } else {
          // Handle numeric dates
          if (part1 > 12 && part1 <= 31) {
            // DD/MM/YYYY
            date = new Date(part3, part2 - 1, part1);
          } else if (part2 > 12 && part2 <= 31) {
            // MM/DD/YYYY - this is unlikely in this context, but good to have
             date = new Date(part3, part1 - 1, part2);
          }
          else {
            // Assume MM/DD/YYYY for ambiguous dates like 01/02/2025
            date = new Date(part3, part1 - 1, part2);
          }
        }
      } else {
        date = new Date(dateString);
      }

      if (!date || isNaN(date.getTime())) {
        return dateString; // Return original string if parsing fails
      }

      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('default', { month: 'short' }).toLowerCase();
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const header = [
      "Task Description",
      "Final Date",
      "Ease to Implement (1–10)",
      "Relative Impact on Results (1–10)",
      "Urgency (1–5)",
      "Importance (1–5)",
      "Emotional Energy Required (1–5)",
      "Significance (1–5)",
      "ROTI (1–3)",
      "Assigned To (Team Member, Optional)",
      "Blocking Dependencies (Optional)"
    ].join("\t");

    const rows = filteredAndSortedTasks.map(task => {
      return [
        getTaskTitle(task),
        formatDate(getDueDate(task)),
        getEaseToImplement(task),
        getRelativeImpact(task),
        getUrgency(task),
        getImportance(task),
        getEmotionalEnergy(task),
        getSignificance(task),
        getROTI(task),
        "", // Assigned To
        ""  // Blocking Dependencies
      ].join("\t");
    });

    const clipboardText = [header, ...rows].join("\n");
    navigator.clipboard.writeText(clipboardText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
    >
      <span>{children}</span>
      {sortBy === field && (
        sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
      )}
    </button>
  );

  const TaskModal = ({ task, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Task Details</h3>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadge(getTaskPriority(task))}`}>
                  {getPriorityLabel(getTaskPriority(task))}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  80/20 Score: {get8020Score(task)}
                </span>
              </div>
            </div>
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
              <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Task</label>
                  <p className="font-medium">{getTaskTitle(task)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Company</label>
                  <p>{getTaskCompany(task)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getTaskStatus(task))}`}>
                    {getTaskStatus(task)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Dates & Timeline</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Created Date</label>
                  <p>{getTaskDate(task)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Due Date</label>
                  <p>{getDueDate(task) || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Submission Link</label>
                  {getSubmissionLink(task) ? (
                    <a 
                      href={getSubmissionLink(task)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Link className="w-4 h-4 mr-1" />
                      View Submission
                    </a>
                  ) : (
                    <p className="text-gray-500">No submission link</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Priority Scoring Matrix */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Priority Scoring Matrix
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Ease To Implement</div>
                <div className="text-lg font-bold text-blue-600">
                  {getEaseToImplement(task)}/10
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Relative Impact</div>
                <div className="text-lg font-bold text-green-600">
                  {getRelativeImpact(task)}/10
                </div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Urgency</div>
                <div className="text-lg font-bold text-red-600">
                  {getUrgency(task)}/5
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Importance</div>
                <div className="text-lg font-bold text-purple-600">
                  {getImportance(task)}/5
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Emotional Energy</div>
                <div className="text-lg font-bold text-yellow-600">
                  {getEmotionalEnergy(task)}/5
                </div>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Significance</div>
                <div className="text-lg font-bold text-indigo-600">
                  {getSignificance(task)}/5
                </div>
              </div>
              <div className="bg-pink-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">ROTI</div>
                <div className="text-lg font-bold text-pink-600">
                  {getROTI(task)}/3
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border-2 border-orange-200">
                <div className="text-xs text-gray-500 mb-1">80/20 Score</div>
                <div className="text-xl font-bold text-orange-600">
                  {get8020Score(task)}
                </div>
              </div>
            </div>
          </div>
          
          {getTaskRemarks(task) && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Remarks & History</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {getTaskRemarks(task)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading delegation tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Tasks</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            <Users className="w-6 h-6 mr-3 text-blue-600" />
            Delegation Tasks
          </h2>
          <p className="text-gray-600">
            Tasks assigned to {currentUser.name} • Sorted by 80/20 Priority Score
            {lastRefresh && (
              <span className="text-sm text-gray-500 ml-2">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button 
  onClick={refresh}
  disabled={isRefreshing}
  className={`p-2 text-white rounded-lg transition-colors flex items-center space-x-2 ${
    isRefreshing 
      ? 'bg-gray-400 cursor-not-allowed' 
      : 'bg-green-600 hover:bg-green-700'
  }`}
  title={isRefreshing ? "Refreshing..." : "Refresh"}
>
  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
  <span className="text-sm">
    {isRefreshing ? 'Refreshing...' : 'Refresh'}
  </span>
</button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">High Priority</p>
              <p className="text-sm text-gray-400">(50+ Score)</p>
              <p className="text-2xl font-bold text-orange-600">{stats.highPriority}</p>
            </div>
            <Star className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Hold</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.hold}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
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
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="hold">Hold</option>
            <option value="completed">Completed</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent (75-100)</option>
            <option value="high">High (50-75)</option>
            <option value="medium">Medium (25-50)</option>
            <option value="low">Low (0-25)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="80_20">Sort by 80/20 Score</option>
            <option value="ease">Sort by Ease to Implement</option>
            <option value="impact">Sort by Relative Impact</option>
            <option value="urgency">Sort by Urgency</option>
            <option value="importance">Sort by Importance</option>
            <option value="roti">Sort by ROTI</option>
            <option value="date">Sort by Date</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </button>

          <button
            onClick={copyTasksToClipboard}
            className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors ${
              isCopied
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            disabled={isCopied}
          >
            <Copy className="w-4 h-4" />
            <span>{isCopied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center p-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Found</h3>
            <p className="text-gray-600">
              {tasks.length === 0 
                ? `No delegation tasks assigned to ${currentUser.name}`
                : 'No tasks match your current filters'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedTasks.map((task, index) => (
              <div 
                key={index} 
                className={`p-4 hover:bg-blue-50 cursor-pointer border-l-4 transition-colors ${getPriorityColor(getTaskPriority(task))}`}
                onClick={() => {
                  setSelectedTask(task);
                  setShowModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center space-x-3 mb-2 flex-wrap">
                      <h4 className="font-medium text-gray-900 break-words flex-1 min-w-0">
                        {getTaskTitle(task)}
                      </h4>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(getTaskPriority(task))}`}>
                          {getShortPriorityLabel(getTaskPriority(task))}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getTaskStatus(task))}`}>
                          {getTaskStatus(task)}
                        </span>
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                          80/20: {get8020Score(task)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2 flex-wrap">
                      <span className="flex items-center">
                        <Building2 className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{getTaskCompany(task)}</span>
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{getTaskDate(task)}</span>
                      </span>
                      {getDueDate(task) && (
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">Due: {getDueDate(task)}</span>
                        </span>
                      )}
                    </div>

                    {/* Priority Metrics Row */}
                    <div className="flex items-center space-x-4 text-xs text-gray-600 flex-wrap gap-y-1">
                      <span className="flex items-center">
                        <Zap className="w-3 h-3 mr-1 text-blue-500 flex-shrink-0" />
                        Ease: {getEaseToImplement(task)}/10
                      </span>
                      <span className="flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1 text-green-500 flex-shrink-0" />
                        Impact: {getRelativeImpact(task)}/10
                      </span>
                      <span className="flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1 text-red-500 flex-shrink-0" />
                        Urgency: {getUrgency(task)}/5
                      </span>
                      <span className="flex items-center">
                        <Star className="w-3 h-3 mr-1 text-purple-500 flex-shrink-0" />
                        Importance: {getImportance(task)}/5
                      </span>
                      <span className="flex items-center">
                        <Award className="w-3 h-3 mr-1 text-pink-500 flex-shrink-0" />
                        ROTI: {getROTI(task)}/3
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {getSubmissionLink(task) && (
                      <ExternalLink className="w-4 h-4 text-blue-500" />
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
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

export default DelegationTasks;
