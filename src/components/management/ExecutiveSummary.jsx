import React from 'react';
import { Target, AlertTriangle, Users, Clipboard, UserCheck, Shield } from 'lucide-react';

const ExecutiveSummaryCard = ({ icon, title, value, label, color, children }) => (
  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 bg-${color}-100 rounded-lg`}>
        {icon}
      </div>
      <div className="text-right">
        <div className="text-3xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </div>
    {children || (
      <div className="flex items-center justify-between mt-4">
        <span className={`text-sm text-${color}-600 font-medium flex items-center`}>
          {label}
        </span>
      </div>
    )}
  </div>
);

const ExecutiveSummary = ({ summary }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <ExecutiveSummaryCard
      icon={<Target className="w-8 h-8 text-blue-600" />}
      title="Total Tasks"
      value={summary.totalTasks}
      color="blue"
      label={
        <>
          <UserCheck className="w-5 h-5 mr-2" />
          Organization Wide
        </>
      }
    />
    <ExecutiveSummaryCard
      icon={<AlertTriangle className="w-8 h-8 text-red-600" />}
      title="Pending Tasks"
      value={summary.totalPending}
      color="red"
    >
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, summary.pendingRate)}%` }}
        ></div>
      </div>
      <div className="mt-2 text-sm text-red-600 font-medium">
        {summary.pendingRate}% pending rate
      </div>
    </ExecutiveSummaryCard>
    <ExecutiveSummaryCard
      icon={<Users className="w-8 h-8 text-green-600" />}
      title="Active Workers"
      value={summary.activeWorkers}
      color="green"
      label={
        <>
          <UserCheck className="w-5 h-5 mr-2" />
          Cross Modules
        </>
      }
    />
    <ExecutiveSummaryCard
      icon={<Clipboard className="w-8 h-8 text-purple-600" />}
      title="Active PCs"
      value={summary.activePCs}
      color="purple"
      label={
        <>
          <Shield className="w-5 h-5 mr-2" />
          Process Coordinators
        </>
      }
    />
  </div>
);

export default ExecutiveSummary;
