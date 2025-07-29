import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  User, 
  Clock, 
  Search, 
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users
} from 'lucide-react';

const PCTasksChecklist = ({ tasks, currentUser, loading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDoers, setExpandedDoers] = useState({});

  // Filter tasks to only include CheckList Task items
  const checklistTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    
    return tasks.filter(task => {
      const fmsType = task.fms || '';
      return fmsType.toLowerCase().includes('checklist task');
    });
  }, [tasks]);

  // Helper functions (based on PCTasks component structure)
  const getTaskInfo = (task) => {
    return task.task_info || task.taskinfo || task.what_to_do || '';
  };

  const getWhatToDo = (task) => {
    return task.what_to_do || task.whattodo || '';
  };

  const getDoer = (task) => {
    return task.doer || task.assignedTo || '';
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

  const isTaskOverdue = (task) => {
  const delay = parseFloat(task.delay || 0);
  return delay > 0; // Any positive number means overdue
};

  // Filter and group tasks by doer
  const groupedChecklistTasks = useMemo(() => {
    let filteredTasks = checklistTasks;

    // Apply search filter
    if (searchTerm) {
      filteredTasks = filteredTasks.filter(task =>
        getTaskInfo(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getWhatToDo(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDoer(task).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Group by doer
    const grouped = {};
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
  }, [checklistTasks, searchTerm]);

  // Get summary stats
  const getStats = () => {
    const totalTasks = checklistTasks.length;
    const overdueTasks = checklistTasks.filter(task => isTaskOverdue(task)).length;
    const uniqueDoers = Object.keys(groupedChecklistTasks).length;
    const completedTasks = checklistTasks.filter(task => {
      const taskInfo = getTaskInfo(task);
      return taskInfo.toLowerCase().includes('completed') || taskInfo.toLowerCase().includes('done');
    }).length;

    return {
      totalTasks,
      overdueTasks,
      uniqueDoers,
      completedTasks,
      overduePercentage: totalTasks > 0 ? ((overdueTasks / totalTasks) * 100).toFixed(1) : 0
    };
  };

  const stats = getStats();

  // Toggle doer expansion
  const toggleDoerExpansion = (doer) => {
    setExpandedDoers(prev => ({
      ...prev,
      [doer]: !prev[doer]
    }));
  };

  // Generate WhatsApp message for a doer's tasks
  const generateWhatsAppMessage = (doer, tasks) => {
    const taskList = tasks.map((task, index) => {
      const taskInfo = getTaskInfo(task);
      const deadline = getDeadline(task);
      const delay = getDelay(task);
      const isOverdue = isTaskOverdue(task);
      
      return `${index + 1}. ${taskInfo}${deadline ? `\n   📅 Deadline: ${deadline}` : ''}${isOverdue ? `\n   ⚠️ Status: Overdue (${delay})` : ''}`;
    }).join('\n\n');

    const overdueCount = tasks.filter(task => isTaskOverdue(task)).length;
    const overdueText = overdueCount > 0 ? `\n⚠️ ${overdueCount} task(s) are overdue` : '';

    return `Hi ${doer},

Here are your checklist tasks from PC Dashboard:

${taskList}

Total Tasks: ${tasks.length}${overdueText}

Please review and update the status as needed.

Best regards,
${currentUser.name}
Process Coordinator`;
  };

  // Share tasks via WhatsApp
  const shareViaWhatsApp = (doer, tasks) => {
    const message = generateWhatsAppMessage(doer, tasks);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

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
            Process Coordinator checklist for {currentUser.name}
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
              <p className="text-sm text-gray-500">Assigned Doers</p>
              <p className="text-2xl font-bold text-blue-600">{stats.uniqueDoers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalTasks > 0 ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search checklist tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Checklist Tasks Grouped by Doer */}
      <div className="space-y-4">
        {Object.keys(groupedChecklistTasks).length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg border border-gray-200">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Checklist Tasks Found</h3>
            <p className="text-gray-600">
              {checklistTasks.length === 0 
                ? 'No checklist tasks available'
                : 'No tasks match your current search'
              }
            </p>
          </div>
        ) : (
          Object.keys(groupedChecklistTasks).map(doer => {
            const doerTasks = groupedChecklistTasks[doer];
            const overdueCount = doerTasks.filter(task => isTaskOverdue(task)).length;
            
            return (
              <div key={doer} className="bg-white rounded-lg border border-gray-200">
                {/* Doer Header */}
                <div 
                  className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleDoerExpansion(doer)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{doer}</h3>
                        <p className="text-sm text-gray-500">
                          {doerTasks.length} tasks
                          {overdueCount > 0 && (
                            <span className="text-red-600 ml-2">• {overdueCount} overdue</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* WhatsApp Share Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareViaWhatsApp(doer, doerTasks);
                        }}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                        title={`Share ${doer}'s tasks via WhatsApp`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">Share</span>
                      </button>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        overdueCount > 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {doerTasks.length}
                      </span>
                      
                      {expandedDoers[doer] ? 
                        <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      }
                    </div>
                  </div>
                </div>

                {/* Doer Tasks */}
                {expandedDoers[doer] && (
                  <div className="divide-y divide-gray-200">
                    {doerTasks.map((task, index) => {
                      const taskInfo = getTaskInfo(task);
                      const whatToDo = getWhatToDo(task);
                      const deadline = getDeadline(task);
                      const delay = getDelay(task);
                      const link = getLink(task);
                      const isOverdue = isTaskOverdue(task);
                      
                      return (
                        <div 
                          key={index} 
                          className={`p-4 hover:bg-gray-50 border-l-4 ${
                            isOverdue ? 'border-red-500 bg-red-50/30' : 'border-green-500'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <CheckSquare className={`w-4 h-4 ${
                                  isOverdue ? 'text-red-600' : 'text-green-600'
                                }`} />
                                <span className="text-sm text-gray-500">
                                  Task #{index + 1}
                                </span>
                                {isOverdue && (
                                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Overdue
                                  </span>
                                )}
                              </div>
                              
                              <h4 className="font-semibold text-gray-900 mb-2">
                                {taskInfo || whatToDo || 'No task description'}
                              </h4>
                              
                              <div className="space-y-1 text-sm text-gray-600">
                                {deadline && (
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>Deadline: {deadline}</span>
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
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PCTasksChecklist;
