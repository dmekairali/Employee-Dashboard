import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  const [selectedSubTab, setSelectedSubTab] = useState('replyPending');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // 🎨 ROW COLOR MANAGEMENT STATE
  const [clickedReplyRows, setClickedReplyRows] = useState(new Set());
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  // Clean header name function
  const cleanHeaderName = (header) => {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  // Fetch function for HT data
  const fetchHTData = useCallback(async () => {
    try {
      const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_HT;
      const sheetName = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_HT;
      
      const apiUrl = '/api/sheets';
      const params = new URLSearchParams({
        sheetId: spreadsheetId,
        sheetName: sheetName,
        range: 'A10:AZ' // You might want to limit this to A10:AZ1000 for performance
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
      
      // Process and filter by user at fetch level
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
          task.attachment = row[12] || '';
          task.problemSolvingLink = row[14] || '';
          task.replyLink = row[14] || '';
          task.newLink = row[14] || '';
          task.replyPlanned = row[18] || '';
          task.replyActual = row[19] || '';
          task.replyTimeDelay = row[20] || '';
          task.resolveTicketId = row[21] || '';
          task.resolveRaisedBy = row[22] || '';
          task.resolveAssignedTo = row[23] || '';
          task.recommendation = row[24] || '';
          task.resolveAttachment = row[25] || '';
          task.resolveTimestamp = row[26] || '';
          task.resolvePlanned = row[27] || '';
          task.resolveActual = row[28] || '';
          task.resolveTimeDelay = row[29] || '';
          task.resolveLink = row[30] || '';
          task.finalTicketId = row[31] || '';
          task.finalDoer = row[32] || '';
          task.problemResolved = row[33] || '';
          task.remarks = row[34] || '';
          task.finalTimestamp = row[35] || '';

          // Add computed fields
          task.id = index + 1;
          task.rowNumber = index + 11;
          
          return task;
        })
        // Filter by user here at fetch level
        .filter(task => {
          // Filter for tasks relevant to current user
          const isRaisedByUser = task.name === currentUser.name;
          const isDelegatedToUser = task.issueDelegatedTo === currentUser.name;
          const isAssignedToUser = task.resolveAssignedTo === currentUser.name;
          
          // Only include tasks that are relevant to this user
          return isRaisedByUser || isDelegatedToUser || isAssignedToUser;
        })
        // Additional filtering: Remove truly empty tasks
        .filter(task => {
          // Ensure task has at least basic data
          return task.ticketId || task.challengeIssue || task.name;
        });

      console.log(`✅ HT Data filtered for ${currentUser.name}: ${htTasks.length} relevant tasks out of ${rows.length - 1} total rows`);
      return htTasks;
      
    } catch (error) {
      console.error('Error fetching HT data:', error);
      throw error;
    }
  }, [currentUser.name]);

  // Use cached data hook
  const { data: allTasks, loading, error, refresh: originalRefresh, lastRefresh } = useCachedData(
    'ht', 
    currentUser, 
    fetchHTData
  );

  // Add local loading state for manual refresh
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // 🎨 TRACK WHEN DATA REFRESHES TO CLEAR CLICKED STATES
  useEffect(() => {
    if (lastRefresh && lastRefresh !== lastRefreshTime) {
      console.log('🔄 Data refreshed, clearing clicked reply states');
      setClickedReplyRows(new Set());
      setLastRefreshTime(lastRefresh);
    }
  }, [lastRefresh, lastRefreshTime]);

  // Enhanced refresh function that ensures fresh data from server and clears clicked states
  const refresh = useCallback(async () => {
    console.log(`🔄 Force refreshing HT data for ${currentUser.name} - clearing clicked states...`);
    
    // Clear clicked states immediately when refresh starts
    setClickedReplyRows(new Set());
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
      setLastRefreshTime(Date.now());
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

  // 🎨 HANDLE REPLY BUTTON CLICK
  const handleReplyClick = useCallback((taskId, task) => {
    console.log(`🎨 Reply clicked for task ${taskId}`);
    setClickedReplyRows(prev => {
      const newSet = new Set(prev);
      newSet.add(taskId);
      return newSet;
    });
    
    // Open Google Form or reply link if available
    const replyLink = task.replyLink || task.newLink || task.problemSolvingLink;
    if (replyLink && replyLink.trim() !== '') {
      window.open(replyLink, '_blank');
    } else {
      // You can add your Google Form URL here
      // const googleFormUrl = `https://forms.google.com/your-form?taskId=${taskId}`;
      // window.open(googleFormUrl, '_blank');
      console.log('No reply link available for this task');
    }
  }, []);

  // 🎨 GET ROW CLASSNAME BASED ON STATE - CHANGE CLICKED TO GREEN
  const getRowClassName = useCallback((task) => {
    const baseClass = "p-4 hover:bg-blue-50 cursor-pointer border-l-4"; // Keep original hover color
    
    // Only change when reply is clicked (GREEN background instead of blue)
    if (clickedReplyRows.has(task.id) && (!task.replyActual || task.replyActual.trim() === '')) {
      return `${baseClass} bg-green-50 border-green-500`;
    }
    
    // Keep original priority colors and styling
    return `${baseClass} ${getPriorityColor(task.challengeLevel)}`;
  }, [clickedReplyRows]);

  // Filter tasks based on main tab
  const getTasksForMainTab = () => {
    let tasks;
    if (selectedMainTab === 'raisedOnYou') {
      tasks = allTasks.filter(task => task.issueDelegatedTo === currentUser.name);
    } else {
      tasks = allTasks.filter(task => task.name === currentUser.name);
    }
    
    // Sort by timestamp descending
    return tasks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
        filteredTasks = filteredTasks.filter(task => 
          (!task.replyActual || task.replyActual.trim() === '')
        );
      } else if (selectedSubTab === 'replyCompleted') {
        filteredTasks = filteredTasks.filter(task => 
          task.replyActual && task.replyActual.trim() !== ''
        );
      }
    } else {
      if (selectedSubTab === 'replyPending') {
        filteredTasks = filteredTasks.filter(task => 
          task.replyPlanned && task.replyPlanned.trim() !== '' && 
          (!task.replyActual || task.replyActual.trim() === '')
        );
      } else if (selectedSubTab === 'resolvePending') {
        filteredTasks = filteredTasks.filter(task => 
          task.resolvePlanned && task.resolvePlanned.trim() !== '' && 
          (!task.resolveActual || task.resolveActual.trim() === '')
        );
      } else if (selectedSubTab === 'completed') {
        filteredTasks = filteredTasks.filter(task => 
          task.replyActual && task.replyActual.trim() !== '' &&
          task.resolveActual && task.resolveActual.trim() !== ''
        );
      }
    }

    return filteredTasks;
  };

  const filteredTasks = getFilteredTasks();

  // Helper functions for styling - KEEP ORIGINAL
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

  const getTaskLink = (task) => {
    return task.replyLink || task.newLink || task.problemSolvingLink || '#';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Task detail modal - RESTORE ORIGINAL COMPLETE STRUCTURE
  const TaskDetailModal = ({ task, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">HT Task Details - {task.ticketId}</h3>
            <div className="flex items-center space-x-3">
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
                  <label className="text-sm text-gray-500">Challenge Level</label>
                  <span className={`px-2 py-1 rounded text-xs ${getPriorityBadge(task.challengeLevel)}`}>
                    {task.challengeLevel}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Delegated To</label>
                  <p>{task.issueDelegatedTo}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Delegated Email</label>
                  <p>{task.delegatedPersonEmail}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Timeline</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Timestamp</label>
                  <p>{formatDate(task.timestamp)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Reply Planned</label>
                  <p>{formatDate(task.replyPlanned)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Reply Actual</label>
                  <p>{formatDate(task.replyActual)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Reply Time Delay</label>
                  <p>{task.replyTimeDelay}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Resolve Planned</label>
                  <p>{formatDate(task.resolvePlanned)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Resolve Actual</label>
                  <p>{formatDate(task.resolveActual)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Resolve Time Delay</label>
                  <p>{task.resolveTimeDelay}</p>
                </div>
              </div>
            </div>
          </div>

          {task.attachment && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Attachment</h4>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">{task.attachment}</p>
              </div>
            </div>
          )}

          {(task.resolveAttachment || task.finalTicketId || task.finalDoer || task.problemResolved || task.remarks) && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Resolution Details</h4>
              <div className="space-y-3">
                {task.resolveAttachment && (
                  <div>
                    <label className="text-sm text-gray-500">Resolve Attachment</label>
                    <p>{task.resolveAttachment}</p>
                  </div>
                )}
                {task.finalTicketId && (
                  <div>
                    <label className="text-sm text-gray-500">Final Ticket ID</label>
                    <p>{task.finalTicketId}</p>
                  </div>
                )}
                {task.finalDoer && (
                  <div>
                    <label className="text-sm text-gray-500">Final Doer</label>
                    <p>{task.finalDoer}</p>
                  </div>
                )}
                {task.problemResolved && (
                  <div>
                    <label className="text-sm text-gray-500">Problem Resolved</label>
                    <p>{task.problemResolved}</p>
                  </div>
                )}
                {task.remarks && (
                  <div>
                    <label className="text-sm text-gray-500">Remarks</label>
                    <p>{task.remarks}</p>
                  </div>
                )}
                {task.finalTimestamp && (
                  <div>
                    <label className="text-sm text-gray-500">Final Timestamp</label>
                    <p>{formatDate(task.finalTimestamp)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🎨 ADD REPLY BUTTON - ONLY NEW ADDITION */}
          {task.issueDelegatedTo === currentUser.name && 
           (!task.replyActual || task.replyActual.trim() === '') && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">Action Required</h4>
                  <p className="text-sm text-gray-600">This task is waiting for your reply</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReplyClick(task.id, task);
                    onClose(); // Close modal after clicking reply
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    clickedReplyRows.has(task.id)
                      ? 'bg-green-500 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  disabled={clickedReplyRows.has(task.id)}
                >
                  {clickedReplyRows.has(task.id) ? 'Reply Clicked ✓' : 'Submit Reply'}
                </button>
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



      {/* Tabs and Controls */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Main Tab Navigation */}
        <div className="border-b border-gray-200 px-4 pt-4">
          <div className="flex space-x-8">
            {[
              { key: 'raisedOnYou', label: 'HT Raised On You' },
              { key: 'raisedByYou', label: 'HT Raised By You' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setSelectedMainTab(tab.key);
                  setSelectedSubTab(getSubTabs()[0]?.key || 'replyPending');
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedMainTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub Tab Navigation */}
        <div className="border-b border-gray-200 px-4">
          <div className="flex space-x-6">
            {getSubTabs().map(tab => {
              const tabTasks = getTasksForMainTab();
              let tabCount = 0;
              
              if (selectedMainTab === 'raisedOnYou') {
                if (tab.key === 'replyPending') {
                  tabCount = tabTasks.filter(task => 
                    !task.replyActual || task.replyActual.trim() === ''
                  ).length;
                } else if (tab.key === 'replyCompleted') {
                  tabCount = tabTasks.filter(task => 
                    task.replyActual && task.replyActual.trim() !== ''
                  ).length;
                }
              } else {
                if (tab.key === 'replyPending') {
                  tabCount = tabTasks.filter(task => 
                    task.replyPlanned && task.replyPlanned.trim() !== '' && 
                    (!task.replyActual || task.replyActual.trim() === '')
                  ).length;
                } else if (tab.key === 'resolvePending') {
                  tabCount = tabTasks.filter(task => 
                    task.resolvePlanned && task.resolvePlanned.trim() !== '' && 
                    (!task.resolveActual || task.resolveActual.trim() === '')
                  ).length;
                } else if (tab.key === 'completed') {
                  tabCount = tabTasks.filter(task => 
                    task.replyActual && task.replyActual.trim() !== '' &&
                    task.resolveActual && task.resolveActual.trim() !== ''
                  ).length;
                }
              }

              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedSubTab(tab.key)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    selectedSubTab === tab.key
                      ? tab.key === 'replyPending' ? 'border-red-500 text-red-600'
                      : tab.key === 'replyCompleted' ? 'border-green-500 text-green-600'
                      : 'border-yellow-500 text-yellow-600'
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
              const rowClassName = getRowClassName(task);
              
              return (
                <div 
                  key={index} 
                  className={rowClassName}
                  onClick={() => {
                    setSelectedTask(task);
                    setShowModal(true);}}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{task.ticketId}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.challengeLevel)}`}>
                          {task.challengeLevel}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedMainTab === 'raisedOnYou' ? 'Delegated to You' : 'Raised by You'}
                        </span>
                        
                        {/* 🎨 COLOR STATUS INDICATOR */}
                        {task.replyActual && task.replyActual.trim() !== '' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Replied
                          </span>
                        )}
                        {clickedReplyRows.has(task.id) && (!task.replyActual || task.replyActual.trim() === '') && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            👆 Reply Clicked
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{task.challengeIssue}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {selectedMainTab === 'raisedOnYou' ? task.name : task.issueDelegatedTo || 'Unassigned'}
                        </span>
                        <span className="flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          {task.department}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(task.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {/* 🎨 REPLY BUTTON WITH COLOR MANAGEMENT */}
                      {selectedMainTab === 'raisedOnYou' && 
                       task.issueDelegatedTo === currentUser.name && 
                       (!task.replyActual || task.replyActual.trim() === '') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReplyClick(task.id, task);
                          }}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            clickedReplyRows.has(task.id)
                              ? 'bg-blue-500 text-white cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          disabled={clickedReplyRows.has(task.id)}
                        >
                          {clickedReplyRows.has(task.id) ? 'Reply Clicked ✓' : 'Reply'}
                        </button>
                      )}
                      
                      {taskLink && taskLink !== '#' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(taskLink, '_blank');
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Open task link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                          setShowModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

     

      {/* Task Detail Modal */}
      {showModal && selectedTask && (
        <TaskDetailModal 
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
