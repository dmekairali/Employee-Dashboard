import React, { useState, useCallback } from 'react';
import { 
  FileText, 
  Calendar, 
  Clock, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle, 
  Search,
  RefreshCw,
  Building2,
  User,
  Link,
  ChevronRight,
  Loader,
  AlertTriangle,
  UserCheck,
  MessageCircle,
  Eye,
  Timer,
  Award
} from 'lucide-react';
import { useCachedData } from '../hooks/useCachedData';

const HSHelpSlip = ({ currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  // ✅ Set default tabs based on user role
  const isDirector_check = 
    (currentUser?.role?.toLowerCase() === 'director') || 
    (currentUser?.department?.toLowerCase() === 'director');
  
  const [selectedMainTab, setSelectedMainTab] = useState(
    isDirector_check ? 'directorTasks' : 'raisedByYou'
  );
  const [selectedSubTab, setSelectedSubTab] = useState('replyPending');

  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch function for HS data
  const fetchHSData = useCallback(async () => {
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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length === 0) {
      return [];
    }

    const headers = rows[0];
    
    const hsTasks = rows.slice(1)
      .filter(row => row && row.length > 0)
      .map((row, index) => {
        const task = {};
        
        headers.forEach((header, colIndex) => {
          if (header && row[colIndex] !== undefined) {
            const key = cleanHeaderName(header);
            task[key] = row[colIndex];
          }
        });

        // Direct column mapping (keep exactly as existing)
        task.helpSlipId = row[0] || '';           // Column 1
        task.timestamp = row[1] || '';            // Column 2  
        task.name = row[2] || '';                 // Column 3
        task.emailId = row[3] || '';              // Column 4
        task.department = row[4] || '';           // Column 5
        task.challengeIssue = row[5] || '';       // Column 6
        task.challengeLevel = row[6] || '';       // Column 7
        task.solution1 = row[7] || '';            // Column 8
        task.solution2 = row[8] || '';            // Column 9
        task.solution3 = row[9] || '';            // Column 10
        task.attachment = row[10] || '';          // Column 11
        task.problemSolvingLink1 = row[11] || ''; // Column 12
        task.problemSolvingLink = row[12] || '';  // Column 13
        task.replyLink = row[13] || '';           // Column 14
        task.newLink = row[14] || '';             // Column 15
        task.replyPlanned = row[18] || '';        // Column 19
        task.replyActual = row[19] || '';         // Column 20
        task.replyTimeDelay = row[20] || '';      // Column 21
        
        // Director Reply Section (keep exactly as existing)
        task.helpSlipId2 = row[18] || '';         // Column 19
        task.raisedBy = row[19] || '';            // Column 20
        task.assignedTo = row[20] || '';          // Column 21
        task.recommendation = row[24] || '';      // Column 25
        task.directorAttachment = row[25] || '';  // Column 26
        task.directorTimestamp = row[26] || '';   // Column 27
        task.acknowledgePlanned = row[27] || '';  // Column 28
        task.acknowledgeActual = row[28] || '';   // Column 29
        task.acknowledgeTimeDelay = row[29] || '';// Column 30
        task.resolveLink = row[30] || '';         // Column 31
        
        // Final Section (keep exactly as existing)
        task.helpSlipId3 = row[28] || '';         // Column 29
        task.doerRaisedBy = row[29] || '';        // Column 30
        task.problemResolved = row[33] || '';     // Column 34
        task.remarks = row[34] || '';             // Column 35
        task.finalTimestamp = row[35] || '';      // Column 36

        task.id = index + 1;
        task.rowNumber = index + 11;
        
        return task;
      })
      // ✅ ONLY NEW ADDITION: Filter by user at fetch level (before caching)
      .filter(task => {
        // Check if user is director (same logic as existing component)
        const isDirector = 
          (currentUser?.role?.toLowerCase() === 'director') || 
          (currentUser?.department?.toLowerCase() === 'director');
        
        if (isDirector) {
          // For directors: NO FILTERING - load all data
          return true;
        } else {
          // For non-directors: load only tasks raised by the user
          return task.name === currentUser.name;
        }
      })
      // ✅ Additional filter: Only include tasks with valid helpSlipId
      .filter(task => {
        return task.helpSlipId && task.helpSlipId.trim() !== '';
      });

    // ✅ Add logging to track filtering effectiveness
    console.log(`✅ HS Data filtered for ${currentUser.name}: ${hsTasks.length} relevant tasks out of ${rows.length - 1} total rows`);

    return hsTasks;
  } catch (error) {
    console.error('Error fetching HS data:', error);
    throw error;
  }
}, [currentUser.name, currentUser.role]); // ✅ Add only relevant user dependencies


  const { data: allTasks, loading, error, refresh:originalRefresh, lastRefresh } = useCachedData(
    'hs', 
    currentUser, 
    fetchHSData
  );
  // Add local loading state for manual refresh
const [isManualRefreshing, setIsManualRefreshing] = useState(false);

// Enhanced refresh function that ensures fresh data from server  
const refresh = useCallback(async () => {
  console.log(`🔄 Force refreshing Help Slip data for ${currentUser.name} - fetching fresh from server...`);
  
  setIsManualRefreshing(true);
  
  try {
    // Import dataManager to clear cache first
    const { default: dataManager } = await import('../utils/DataManager');
    
    // Clear the specific cache entry to force fresh fetch
    const cacheKey = `hs_${currentUser.name}`;
    dataManager.cache.delete(cacheKey);
    console.log(`🗑️ Cleared cache for ${cacheKey}`);
    
    // Directly call the fetch function to get fresh data from server
    const freshData = await fetchHSData();
    
    // Update cache with fresh data
    dataManager.setData('hs', currentUser.name, freshData);
    
    console.log(`✅ Successfully refreshed Help Slip data: ${freshData.length} tasks`);
    return freshData;
  } catch (error) {
    console.error('❌ Error during manual refresh:', error);
    throw error;
  } finally {
    setIsManualRefreshing(false);
  }
}, [fetchHSData, currentUser.name]);

// Combined loading state
const isRefreshing = loading || isManualRefreshing;

  const cleanHeaderName = (header) => {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const isDirector = 
  (currentUser?.role?.toLowerCase() === 'director') || 
  (currentUser?.department?.toLowerCase() === 'director');

  const getTasksForMainTab = () => {  
  let filteredTasks;
  
  if (selectedMainTab === 'raisedByYou') {
    filteredTasks = allTasks.filter(task => task.name === currentUser.name);
  } else if (selectedMainTab === 'directorTasks') {
    // ✅ NEW: Handle director tasks specifically
    filteredTasks = allTasks.filter(task => task.helpSlipId && task.helpSlipId.trim() !== '');
  } else {
    filteredTasks = allTasks.filter(task => task.helpSlipId && task.helpSlipId.trim() !== '');
  }

  // Sort by timestamp in descending order (newest first)
  return filteredTasks.sort((a, b) => {
    // Handle cases where timestamp might be missing or invalid
    const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
    const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
    return dateB - dateA; // Descending order
  });
};

  const getSubTabs = () => {
    if (selectedMainTab === 'raisedByYou') {
      return [
        { key: 'replyPending', label: 'Reply Pending' },
        { key: 'acknowledgePending', label: 'Acknowledge Pending' },
        { key: 'completed', label: 'Completed' }
      ];
    } else if (isDirector) {
      return [
        { key: 'replyPending', label: 'Reply Pending' },
        { key: 'replied', label: 'Replied' }
      ];
    }
    return [];
  };

  const getFilteredTasks = () => {
    let filteredTasks = getTasksForMainTab();

    if (searchTerm) {
      filteredTasks = filteredTasks.filter(task =>
        task.helpSlipId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.challengeIssue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedMainTab === 'raisedByYou') {
      if (selectedSubTab === 'replyPending') {
        // Column 16 (Planned) is not null AND Column 17 (Actual) is null
        filteredTasks = filteredTasks.filter(task => 
          task.replyPlanned && task.replyPlanned.trim() !== '' &&
          (!task.replyActual || task.replyActual.trim() === '')
        );
      } else if (selectedSubTab === 'acknowledgePending') {
        // Column 17 (Actual) is not null AND Column 25 (Planned) is not null AND Column 26 (Actual) is null
        filteredTasks = filteredTasks.filter(task => 
          task.replyActual && task.replyActual.trim() !== '' &&
          task.acknowledgePlanned && task.acknowledgePlanned.trim() !== '' &&
          (!task.acknowledgeActual || task.acknowledgeActual.trim() === '')
        );
      } else if (selectedSubTab === 'completed') {
        // Column 17 (Actual) is not null AND Column 25 (Planned) is not null AND Column 26 (Actual) is not null
        filteredTasks = filteredTasks.filter(task => 
          task.replyActual && task.replyActual.trim() !== '' &&
          task.acknowledgePlanned && task.acknowledgePlanned.trim() !== '' &&
          task.acknowledgeActual && task.acknowledgeActual.trim() !== ''
        );
      }
    } else if (isDirector) {
      if (selectedSubTab === 'replyPending') {
        filteredTasks = filteredTasks.filter(task => 
          (!task.replyActual || task.replyActual.trim() === '')
        );
      } else if (selectedSubTab === 'replied') {
        filteredTasks = filteredTasks.filter(task => 
          task.replyActual && task.replyActual.trim() !== ''
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

  const getTaskLink = (task) => {
    if (selectedMainTab === 'raisedByYou') {
      if (selectedSubTab === 'acknowledgePending') {
        return task.resolveLink;
      }
      return null;
    } else if (isDirector && selectedSubTab === 'replyPending') {
      return task.replyLink;
    }
    return null;
  };

  const getStats = () => {
    const raisedByYouTasks = allTasks.filter(task => task.name === currentUser.name);
    const directorTasks = allTasks.filter(task => task.helpSlipId && task.helpSlipId.trim() !== '');

    const replyPending = raisedByYouTasks.filter(task => 
      task.replyPlanned && task.replyPlanned.trim() !== '' &&
      (!task.replyActual || task.replyActual.trim() === '')
    ).length;

    const acknowledgePending = raisedByYouTasks.filter(task => 
      task.replyActual && task.replyActual.trim() !== '' &&
      task.acknowledgePlanned && task.acknowledgePlanned.trim() !== '' &&
      (!task.acknowledgeActual || task.acknowledgeActual.trim() === '')
    ).length;

    const completed = raisedByYouTasks.filter(task => 
      task.replyActual && task.replyActual.trim() !== '' &&
      task.acknowledgePlanned && task.acknowledgePlanned.trim() !== '' &&
      task.acknowledgeActual && task.acknowledgeActual.trim() !== ''
    ).length;

    const directorReplyPending = directorTasks.filter(task => 
      (!task.replyActual || task.replyActual.trim() === '')
    ).length;

    const directorReplied = directorTasks.filter(task => 
      task.replyActual && task.replyActual.trim() !== ''
    ).length;

    return {
      raisedByYou: raisedByYouTasks.length,
      replyPending,
      acknowledgePending,
      completed,
      directorTasks: directorTasks.length,
      directorReplyPending,
      directorReplied
    };
  };

  const filteredTasks = getFilteredTasks();
  const stats = getStats();
  const subTabs = getSubTabs();

  const TaskModal = ({ task, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">HS Details - {task.helpSlipId}</h3>
            <div className="flex items-center space-x-3">
              {(() => {
                const taskLink = getTaskLink(task);
                if (taskLink && taskLink.trim() !== '') {
                  return (
                    <a 
                      href={taskLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                    >
                      <Link className="w-4 h-4" />
                      <span>
                        {selectedMainTab === 'raisedByYou' && selectedSubTab === 'acknowledgePending' 
                          ? 'Acknowledge' 
                          : 'Reply'}
                      </span>
                    </a>
                  );
                }
                return null;
              })()}
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

          {/* Show recommendation for acknowledge pending and completed */}
          {(selectedSubTab === 'acknowledgePending' || selectedSubTab === 'completed') && task.recommendation && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Director's Recommendation</h4>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-purple-800">{task.recommendation}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Help Slip Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Help Slip ID</label>
                  <p className="font-medium">{task.helpSlipId}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Timestamp</label>
                  <p>{task.timestamp}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p>{task.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email ID</label>
                  <p>{task.emailId}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Department</label>
                  <p>{task.department}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Challenge/Issue Level</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.challengeLevel)}`}>
                    {task.challengeLevel}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Status Information</h4>
              <div className="space-y-3">
                {selectedSubTab === 'replyPending' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500">Reply Planned</label>
                      <p>{task.replyPlanned || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Status</label>
                      <p className="text-yellow-600 font-medium">Pending Director Reply</p>
                    </div>
                  </>
                )}
                {selectedSubTab === 'acknowledgePending' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500">Reply Actual</label>
                      <p>{task.replyActual}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Acknowledge Planned</label>
                      <p>{task.acknowledgePlanned}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Status</label>
                      <p className="text-orange-600 font-medium">Pending Your Acknowledgment</p>
                    </div>
                  </>
                )}
                {selectedSubTab === 'completed' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500">Reply Actual</label>
                      <p>{task.replyActual}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Acknowledge Actual</label>
                      <p>{task.acknowledgeActual}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Status</label>
                      <p className="text-green-600 font-medium">Completed</p>
                    </div>
                  </>
                )}
                {selectedMainTab === 'directorTasks' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500">Reply Planned</label>
                      <p>{task.replyPlanned || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Reply Actual</label>
                      <p>{task.replyActual || 'Not replied'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Acknowledge Planned</label>
                      <p>{task.acknowledgePlanned || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Acknowledge Actual</label>
                      <p>{task.acknowledgeActual || 'Not acknowledged'}</p>
                    </div>
                  </>
                )}
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
        <span className="ml-2 text-gray-600">Loading Help Slips...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Help Slips</h3>
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
            <FileText className="w-6 h-6 mr-3 text-blue-600" />
            Help Slips
          </h2>
          <p className="text-gray-600">
            Manage your help slips - Director communication workflow
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

     {/* Stats Cards - Make them dynamic based on selected tab */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {selectedMainTab === 'raisedByYou' ? (
    // Regular user stats cards
    <>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">HS Raised By You</p>
            <p className="text-2xl font-bold text-blue-600">{stats.raisedByYou}</p>
          </div>
          <FileText className="w-8 h-8 text-blue-500" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Reply Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.replyPending}</p>
          </div>
          <Clock className="w-8 h-8 text-yellow-500" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Acknowledge Pending</p>
            <p className="text-2xl font-bold text-orange-600">{stats.acknowledgePending}</p>
          </div>
          <Eye className="w-8 h-8 text-orange-500" />
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
    </>
  ) : (
    // Director stats cards
    <>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Help Slips</p>
            <p className="text-2xl font-bold text-blue-600">{stats.directorTasks}</p>
          </div>
          <FileText className="w-8 h-8 text-blue-500" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Reply Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.directorReplyPending}</p>
          </div>
          <Clock className="w-8 h-8 text-yellow-500" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Replied</p>
            <p className="text-2xl font-bold text-green-600">{stats.directorReplied}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Completion Rate</p>
            <p className="text-2xl font-bold text-purple-600">
              {stats.directorTasks > 0 ? Math.round((stats.directorReplied / stats.directorTasks) * 100) : 0}%
            </p>
          </div>
          <Award className="w-8 h-8 text-purple-500" />
        </div>
      </div>
    </>
  )}
</div>

      {/* Main Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
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
              HS Raised By You ({stats.raisedByYou})
            </button>
            {isDirector && (
              <button
                onClick={() => {
                  setSelectedMainTab('directorTasks');
                  setSelectedSubTab('replyPending');
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedMainTab === 'directorTasks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Director Tasks ({stats.directorTasks})
              </button>
            )}
          </div>
        </div>

        {/* Sub Tabs */}
        {subTabs.length > 0 && (
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {subTabs.map((tab) => {
                let tabCount = 0;
                if (selectedMainTab === 'raisedByYou') {
                  if (tab.key === 'replyPending') tabCount = stats.replyPending;
                  else if (tab.key === 'acknowledgePending') tabCount = stats.acknowledgePending;
                  else if (tab.key === 'completed') tabCount = stats.completed;
                } else if (selectedMainTab === 'directorTasks') {
                  if (tab.key === 'replyPending') tabCount = stats.directorReplyPending;
                  else if (tab.key === 'replied') tabCount = stats.directorReplied;
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
        )}

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search help slips..."
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
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Help Slips Found</h3>
            <p className="text-gray-600">
              {getTasksForMainTab().length === 0 
                ? `No help slips found in "${selectedMainTab === 'raisedByYou' ? 'HS Raised By You' : 'Director Tasks'}"`
                : `No help slips found for the selected filters`
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
                        <h4 className="font-medium text-gray-900">{task.helpSlipId}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(task.challengeLevel)}`}>
                          {task.challengeLevel}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {selectedMainTab === 'raisedByYou' ? 'Your HS' : 'Director Task'}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {task.challengeIssue}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {selectedMainTab === 'raisedByYou' ? `By: ${task.name}` : `From: ${task.name}`}
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
                        {selectedSubTab === 'acknowledgePending' && task.acknowledgePlanned && (
                          <span className="flex items-center text-orange-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Ack Due: {task.acknowledgePlanned}
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
                          title={selectedMainTab === 'raisedByYou' && selectedSubTab === 'acknowledgePending' ? 'Acknowledge Link' : 'Reply Link'}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>
                            {selectedMainTab === 'raisedByYou' && selectedSubTab === 'acknowledgePending' 
                              ? 'Acknowledge' 
                              : 'Reply'}
                          </span>
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

export default HSHelpSlip;
