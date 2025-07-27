import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, EyeOff, User, Lock, Users, AlertCircle, CheckCircle, RefreshCw, Loader } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [passkey, setPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);



  // Fetch employees from Google Sheets
  const fetchEmployeesFromSheet = useCallback(async () => {
    try {
      setDataLoading(true);
      setError('');
      
      const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_EMPLOYEES;
      const sheetName = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_EMPLOYEES || 'Employees';
      
      if (!spreadsheetId) {
        throw new Error('Employee spreadsheet configuration is missing. Please check your environment variables.');
      }

      const apiUrl = '/api/sheets';
      const params = new URLSearchParams({
        sheetId: spreadsheetId,
        sheetName: sheetName,
        range: 'A2:Z' // Assuming data starts from row 2 (after headers)
      });
      
      const response = await fetch(`${apiUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch employee data. Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      if (rows.length === 0) {
        throw new Error('No employee data found in the spreadsheet. Please add employee records to continue.');
      }

      // Process employee data from sheet
      const employeeData = rows
        .filter(row => row.length >= 13 && row[13] === 'Active') // Filter by Status column (Active employees only)
        .map((row, index) => ({
          id: row[0] || `EMP${String(index + 1).padStart(3, '0')}`,
          name: row[1] || 'Unknown',
          email: row[2] || '',
          passkey: row[3] || '',
          role: row[4] || 'Employee',
          department: row[5] || 'General',
          status: row[13] || 'Active',
          permissions: {
            canViewOverview: (row[6] || '').toLowerCase() === 'true',
            canViewHT: (row[7] || '').toLowerCase() === 'true',
            canViewDelegation: (row[8] || '').toLowerCase() === 'true',
            canViewFMS: (row[9] || '').toLowerCase() === 'true',
            canViewAnalytics: (row[10] || '').toLowerCase() === 'true',
            canViewPC: (row[11] || '').toLowerCase() === 'true',
            canViewHS: (row[12] || '').toLowerCase() === 'true'
          }
        }));

      if (employeeData.length === 0) {
        throw new Error('No active employees found in the spreadsheet. Please ensure employee status is set to "Active".');
      }

      setEmployees(employeeData);
      setFilteredEmployees(employeeData);
      
    } catch (error) {
      console.error('Error fetching employee data:', error);
      setError(error.message);
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployeesFromSheet();
  }, [fetchEmployeesFromSheet]);

  useEffect(() => {
    // Filter employees based on search term
    const filtered = employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee);
    setSearchTerm(employee.name);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate API call delay
    setTimeout(() => {
      if (!selectedEmployee) {
        setError('Please select an employee');
        setLoading(false);
        return;
      }

      if (!passkey) {
        setError('Please enter your passkey');
        setLoading(false);
        return;
      }

      if (passkey !== selectedEmployee.passkey) {
        setError('Invalid passkey');
        setLoading(false);
        return;
      }

      if (selectedEmployee.status !== 'Active') {
        setError('Account is not active. Please contact administrator.');
        setLoading(false);
        return;
      }

      // Successful login
      onLogin(selectedEmployee);
      setLoading(false);
    }, 1000);
  };

  const handleRefreshData = () => {
    fetchEmployeesFromSheet();
    setError('');
    setSearchTerm('');
    setSelectedEmployee(null);
    setPasskey('');
  };

  const getRoleColor = (role) => {
    const colors = {
      'Operation': 'bg-blue-100 text-blue-800',
      'PC': 'bg-green-100 text-green-800',
      'Sales Agent': 'bg-purple-100 text-purple-800',
      'Medical Representative': 'bg-red-100 text-red-800',
      'HR': 'bg-yellow-100 text-yellow-800',
      'Account': 'bg-indigo-100 text-indigo-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Employee Data...</h2>
          <p className="text-gray-600">Fetching employee information from Google Sheets</p>
        </div>
      </div>
    );
  }

  if (error && employees.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Employee Data</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleRefreshData}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            >
              <RefreshCw className="w-5 h-5 inline mr-2" />
              Retry Loading Data
            </button>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Required Setup:</h4>
              <ul className="text-sm text-blue-800 text-left space-y-1">
                <li>• Configure REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_EMPLOYEES</li>
                <li>• Ensure Google Sheets API is set up</li>
                <li>• Add employee data to the spreadsheet</li>
                <li>• Set employee status to "Active"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kairali TaskApp</h1>
          <p className="text-gray-600">Sign in to your dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Employee Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Name
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedEmployee(null);
                  }}
                  placeholder="Search by name, role, department, or email..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Employee Dropdown */}
              {searchTerm && !selectedEmployee && filteredEmployees.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => handleEmployeeSelect(employee)}
                      className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="font-medium text-gray-900 truncate">{employee.name}</p>
                          <p className="text-sm text-gray-500 truncate">{employee.department}</p>
                          <p className="text-xs text-gray-400 truncate">{employee.email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getRoleColor(employee.role)}`}>
                          {employee.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {searchTerm && !selectedEmployee && filteredEmployees.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                  <p className="text-sm text-gray-500 text-center">No employees found</p>
                </div>
              )}
            </div>

            {/* Selected Employee Info */}
            {selectedEmployee && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-medium text-gray-900 truncate">{selectedEmployee.name}</p>
                    <p className="text-sm text-gray-600 truncate">{selectedEmployee.email}</p>
                    <p className="text-xs text-gray-500 truncate">{selectedEmployee.department}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getRoleColor(selectedEmployee.role)}`}>
                    {selectedEmployee.role}
                  </span>
                </div>
              </div>
            )}

            {/* Passkey */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passkey
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Enter your passkey"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && employees.length > 0 && (
              <div className="flex items-center space-x-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">Warning: {error}</span>
              </div>
            )}

            {/* Login Error Message */}
            {error && employees.length === 0 && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedEmployee || !passkey}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Employee Count */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              {employees.length} active employee{employees.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 Kairali TaskApp. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;