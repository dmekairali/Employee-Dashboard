import React from 'react';
import { Download, Settings, RefreshCw } from 'lucide-react';

const ActionFooter = ({ onRefresh }) => (
    <div className="bg-gray-100 rounded-xl p-6 shadow-inner">
        <div className="flex items-center justify-between">
            <div>
                <h3 className="font-bold text-gray-800 text-lg">Management Actions</h3>
                <p className="text-sm text-gray-600">Export reports and configure monitoring settings</p>
            </div>

            <div className="flex items-center space-x-4">
                <button className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow-md">
                    <Download className="w-5 h-5" />
                    <span className="font-semibold">Export Analysis</span>
                </button>
                <button className="px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 shadow-md">
                    <Settings className="w-5 h-5" />
                    <span className="font-semibold">Configure Alerts</span>
                </button>
                <button
                    onClick={onRefresh}
                    className="px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 shadow-md"
                >
                    <RefreshCw className="w-5 h-5" />
                    <span className="font-semibold">Refresh All</span>
                </button>
            </div>
        </div>
    </div>
);

export default ActionFooter;
