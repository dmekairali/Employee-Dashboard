import React, { useState } from 'react';
import { DollarSign, ExternalLink, Users, MessageSquare, UserPlus, Shield, Clipboard } from 'lucide-react';
import SortableTable from './SortableTable';
import FMSDetailsModal from './FMSDetailsModal';

// FMS Analysis Panel
const FMSAnalysis = ({ data, getFMSLinks }) => {
    const [selectedFMS, setSelectedFMS] = useState(null);
    const totalFMS = data.length;

    const pcAnalysis = {};
    data.forEach(task => {
      const pc = task.pc || task.pcdeo || 'Unknown';
      if (!pcAnalysis[pc]) {
        pcAnalysis[pc] = { name: pc, total: 0, delayed: 0 };
      }
      pcAnalysis[pc].total++;
      if (task.delay && task.delay.trim() !== '') {
        pcAnalysis[pc].delayed++;
      }
    });

    const topPCs = Object.values(pcAnalysis).sort((a, b) => b.total - a.total).slice(0, 10);

    const fmsGroups = {};
    data.forEach(task => {
      const fmsName = task.fms || 'Unknown';
      if (!fmsGroups[fmsName]) {
        fmsGroups[fmsName] = {
          name: fmsName,
          total: 0,
          pcs: new Set(),
          doers: {},
          link: getFMSLinks[fmsName] || null
        };
      }
      fmsGroups[fmsName].total++;
      if (task.pc || task.pcdeo) fmsGroups[fmsName].pcs.add(task.pc || task.pcdeo);
      const doer = task.doer || 'Unknown';
      if (!fmsGroups[fmsName].doers[doer]) fmsGroups[fmsName].doers[doer] = 0;
      fmsGroups[fmsName].doers[doer]++;
    });

    const fmsData = Object.values(fmsGroups).map(fms => ({
        ...fms,
        pcCount: fms.pcs.size,
        doerCount: Object.keys(fms.doers).length,
        percentage: ((fms.total / totalFMS) * 100).toFixed(2)
    }));

    const columns = [
        {
            key: 'name',
            header: 'FMS Name',
            render: (fms) => (
                <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900">{fms.name}</span>
                    {fms.link && (
                        <a href={fms.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>
            )
        },
        {
            key: 'total',
            header: 'Total Count',
            render: (fms) => (
                <div>
                    <div>{fms.total}</div>
                    <div className="text-xs text-gray-500">{fms.percentage}% of total</div>
                </div>
            )
        },
        {
            key: 'pcCount',
            header: 'PC Count',
            render: (fms) => fms.pcCount
        },
        {
            key: 'doers',
            header: 'Doers',
            render: (fms) => (
                <div className="space-y-1">
                    {Object.entries(fms.doers).map(([doer, count]) => (
                        <div key={doer} className="text-sm text-gray-600">{doer}: {count}</div>
                    ))}
                </div>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (fms) => (
                <button onClick={() => setSelectedFMS(fms)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Details</button>
            )
        }
    ];

  return (
    <div className="space-y-6">
        <FMSDetailsModal fms={selectedFMS} onClose={() => setSelectedFMS(null)} />
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Coordinators Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {topPCs.map((pc, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2">
                <Clipboard className="w-5 h-5 text-green-600" />
                <span className={`px-2 py-1 text-xs rounded-full ${pc.delayed > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {pc.delayed > 0 ? `${pc.delayed} delayed` : 'On track'}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 truncate">{pc.name}</h4>
              <p className="text-sm text-gray-600">{pc.total} tasks</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">FMS Analysis</h3>
        </div>
        <SortableTable data={fmsData} columns={columns} />
      </div>
    </div>
  );
};

// Delegation Analysis Panel
const DelegationAnalysis = ({ data }) => {
    const delegationGroups = {};
    data.forEach(task => {
        const delegatedBy = task.delegated_by || task.name || 'Unknown';
        const doer = task.doer_name || task.doer || 'Unknown';
        const key = `${delegatedBy} → ${doer}`;
        if (!delegationGroups[key]) {
            delegationGroups[key] = { delegatedBy, doer, total: 0, pending: 0, completed: 0 };
        }
        delegationGroups[key].total++;
        const status = (task.delegation_status || 'pending').toLowerCase();
        if (status.includes('pending')) {
            delegationGroups[key].pending++;
        } else if (status.includes('completed')) {
            delegationGroups[key].completed++;
        }
    });

    const delegationData = Object.values(delegationGroups).map(group => ({
        ...group,
        efficiency: group.total > 0 ? ((group.completed / group.total) * 100).toFixed(1) : 0
    }));

    const columns = [
        { key: 'delegatedBy', header: 'Delegated By', render: item => item.delegatedBy },
        { key: 'doer', header: 'Doer Name', render: item => item.doer },
        { key: 'total', header: 'Total Tasks', render: item => item.total },
        {
            key: 'pending',
            header: 'Pending',
            render: item => (
                <span className={`px-2 py-1 text-xs rounded-full ${item.pending > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {item.pending}
                </span>
            )
        },
        { key: 'completed', header: 'Completed', render: item => item.completed },
        {
            key: 'efficiency',
            header: 'Efficiency',
            render: item => (
                <span className={`px-2 py-1 text-xs rounded-full ${
                    parseFloat(item.efficiency) > 80 ? 'bg-green-100 text-green-800' :
                    parseFloat(item.efficiency) > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                    {item.efficiency}%
                </span>
            )
        }
    ];

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Delegation Analysis</h3>
        </div>
        <SortableTable data={delegationData} columns={columns} />
      </div>
    );
};

// Help Ticket Analysis Panel
const HelpTicketAnalysis = ({ data }) => {
    const htGroups = {};
    data.forEach(task => {
        const assignedTo = task.issueDelegatedTo || 'Unknown';
        if (!htGroups[assignedTo]) {
            htGroups[assignedTo] = { name: assignedTo, total: 0, pending: 0, replied: 0, highPriority: 0 };
        }
        htGroups[assignedTo].total++;
        if (!task.replyActual || task.replyActual.trim() === '') {
            htGroups[assignedTo].pending++;
        } else {
            htGroups[assignedTo].replied++;
        }
        if (task.challengeLevel?.toUpperCase() === 'HIGH') {
            htGroups[assignedTo].highPriority++;
        }
    });

    const htData = Object.values(htGroups).map(group => ({
        ...group,
        responseRate: group.total > 0 ? ((group.replied / group.total) * 100).toFixed(1) : 0
    }));

    const columns = [
        { key: 'name', header: 'Assigned To', render: item => item.name },
        { key: 'total', header: 'Total Tickets', render: item => item.total },
        {
            key: 'pending',
            header: 'Pending Reply',
            render: item => (
                <span className={`px-2 py-1 text-xs rounded-full ${item.pending > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {item.pending}
                </span>
            )
        },
        { key: 'replied', header: 'Replied', render: item => item.replied },
        {
            key: 'highPriority',
            header: 'High Priority',
            render: item => (
                <span className={`px-2 py-1 text-xs rounded-full ${item.highPriority > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {item.highPriority}
                </span>
            )
        },
        {
            key: 'responseRate',
            header: 'Response Rate',
            render: item => (
                <span className={`px-2 py-1 text-xs rounded-full ${
                    parseFloat(item.responseRate) > 80 ? 'bg-green-100 text-green-800' :
                    parseFloat(item.responseRate) > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                    {item.responseRate}%
                </span>
            )
        }
    ];

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Help Ticket Analysis</h3>
        </div>
        <SortableTable data={htData} columns={columns} />
      </div>
    );
};

// Help Slip Analysis Panel
const HelpSlipAnalysis = ({ data }) => {
    const hsGroups = {};
    data.forEach(task => {
        const assignedTo = task.assignedTo || 'Director';
        if (!hsGroups[assignedTo]) {
            hsGroups[assignedTo] = { name: assignedTo, total: 0, pending: 0, replied: 0, raisedBy: new Set() };
        }
        hsGroups[assignedTo].total++;
        hsGroups[assignedTo].raisedBy.add(task.name || 'Unknown');
        if (task.replyPlanned && task.replyPlanned.trim() !== '' && (!task.replyActual || task.replyActual.trim() === '')) {
            hsGroups[assignedTo].pending++;
        } else if (task.replyActual && task.replyActual.trim() !== '') {
            hsGroups[assignedTo].replied++;
        }
    });

    const hsData = Object.values(hsGroups).map(group => ({
        ...group,
        uniqueRequesters: group.raisedBy.size,
        responseRate: group.total > 0 ? ((group.replied / group.total) * 100).toFixed(1) : 0
    }));

    const columns = [
        {
            key: 'name',
            header: 'Assigned To',
            render: item => (
                <div className="flex items-center">
                    <Shield className="w-4 h-4 text-purple-600 mr-2" />
                    {item.name}
                </div>
            )
        },
        { key: 'total', header: 'Total Slips', render: item => item.total },
        {
            key: 'pending',
            header: 'Pending Reply',
            render: item => (
                <span className={`px-2 py-1 text-xs rounded-full ${item.pending > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {item.pending}
                </span>
            )
        },
        { key: 'replied', header: 'Replied', render: item => item.replied },
        { key: 'uniqueRequesters', header: 'Unique Requesters', render: item => item.uniqueRequesters },
        {
            key: 'responseRate',
            header: 'Response Rate',
            render: item => (
                <span className={`px-2 py-1 text-xs rounded-full ${
                    parseFloat(item.responseRate) > 80 ? 'bg-green-100 text-green-800' :
                    parseFloat(item.responseRate) > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                    {item.responseRate}%
                </span>
            )
        }
    ];

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Help Slip Analysis</h3>
          <p className="text-sm text-gray-600">All help slips are assigned to Director for management</p>
        </div>
        <SortableTable data={hsData} columns={columns} />
      </div>
    );
};

const QuickAnalysis = ({ summary }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold text-blue-900">{summary.pendingDelegation}</span>
            </div>
            <h3 className="font-semibold text-blue-900">Delegation Pending</h3>
            <p className="text-sm text-blue-700">Tasks awaiting completion</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-green-900">{summary.pendingFMS}</span>
            </div>
            <h3 className="font-semibold text-green-900">FMS Delayed</h3>
            <p className="text-sm text-green-700">Financial tasks behind schedule</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-4">
                <MessageSquare className="w-8 h-8 text-red-600" />
                <span className="text-2xl font-bold text-red-900">{summary.pendingHT}</span>
            </div>
            <h3 className="font-semibold text-red-900">HT Pending Reply</h3>
            <p className="text-sm text-red-700">Help tickets awaiting response</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-4">
                <UserPlus className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold text-purple-900">{summary.pendingHS}</span>
            </div>
            <h3 className="font-semibold text-purple-900">HS Pending Reply</h3>
            <p className="text-sm text-purple-700">Help slips awaiting response</p>
        </div>
    </div>
);

const AnalysisPanels = ({ selectedTab, allData, getFMSLinks, executiveSummary }) => {
  return (
    <div className="p-6">
      {selectedTab === 'quick-analysis' && <QuickAnalysis summary={executiveSummary} />}
      {selectedTab === 'fms' && <FMSAnalysis data={allData.fms} getFMSLinks={getFMSLinks} />}
      {selectedTab === 'delegation' && <DelegationAnalysis data={allData.delegation} />}
      {selectedTab === 'help-ticket' && <HelpTicketAnalysis data={allData.ht} />}
      {selectedTab === 'help-slip' && <HelpSlipAnalysis data={allData.hs} />}
    </div>
  );
};

export default AnalysisPanels;
