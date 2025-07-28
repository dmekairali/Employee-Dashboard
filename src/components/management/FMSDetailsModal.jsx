import React from 'react';
import { X } from 'lucide-react';

const FMSDetailsModal = ({ fms, onClose }) => {
  if (!fms) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{fms.name} Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Total Tasks:</h3>
            <p>{fms.total}</p>
          </div>
          <div>
            <h3 className="font-semibold">Process Coordinators:</h3>
            <p>{[...fms.pcs].join(', ')}</p>
          </div>
          <div>
            <h3 className="font-semibold">Doers:</h3>
            <ul>
              {Object.entries(fms.doers).map(([doer, count]) => (
                <li key={doer}>{doer}: {count}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Average Delay:</h3>
            <p>Coming Soon...</p>
          </div>
          <div>
            <h3 className="font-semibold">Action Plan:</h3>
            <p>Coming Soon...</p>
          </div>
          <div>
            <h3 className="font-semibold">Insights:</h3>
            <p>Coming Soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FMSDetailsModal;
