import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Hash,
  Building2,
  Mail,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const NewTaskNotification = ({ notifications, onClose, onMarkAllRead }) => {
  const [expandedGroups, setExpandedGroups] = useState({});

  if (!notifications || notifications.length === 0) return null;

  const toggleGroup = (component) => {
    setExpandedGroups(prev => ({
      ...prev,
      [component]: !prev[component]
    }));
  };

  const getComponentIcon = (component) => {
    switch (component) {
      case 'fms': return FileText;
      case 'delegation': return User;
      case 'ht': return Mail;
      case 'pc': return CheckCircle;
      default: return Bell;
    }
  };

  const getComponentColor = (component) => {
    switch (component) {
      case 'fms': return 'text-purple-600 bg-purple-100';
      case 'delegation': return 'text-blue-600 bg-blue-100';
      case 'ht': return 'text-red-600 bg-red-100';
      case 'pc': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComponentName = (component) => {
    switch (component) {
      case 'fms': return 'FMS';
      case 'delegation': return 'Delegation';
      case 'ht': return 'HT Tasks';
      case 'pc': return 'PC Tasks';
      default: return component.toUpperCase();
    }
  };

  const formatTaskPreview = (task, component) => {
    switch (component) {
      case 'fms':
      case 'pc':
        const taskInfo = task.task_info || '';
        const orderIdMatch = taskInfo.match(/(?:Oder ID|Order ID) - ([^<\n]+)/);
        const clientMatch = taskInfo.match(/Name of the Client - ([^<\n]+)/);
        const amountMatch = taskInfo.match(/Invoice Amount - ([^<\n]+)/);
        
        return {
          title: orderIdMatch ? orderIdMatch[1].trim() : `Task ${task.id}`,
          subtitle: clientMatch ? clientMatch[1].trim() : task.doer || 'Unknown',
          detail: amountMatch ? `₹${amountMatch[1].trim()}` : task.fms || '',
          date: task.planned || task.week || ''
        };

      case 'delegation':
        return {
          title: task.task || `Delegation Task ${task.id}`,
          subtitle: task.company || 'Unknown Company',
          detail: task.doer_name || task.assignee || 'Unassigned',
          date: task.task_created_date || task.first_date || ''
        };

      case 'ht':
        return {
          title: task.ticketId || `HT-${task.id}`,
          subtitle: task.challengeIssue || task.name || 'Unknown Issue',
          detail: task.issueDelegatedTo || task.department || '',
          date: task.timestamp || task.replyPlanned || ''
        };

      default:
        return {
          title: `New Task ${task.id}`,
          subtitle: 'Task details',
          detail: '',
          date: ''
        };
    }
  };

  const totalNewTasks = notifications.reduce((sum, notif) => sum + notif.count, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">New Tasks Available!</h3>
                <p className="text-blue-100 text-sm">
                  {totalNewTasks} new task{totalNewTasks !== 1 ? 's' : ''} across {notifications.length} module{notifications.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.map((notification, index) => {
            const ComponentIcon = getComponentIcon(notification.component);
            const isExpanded = expandedGroups[notification.component];
            
            return (
              <div key={index} className="border-b border-gray-200 last:border-b-0">
                {/* Group Header */}
                <div 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => toggleGroup(notification.component)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getComponentColor(notification.component)}`}>
                        <ComponentIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {getComponentName(notification.component)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {notification.count} new task{notification.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getComponentColor(notification.component).replace('text-', 'bg-').replace('bg-', 'text-').replace('-100', '-800')} ${getComponentColor(notification.component).split(' ')[1]}`}>
                        +{notification.count}
                      </span>
                      {isExpanded ? 
                        <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                  </div>
                </div>

                {/* Task Details */}
                {isExpanded && (
                  <div className="bg-gray-50 border-t border-gray-200">
                    <div className="max-h-48 overflow-y-auto">
                      {notification.newTasks.slice(0, 10).map((task, taskIndex) => {
                        const taskPreview = formatTaskPreview(task, notification.component);
                        
                        return (
                          <div key={taskIndex} className="p-4 border-b border-gray-200 last:border-b-0 hover:bg-white transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 mb-1">
                                  {taskPreview.title}
                                </h5>
                                <p className="text-sm text-gray-600 mb-2">
                                  {taskPreview.subtitle}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  {taskPreview.detail && (
                                    <span className="flex items-center">
                                      <Hash className="w-3 h-3 mr-1" />
                                      {taskPreview.detail}
                                    </span>
                                  )}
                                  {taskPreview.date && (
                                    <span className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {taskPreview.date}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="ml-4">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {notification.newTasks.length > 10 && (
                        <div className="p-4 text-center text-sm text-gray-500 bg-gray-100">
                          +{notification.newTasks.length - 10} more tasks...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onMarkAllRead}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
              >
                Mark as Read
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTaskNotification;