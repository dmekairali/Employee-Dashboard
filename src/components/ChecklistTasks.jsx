import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Search, 
  Clock, 
  ExternalLink,
  Calendar,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

const ChecklistTasks = ({ fmsData, currentUser, loading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Helper functions
  const getTaskInfo = (task) => {
    return task.task_info || task.taskinfo || task.what_to_do || '';
  };

  const getWhatToDo = (task) => {
    return task.what_to_do || task.whattodo || '';
  };

  const getDoer = (task) => {
    return task.doer || task.assignedTo || '';
  };

  const getFMSType = (task) => {
    return task.fms || task.fms_type || 'Unknown';
  };

  const getDeadline = (task) => {
    return task.deadline || task.due_date || task.duedate || '';
  };

  const getLink = (task) => {
    return task.link || '';
  };

  // Helper function to get task frequency
  const getFrequency = (task) => {
    return task.frequency || task.freq || '';
  };

  // Helper function to get task ID
  const getTaskId = (task) => {
    return task.task_id || task.taskid || task.id || '';
  };

  // Helper function to get task date
  const getTaskDate = (task) => {
    return task.task_date || task.taskdate || getDeadline(task) || '';
  };

  // Helper function to get planned date
  const getPlanned = (task) => {
    return task.planned || task.planned_date || '';
  };

  // Helper function to calculate delay from planned date
  const calculateDelayFromPlanned = (task) => {
    const plannedDate = getPlanned(task);
    if (!plannedDate) return 0;

    try {
      const planned = new Date(plannedDate);
      const today = new Date();
      
      // Reset time to start of day for accurate day calculation
      today.setHours(0, 0, 0, 0);
      planned.setHours(0, 0, 0, 0);
      
      // Calculate difference in days
      const diffTime = today - planned;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(0, diffDays); // Return 0 if not overdue
    } catch (error) {
      console.error('Error calculating delay from planned date:', error);
      return 0;
    }
  };

  // Helper function to determine if task is for today
  const isTaskForToday = (task) => {
    const taskDate = getTaskDate(task);
    if (!taskDate) return false;
    
    const today = new Date();
    const taskDateObj = new Date(taskDate);
    
    return taskDateObj.toDateString() === today.toDateString();
  };

  // Check if task is overdue - using planned date calculation
  const isTaskOverdue = (task) => {
    const delayInDays = calculateDelayFromPlanned(task);
    return delayInDays > 0; // Any positive number means overdue
  };

  // Filter FMS data to get only checklist tasks assigned to current user as Doer
  const checklistTasks = useMemo(() => {
    if (!Array.isArray(fmsData)) return [];
    
    let filteredTasks = fmsData.filter(task => {
      // First filter: only checklist tasks
      const fmsType = getFMSType(task);
      const isChecklistTask = fmsType.toLowerCase().includes('checklist task');
      
      // Second filter: tasks where current user is the Doer
      const taskDoer = getDoer(task);
      const isUserDoer = taskDoer === currentUser.name;
      
      return isChecklistTask && isUserDoer;
    });

    // Apply search filter
    if (searchTerm) {
      filteredTasks = filteredTasks.filter(task =>
        getTaskInfo(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getWhatToDo(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDoer(task).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredTasks;
  }, [fmsData, currentUser.name, searchTerm]);

  // Group tasks by Today and Overdue with sorting by Planned date
  const groupedTasks = useMemo(() => {
    const groups = {
      today: [],
      overdue: []
    };

    checklistTasks.forEach(task => {
      if (isTaskOverdue(task)) {
        groups.overdue.push(task);
      } else if (isTaskForToday(task)) {
        groups.today.push(task);
      } else {
        // For other tasks, put them in today group by default
        groups.today.push(task);
      }
    });

    // Sort both groups by Planned date in descending order (newest first)
    const sortByPlannedDesc = (a, b) => {
      const plannedA = getPlanned(a);
      const plannedB = getPlanned(b);
      
      if (!plannedA && !plannedB) return 0;
      if (!plannedA) return 1;
      if (!plannedB) return -1;
      
      const dateA = new Date(plannedA);
      const dateB = new Date(plannedB);
      
      return dateB - dateA; // Descending order (newest first)
    };

    groups.today.sort(sortByPlannedDesc);
    groups.overdue.sort(sortByPlannedDesc);

    return groups;
  }, [checklistTasks]);

  // Get summary stats
  const getStats = () => {
    const totalTasks = checklistTasks.length;
    const overdueTasks = groupedTasks.overdue.length;
    const todayTasks = groupedTasks.today.length;
    const completedTasks = checklistTasks.filter(task => {
      const taskInfo = getTaskInfo(task);
      return taskInfo.toLowerCase().includes('completed') || taskInfo.toLowerCase().includes('done');
    }).length;

    return {
      totalTasks,
      overdueTasks,
      todayTasks,
      completedTasks
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading checklist tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Checklist</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <CheckSquare className="w-6 h-6 mr-3 text-green-600" />
            Checklist Tasks
          </h2>
          <p className="text-gray-600">
            Checklist tasks assigned to {currentUser.name} as Doer
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalTasks}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overdue Tasks</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdueTasks}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Tasks</p>
              <p className="text-2xl font-bold text-blue-600">{stats.todayTasks}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-purple-600">{stats.completedTasks}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tasks or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Tasks Grouped by Today and Overdue */}
      <div className="space-y-6">
        {/* Today's Tasks Section */}
        {groupedTasks.today.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
                  <p className="text-sm text-gray-500">{groupedTasks.today.length} task{groupedTasks.today.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {groupedTasks.today.map((task, index) => {
                const taskInfo = getTaskInfo(task);
                const frequency = getFrequency(task);
                const taskId = getTaskId(task);
                const taskDate = getTaskDate(task);
                const planned = getPlanned(task);
                const delayInDays = calculateDelayFromPlanned(task);
                const link = getLink(task);

                return (
                  <div 
                    key={`today-${index}`}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3">
                          <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 bg-blue-500" />
                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              <p className="font-semibold text-gray-900 text-base leading-relaxed">
                                <strong>Task:</strong> {taskInfo || 'No description available'}
                              </p>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>
                                <strong>Freq:</strong> {frequency || 'N/A'}, <strong>Task ID:</strong> {taskId || 'N/A'}, <strong>Task Date:</strong> {taskDate || 'N/A'}
                              </p>
                              {planned && (
                                <p className="text-blue-600 mt-1 text-xs">
                                  <strong>Planned:</strong> {planned}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {delayInDays > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Overdue
                          </span>
                        )}
                        {taskDate && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {taskDate}
                          </span>
                        )}
                        {link && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Open task link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Overdue Tasks Section */}
        {groupedTasks.overdue.length > 0 && (
          <div className="bg-white rounded-lg border border-red-200">
            <div className="p-4 border-b border-red-200 bg-red-50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Overdue Tasks</h3>
                  <p className="text-sm text-red-600">{groupedTasks.overdue.length} task{groupedTasks.overdue.length !== 1 ? 's' : ''} overdue</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {groupedTasks.overdue.map((task, index) => {
                const taskInfo = getTaskInfo(task);
                const frequency = getFrequency(task);
                const taskId = getTaskId(task);
                const taskDate = getTaskDate(task);
                const planned = getPlanned(task);
                const delayInDays = calculateDelayFromPlanned(task);
                const link = getLink(task);

                return (
                  <div 
                    key={`overdue-${index}`}
                    className="p-4 hover:bg-red-50 transition-colors border-l-4 border-red-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3">
                          <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 bg-red-500" />
                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              <p className="font-semibold text-gray-900 text-base">
                                <strong>Task:</strong> {taskInfo || 'No description available'}
                              </p>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>
                                <strong>Freq:</strong> {frequency || 'N/A'}, <strong>Task ID:</strong> {taskId || 'N/A'}, <strong>Task Date:</strong> {taskDate || 'N/A'}
                              </p>
                              {planned && (
                                <p className="text-blue-600 mt-1 text-xs">
                                  <strong>Planned:</strong> {planned}
                                </p>
                              )}
                              {delayInDays > 0 && (
                                <p className="text-red-600 mt-1 font-medium">
                                  <Clock className="w-4 h-4 inline mr-1" />
                                  Overdue by: {delayInDays} day{delayInDays !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {delayInDays > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Overdue
                          </span>
                        )}
                        {taskDate && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {taskDate}
                          </span>
                        )}
                        {link && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Open task link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Tasks Message */}
        {groupedTasks.today.length === 0 && groupedTasks.overdue.length === 0 && (
          <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Checklist Tasks Found</h3>
            <p className="text-gray-600">
              {fmsData && fmsData.length === 0 
                ? `No checklist tasks assigned to ${currentUser.name} as Doer`
                : 'No tasks match your current search'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistTasks;
