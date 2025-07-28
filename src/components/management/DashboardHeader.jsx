import React from 'react';
import { Gauge, Activity, Users, Clock, RefreshCw } from 'lucide-react';

const DashboardHeader = ({ executiveSummary, lastRefresh, onRefresh }) => (
  <div className="bg-gray-800 rounded-xl p-8 text-white shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center">
          <Gauge className="w-10 h-10 mr-4 text-purple-400" />
          Management Command Center
        </h1>
        <p className="text-lg text-gray-300">
          Organization-wide performance monitoring and bottleneck analysis
        </p>
        <div className="flex items-center space-x-6 mt-6 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-green-400" />
            <span>Live Data (No Cache)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>{executiveSummary.activeWorkers} Workers</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span>Updated: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <div className="text-3xl font-bold text-red-400">{executiveSummary.totalPending}</div>
          <div className="text-sm text-gray-300">Total Pending Tasks</div>
          <div className="text-xs text-gray-400">{executiveSummary.pendingRate}% of total</div>
        </div>
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center space-x-2 shadow-md"
        >
          <RefreshCw className="w-5 h-5" />
          <span className="font-semibold">Refresh Data</span>
        </button>
      </div>
    </div>
  </div>
);

export default DashboardHeader;
