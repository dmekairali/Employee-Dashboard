import React, { useState, useCallback } from 'react';
import { 
  UserPlus, 
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
  UserCheck,
  UserX
} from 'lucide-react';
import { useCachedData } from '../hooks/useCachedData';

const HTTasks = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMainTab, setSelectedMainTab] = useState('raisedOnYou'); // 'raisedOnYou' or 'raisedByYou'
  const [selectedSubTab, setSelectedSubTab] = useState('replyPending'); // Changed default
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch function for HT data
  const fetchHTData = useCallback(async () => {
    try {
      const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_HT;
      const sheetName = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_HT;
      
      const apiUrl = '/api/sheets';
      const params = new URLSearchParams({
        sheetId: spreadsheetId,
        sheetName: sheetName,
        range: 'A10:AZ' // Starting from row 10 as header
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
      
      // Process data rows (skip header)
      const htTasks = rows.slice(1)
        .filter(row => row && row.length > 0) // Filter out empty rows
        .map((row, index) => {
          const task = {};
          
          // Map each column to its header with direct column access
          headers.forEach((header, colIndex) => {
            if (header && row[colIndex] !== undefined) {
              const key = cleanHeaderName(header);
              task[key] = row[colIndex];
            }
          });

          // Add direct column access for reliability
          task.ticketId = row[0] || '';
          task.timestamp = row[1] || '';
          task.name = row[2] || '';
          task.emailId = row[3] || '';
          task.department = row[4] || '';
          task.challengeIssue = row[5] || '';
          task.challengeLevel = row[6] || '';
          task.issueDelegatedTo = row[7] || ''; // Column 8 (index 7)
          task.delegatedPersonEmail = row[8] || '';
          task.solution1 = row[9] || '';
          task.solution2 = row[10] || '';
          task.solution3 = row[11] || '';
          task.attachment = row[12] || ''; // Column 13 (index 12)
          
          task.problemSolvingLink = row[14] || ''; // Column 14 (index 13)
          task.replyLink = row[14] || ''; // Column 14 (index 14)
          task.newLink = row[14] || '';
          
          task.replyPlanned = row[18] || '';  // Column 19 (index 18)
          task.replyActual = row[19] || '';   // Column 20 (index 19)
          task.replyTimeDelay = row[20] || '';
          task.resolveTicketId = row[21] || '';
          task.resolveRaisedBy = row[22] || '';
          task.resolveAssignedTo = row[23] || '';
          task.recommendation = row[24] || ''; // Column 25 (index 24)
          task.resolveAttachment = row[25] || '';
          task.resolveTimestamp = row[26] || '';
          task.resolvePlanned = row[27] || '';  // Column 28 (index 27)
          task.resolveActual = row[28] || '';   // Column 29 (index 28)
          task.resolveTimeDelay = row[29] || '';
          task.resolveLink = row[30] || ''; // Column 31 (index 30)
          task.finalTicketId = row[31] || '';
          task.finalDoer = row[32] || '';
          task.problemResolved = row[33] || '';
          task.remarks = row[34] || '';
          task.finalTimestamp = row[35] || '';

          // Add computed fields
          task.id = index + 1;
          task.rowNumber = index + 11; // Actual row number in sheet (10 for header + index)
          
          return task;
        });

      return htTasks;
    } catch (error) {
      console.error('Error fetching HT data:', error);
      throw error;
    }
  }, []);

  // Use cached data hook
  const { data: allTasks, loading, error, refresh: originalRefresh, lastRefresh } = useCachedData(
  'ht', 
  currentUser, 
  fetchHTData
);


// Add local loading state for manual refresh
const [isManualRefreshing, setIsManualRefreshing] = useState(false);

// Enhanced refresh function that ensures fresh data from server  
const refresh = useCallback(async () => {
  console.log(`🔄 Force refreshing HT data for ${currentUser.name} - fetching fresh from server...`);
  
  setIsManualRefreshing(true);
  
  try {
    // Import dataManager to clear cache first
    const { default: dataManager } = await import('../utils/DataManager');
    
    // Clear the specific cache entry to force fresh fetch
    const cacheKey = `ht_${currentUser.name}`;
    dataManager.cache.delete(cacheKey);
    console.log(`🗑️ Cleared cache for ${cacheKey}`);
    
    // Directly call the fetch function to get fresh data from server
    const freshData = await fetchHTData();
    
    // Update cache with fresh data
    dataManager.setData('ht', currentUser.name, freshData);
    
    console.log(`✅ Successfully refreshed HT data: ${freshData.length} tasks`);
    return freshData;
  } catch (error) {
    console.error('❌ Error during manual refresh:', error);
    throw error;
  } finally {
    setIsManualRefreshing(false);
  }
}, [fetchHTData, currentUser.name]);

// Combined loading state
const isRefreshing = loading || isManualRefreshing;
  
  const cleanHeaderName = (header) => {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  // Filter tasks based on main tab
  const getTasksForMainTab = () => {
    if (selectedMainTab === 'raisedOnYou') {
      // HT Raised On You = column 8 (Issue Delegated to) is equal to user logged in
      return allTasks.filter(task => task.issueDelegatedTo === currentUser.name);
    } else {
      // HT Raised By You = column 3 (Name) is equal to user logged in
      return allTasks.filter(task => task.name === currentUser.name);
    }
  };

  // Get sub tabs based on main tab
  const getSubTabs = () => {
    if (selectedMainTab === 'raisedOnYou') {
      return [
        { key: 'replyPending', label: 'Reply Pending' },
        { key: 'replyCompleted', label: 'Reply Completed' }
      ];
    } else {
      return [
        { key: 'resolvePending', label: 'Resolve Pending' },
        { key: 'replyPending', label: 'Reply Pending By Others' },
        { key: 'completed', label: 'Completed' }
      ];
    }
  };

  // Filter tasks based on sub tab
  const getFilteredTasks = () => {
    let filteredTasks = getTasksForMainTab();

    // Apply search filter
    if (searchTerm) {
      filteredTasks = filteredTasks.filter(task =>
        task.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.challengeIssue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sub tab filter
    if (selectedMainTab === 'raisedOnYou') {
      if (selectedSubTab === 'replyPending') {
        // Reply Pending = column 19(Planned) is not null and Column 20(Actual) is null
        // BUT if no planned time is set, we should still show the task as pending
        filteredTasks = filteredTasks.filter(task => 
          (!task.replyActual || task.replyActual.trim() === '')
        );
      } else if (selectedSubTab === 'replyCompleted') {
        // Reply Completed = Column 20(Actual) is not null
        filteredTasks = filteredTasks.filter(task => 
          task.replyActual && task.replyActual.trim() !== ''
        );
      }
    } else {
      if (selectedSubTab === 'replyPending') {
        // Reply Pending = column 19(Planned) is not null and Column 20(Actual) is null
        filteredTasks = filteredTasks.filter(task => 
          task.replyPlanned && task.replyPlanned.trim() !== '' && 
          (!task.replyActual || task.replyActual.trim() === '')
        );
      } else if (selectedSubTab === 'resolvePending') {
        // Resolve Pending = column 28(Planned) is not null and Column 29(Actual) is null
        filteredTasks = filteredTasks.filter(task => 
          task.resolvePlanned && task.resolvePlanned.trim() !== '' && 
          (!task.resolveActual || task.resolveActual.trim() === '')
        );
      } else if (selectedSubTab === 'completed') {
        // Completed = both reply and resolve are completed
        filteredTasks = filteredTasks.filter(task => 
          task.replyActual && task.replyActual.trim() !== '' &&
          task.resolveActual && task.resolveActual.trim() !== ''
        );
      }
    }

    return filteredTasks;
  };

  const getPriorityColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'HIGH': return 'border-l-red-500 bg-white';
      case 'MEDIUM': return 'border-l-yellow-500 bg-white';
      case 'LOW': return 'border-l-green-500 bg-white';
      default: return 'border-l-gray-500 bg-white';
    }
  };

  const getPriorityBadge = (level) => {
    switch (level?.toUpperCase()) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get the appropriate link for the task
  const getTaskLink = (task) => {
    if (selectedMainTab === 'raisedOnYou') {
      if (selectedSubTab === 'replyPending') {
        // Show Problem Solving Link (column 15)
        return task.problemSolvingLink;
      }
      // For reply completed, no link needed
      return null;
    } else {
      if (selectedSubTab === 'replyPending') {
        // For HT Raised By You - Reply Pending By Others, no link shown (waiting for others to reply)
        return null;
      } else if (selectedSubTab === 'resolvePending') {
        // Show Resolve Link (column 31)
        return task.resolveLink;
      } else if (selectedSubTab === 'completed') {
        // For completed tasks, no link needed
        return null;
      }
      return null;
    }
  };

  // Calculate statistics
  const getStats = () => {
    const raisedOnYouTasks = allTasks.filter(task => task.issueDelegatedTo === currentUser.name);
    const raisedByYouTasks = allTasks.filter(task => task.name === currentUser.name);

    // For HT Raised On You
    const raisedOnYouReplyPending = raisedOnYouTasks.filter(task => 
      (!task.replyActual || task.replyActual.trim() === '')
    ).length;

    const raisedOnYouReplyCompleted = raisedOnYouTasks.filter(task => 
      task.replyActual && task.replyActual.trim() !== ''
    ).length;

    // For HT Raised By You
    const raisedByYouReplyPending = raisedByYouTasks.filter(task => 
      task.replyPlanned && task.replyPlanned.trim() !== '' && 
      (!task.replyActual || task.replyActual.trim() === '')
    ).length;

    const raisedByYouResolvePending = raisedByYouTasks.filter(task => 
      task.resolvePlanned && task.resolvePlanned.trim() !== '' && 
      (!task.resolveActual || task.resolveActual.trim() === '')
    ).length;

    const raisedByYouCompleted = raisedByYouTasks.filter(task => 
      task.replyActual && task.replyActual.trim() !== '' &&
      task.resolveActual && task.resolveActual.trim() !== ''
    ).length;

    // Calculate average delay for completed replies (planned vs actual)
    const calculateAvgDelayReplied = () => {
      const completedReplyTasks = raisedOnYouTasks.filter(task => 
        task.replyPlanned && task.replyPlanned.trim() !== '' &&
        task.replyActual && task.replyActual.trim() !== ''
      );

      if (completedReplyTasks.length === 0) return '--';

      let totalDelayHours = 0;
      let validDelays = 0;

      completedReplyTasks.forEach(task => {
        try {
          const planned = new Date(task.replyPlanned);
          const actual = new Date(task.replyActual);
          
          if (!isNaN(planned.getTime()) && !isNaN(actual.getTime())) {
            const delayMs = actual.getTime() - planned.getTime();
            const delayHours = delayMs / (1000 * 60 * 60); // Convert to hours
            totalDelayHours += delayHours;
            validDelays++;
          }
        } catch (error) {
          // Skip invalid date formats
        }
      });

      if (validDelays === 0) return '--';
      
      const avgHours = totalDelayHours / validDelays;
      const hours = Math.floor(Math.abs(avgHours));
      const minutes = Math.floor((Math.abs(avgHours) - hours) * 60);
      const sign = avgHours < 0 ? '-' : '';
      
      return `${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
    };

    // Calculate average delay for pending replies (planned vs now)
    const calculateAvgDelayPending = () => {
      const pendingReplyTasks = raisedOnYouTasks.filter(task => 
        task.replyPlanned && task.replyPlanned.trim() !== '' &&
        (!task.replyActual || task.replyActual.trim() === '')
      );

      if (pendingReplyTasks.length === 0) return '--';

      let totalDelayHours = 0;
      let validDelays = 0;
      const now = new Date();

      pendingReplyTasks.forEach(task => {
        try {
          const planned = new Date(task.replyPlanned);
          
          if (!isNaN(planned.getTime()) && planned.getTime() < now.getTime()) {
            const delayMs = now.getTime() - planned.getTime();
            const delayHours = delayMs / (1000 * 60 * 60); // Convert to hours
            totalDelayHours += delayHours;
            validDelays++;
          }
        } catch (error) {
          // Skip invalid date formats
        }
      });

      if (validDelays === 0) return '--';
      
      const avgHours = totalDelayHours / validDelays;
      const hours = Math.floor(avgHours);
      const minutes = Math.floor((avgHours - hours) * 60);
      
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    };

    const avgDelayReplied = calculateAvgDelayReplied();
    const avgDelayPending = calculateAvgDelayPending();

    return {
      raisedOnYou: raisedOnYouTasks.length,
      raisedByYou: raisedByYouTasks.length,
      raisedOnYouReplyPending,
      raisedOnYouReplyCompleted,
      raisedByYouReplyPending,
      raisedByYouResolvePending,
      raisedByYouCompleted,
      avgDelayReplied,
      avgDelayPending
    };
  };

  const filteredTasks = getFilteredTasks();
  const stats = getStats();
  const subTabs = getSubTabs();

  // Get counts for current sub-tab
  const getCurrentSubTabCount = () => {
    if (selectedMainTab === 'raisedOnYou') {
      if (selectedSubTab === 'replyPending') {
        return stats.raisedOnYouReplyPending;
      } else if (selectedSubTab === 'replyCompleted') {
        return stats.raisedOnYouReplyCompleted;
      }
    } else {
      if (selectedSubTab === 'replyPending') {
        return stats.raisedByYouReplyPending;
      } else if (selectedSubTab === 'resolvePending') {
        return stats.raisedByYouResolvePending;
      } else if (selectedSubTab === 'completed') {
        return stats.raisedByYouCompleted;
      }
    }
    return 0;
  };

  const TaskModal = ({ task, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">HT Task Details - {task.ticketId}</h3>
            <div className="flex items-center space-x-3">
              {/* Only show links if not in "Reply Pending By Others" mode */}
              {!(selectedMainTab === 'raisedByYou' && selectedSubTab === 'replyPending') && 
               (task.problemSolvingLink || task.resolveLink) && (
                <div className="flex items-center space-x-2">
                  {task.problemSolvingLink && selectedMainTab === 'raisedOnYou' && (
                    <a 
                      href={task.problemSolvingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                    >
                      <Link className="w-4 h-4" />
                      <span>Reply Link</span>
                    </a>
                  )}
                  {task.resolveLink && selectedMainTab === 'raisedByYou' && selectedSubTab === 'resolvePending' && (
                    <a 
                      href={task.resolveLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-1"
                    >
                      <Link className="w-4 h-4" />
                      <span>Resolve Link</span>
                    </a>
                  )}
                </div>
              )}
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Challenge/Issue</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {task.challengeIssue}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Solutions</h4>
            <div className="space-y-2">
              {task.solution1 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">Solution 1 (Best Choice):</p>
                  <p className="text-sm text-blue-800">{task.solution1}</p>
                </div>
              )}
              {task.solution2 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-green-900">Solution 2:</p>
                  <p className="text-sm text-green-800">{task.solution2}</p>
                </div>
              )}
              {task.solution3 && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900">Solution 3:</p>
                  <p className="text-sm text-yellow-800">{task.solution3}</p>
                </div>
              )}
            </div>
          </div>

          {task.recommendation && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recommendation/Solution</h4>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">{task.recommendation}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Ticket Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Ticket ID</label>
                  <p className="font-medium">{task.ticketId}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Raised By</label>
                  <p>{task.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p>{task.emailId}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Department</label>
                  <p>{task.department}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Priority Level</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.challengeLevel)}`}>
                    {task.challengeLevel}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Timestamp</label>
                  <p>{task.timestamp}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Assignment Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Delegated To</label>
                  <p className="font-medium">{task.issueDelegatedTo}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Delegated Email</label>
                  <p>{task.delegatedPersonEmail}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Reply Planned</label>
                  <p>{task.replyPlanned || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Reply Actual</label>
                  <p>{task.replyActual || 'Not completed'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Resolve Planned</label>
                  <p>{task.resolvePlanned || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Resolve Actual</label>
                  <p>{task.resolveActual || 'Not completed'}</p>
                </div>
              </div>
            </div>
          </div>

          {task.attachment && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Attachment (If Any)</h4>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">{task.attachment}</p>
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
        <span className="ml-2 text-gray-600">Loading HT tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading HT Tasks</h3>
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
            <UserPlus className="w-6 h-6 mr-3 text-blue-600" />
            Help Tickets
          </h2>
          <p className="text-gray-600">
            Manage your help tickets
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
              <p className="text-sm text-gray-500">HT Raised On You</p>
              <p className="text-2xl font-bold text-blue-600">{stats.raisedOnYou}</p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">HT Raised By You</p>
              <p className="text-2xl font-bold text-green-600">{stats.raisedByYou}</p>
            </div>
            <UserX className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Your Reply Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.raisedOnYouReplyPending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolve Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.raisedByYouResolvePending}</p>
            </div>
            <Timer className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">AVG Delay Replied</p>
              <p className="text-2xl font-bold text-green-600">{stats.avgDelayReplied}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">AVG Delay Pending</p>
              <p className="text-2xl font-bold text-red-600">{stats.avgDelayPending}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => {
                setSelectedMainTab('raisedOnYou');
                setSelectedSubTab('replyPending');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedMainTab === 'raisedOnYou'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              HT Raised On You ({stats.raisedOnYou})
            </button>
            <button
              onClick={() => {
                setSelectedMainTab('raisedByYou');
                setSelectedSubTab('replyPending');
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedMainTab === 'raisedByYou'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              HT Raised By You ({stats.raisedByYou})
            </button>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {subTabs.map((tab) => {
              let tabCount = 0;
              if (selectedMainTab === 'raisedOnYou') {
                if (tab.key === 'replyPending') tabCount = stats.raisedOnYouReplyPending;
                else if (tab.key === 'replyCompleted') tabCount = stats.raisedOnYouReplyCompleted;
              } else {
                if (tab.key === 'replyPending') tabCount = stats.raisedByYouReplyPending;
                else if (tab.key === 'resolvePending') tabCount = stats.raisedByYouResolvePending;
                else if (tab.key === 'completed') tabCount = stats.raisedByYouCompleted;
              }

              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedSubTab(tab.key)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    selectedSubTab === tab.key
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label} ({tabCount})
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {filteredTasks.length === 0 ? (
          <div className="text-center p-8">
            <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Found</h3>
            <p className="text-gray-600">
              {getTasksForMainTab().length === 0 
                ? `No help tickets found in "${selectedMainTab === 'raisedOnYou' ? 'HT Raised On You' : 'HT Raised By You'}"`
                : `No tasks found for the selected filters`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTasks.map((task, index) => {
              const taskLink = getTaskLink(task);
              return (
                <div 
                  key={index} 
                  className={`p-4 hover:bg-blue-50 cursor-pointer border-l-4 ${getPriorityColor(task.challengeLevel)}`}
                  onClick={() => {
                    setSelectedTask(task);
                    setShowModal(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{task.ticketId}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.challengeLevel)}`}>
                          {task.challengeLevel}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedMainTab === 'raisedOnYou' ? 'Assigned to You' : 'Raised by You'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {task.challengeIssue}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {selectedMainTab === 'raisedOnYou' ? `From: ${task.name}` : `To: ${task.issueDelegatedTo}`}
                        </span>
                        <span className="flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          {task.department}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {task.timestamp}
                        </span>
                        {selectedSubTab === 'replyPending' && task.replyPlanned && (
                          <span className="flex items-center text-yellow-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Reply Due: {task.replyPlanned}
                          </span>
                        )}
                        {selectedSubTab === 'resolvePending' && task.resolvePlanned && (
                          <span className="flex items-center text-purple-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Resolve Due: {task.resolvePlanned}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {taskLink && taskLink.trim() !== '' && (
                        <a 
                          href={taskLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                          onClick={(e) => e.stopPropagation()}
                          title={selectedSubTab === 'replyPending' && selectedMainTab === 'raisedOnYou' ? 'Problem Solving Link' : 'Resolve Link'}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{selectedSubTab === 'replyPending' && selectedMainTab === 'raisedOnYou' ? 'Reply' : 'Resolve'}</span>
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

export default HTTasks;
