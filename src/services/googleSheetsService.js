// Google Sheets API Service
// src/services/googleSheetsService.js

class GoogleSheetsService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_SHEETS_API_KEY;
    this.spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID;
    this.baseURL = 'https://sheets.googleapis.com/v4/spreadsheets';
    
    if (!this.apiKey) {
      console.warn('Google Sheets API key not found. Please set REACT_APP_GOOGLE_SHEETS_API_KEY in your .env file');
    }
    
    if (!this.spreadsheetId) {
      console.warn('Google Sheets Spreadsheet ID not found. Please set REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID in your .env file');
    }
  }

  // Generic method to fetch data from any sheet range
  async fetchSheetData(range) {
    if (!this.apiKey || !this.spreadsheetId) {
      throw new Error('Missing API key or Spreadsheet ID. Check your environment variables.');
    }

    try {
      const url = `${this.baseURL}/${this.spreadsheetId}/values/${range}?key=${this.apiKey}`;
      console.log(`Fetching data from: ${range}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${data.values?.length || 0} rows from ${range}`);
      
      return data.values || [];
    } catch (error) {
      console.error(`Error fetching sheet data from ${range}:`, error);
      throw error;
    }
  }

  // Convert array data to objects with headers
  arrayToObjects(data) {
    if (!Array.isArray(data) || data.length < 2) {
      console.warn('Invalid data format: expected array with at least 2 rows (headers + data)');
      return [];
    }
    
    const headers = data[0].map(header => header.trim()); // Clean headers
    const rows = data.slice(1);
    
    return rows.map((row, index) => {
      const obj = {};
      headers.forEach((header, headerIndex) => {
        obj[header] = row[headerIndex]?.toString().trim() || '';
      });
      
      // Add row metadata
      obj._rowIndex = index + 2; // +2 because we skip header and array is 0-indexed
      obj._lastUpdated = new Date().toISOString();
      
      return obj;
    }).filter(obj => {
      // Filter out completely empty rows
      const values = Object.values(obj).filter(val => val && val !== '' && !val.startsWith('_'));
      return values.length > 0;
    });
  }

  // Fetch FMS Tasks data
  async fetchFMSTasks() {
    try {
      console.log('Fetching FMS Tasks data...');
      const rawData = await this.fetchSheetData('FMS_Tasks!A:F');
      const objects = this.arrayToObjects(rawData);
      
      // Transform to expected format
      return objects.map((row, index) => ({
        id: parseInt(row.TaskID) || parseInt(row.ID) || (30 - index),
        count: parseInt(row.Count) || parseInt(row.Items) || 0,
        type: row.Type || row.TaskType || 'Unknown Task',
        priority: (row.Priority || 'medium').toLowerCase(),
        status: row.Status || 'active',
        lastUpdated: row.LastUpdated || row.Updated || new Date().toISOString().split('T')[0],
        description: row.Description || '',
        _original: row
      }));
    } catch (error) {
      console.error('Error fetching FMS tasks:', error);
      return this.getFallbackFMSTasks();
    }
  }

  // Fetch HR Reply Pending data
  async fetchHRReplyPending() {
    try {
      console.log('Fetching HR Reply Pending data...');
      const rawData = await this.fetchSheetData('HR_Reply_Pending!A:H');
      const objects = this.arrayToObjects(rawData);
      
      return objects.map(row => ({
        id: row.TicketID || row.ID || `HT-${Date.now()}`,
        employee: row.Employee || row.EmployeeName || 'Unknown Employee',
        message: row.Message || row.Description || 'No message provided',
        type: this.normalizeType(row.Type || 'general'),
        priority: this.normalizePriority(row.Priority || 'medium'),
        date: this.normalizeDate(row.Date || row.CreatedDate),
        status: row.Status || 'pending',
        assignedTo: row.AssignedTo || '',
        _original: row
      }));
    } catch (error) {
      console.error('Error fetching HR reply pending:', error);
      return this.getFallbackHRTasks();
    }
  }

  // Fetch Delegation Tasks data
  async fetchDelegationTasks() {
    try {
      console.log('Fetching Delegation Tasks data...');
      const rawData = await this.fetchSheetData('Delegation!A:G');
      const objects = this.arrayToObjects(rawData);
      
      return objects.map((row, index) => ({
        id: parseInt(row.TaskID) || parseInt(row.ID) || (index + 1),
        title: row.Title || row.TaskTitle || 'Untitled Task',
        status: row.Status || 'Pending',
        date: this.normalizeDate(row.DueDate || row.Date),
        priority: this.normalizePriority(row.Priority || 'medium'),
        assignee: row.Assignee || row.AssignedTo || 'Unassigned',
        description: row.Description || '',
        createdBy: row.CreatedBy || row.Creator || 'System',
        createdDate: this.normalizeDate(row.CreatedDate),
        _original: row
      }));
    } catch (error) {
      console.error('Error fetching delegation tasks:', error);
      return this.getFallbackDelegationTasks();
    }
  }

  // Fetch all dashboard data in parallel
  async fetchAllDashboardData() {
    try {
      console.log('Fetching all dashboard data...');
      const startTime = Date.now();
      
      const [fmsTasks, hrReplyPending, delegationTasks] = await Promise.allSettled([
        this.fetchFMSTasks(),
        this.fetchHRReplyPending(),
        this.fetchDelegationTasks()
      ]);

      const endTime = Date.now();
      console.log(`Fetched all data in ${endTime - startTime}ms`);

      return {
        fmsTasks: fmsTasks.status === 'fulfilled' ? fmsTasks.value : this.getFallbackFMSTasks(),
        hrReplyPending: hrReplyPending.status === 'fulfilled' ? hrReplyPending.value : this.getFallbackHRTasks(),
        delegationTasks: delegationTasks.status === 'fulfilled' ? delegationTasks.value : this.getFallbackDelegationTasks(),
        lastUpdated: new Date().toISOString(),
        errors: [
          fmsTasks.status === 'rejected' ? { sheet: 'FMS_Tasks', error: fmsTasks.reason.message } : null,
          hrReplyPending.status === 'rejected' ? { sheet: 'HR_Reply_Pending', error: hrReplyPending.reason.message } : null,
          delegationTasks.status === 'rejected' ? { sheet: 'Delegation', error: delegationTasks.reason.message } : null
        ].filter(Boolean)
      };
    } catch (error) {
      console.error('Error fetching all dashboard data:', error);
      throw error;
    }
  }

  // Add new row to a sheet (for creating new tasks/tickets)
  async appendToSheet(sheetName, values) {
    if (!this.apiKey || !this.spreadsheetId) {
      throw new Error('Missing API key or Spreadsheet ID');
    }

    try {
      const range = `${sheetName}!A:A`; // Append to the end
      const url = `${this.baseURL}/${this.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [values]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`Successfully added row to ${sheetName}:`, result);
      return result;
    } catch (error) {
      console.error(`Error appending to sheet ${sheetName}:`, error);
      throw error;
    }
  }

  // Update a specific cell or range
  async updateSheetData(range, values) {
    if (!this.apiKey || !this.spreadsheetId) {
      throw new Error('Missing API key or Spreadsheet ID');
    }

    try {
      const url = `${this.baseURL}/${this.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED&key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating sheet data for range ${range}:`, error);
      throw error;
    }
  }

  // Helper methods for data normalization
  normalizeType(type) {
    const typeMap = {
      'onboarding': 'onboarding',
      'escalation': 'escalation',
      'data-check': 'data-check',
      'datacheck': 'data-check',
      'form-issue': 'form-issue',
      'formissue': 'form-issue',
      'general': 'general'
    };
    return typeMap[type.toLowerCase()] || 'general';
  }

  normalizePriority(priority) {
    const priorityMap = {
      'urgent': 'urgent',
      'high': 'high',
      'medium': 'medium',
      'med': 'medium',
      'low': 'low',
      'normal': 'medium'
    };
    return priorityMap[priority.toLowerCase()] || 'medium';
  }

  normalizeDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // Handle various date formats
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      return new Date().toISOString().split('T')[0];
    }
  }

  // Fallback data methods
  getFallbackFMSTasks() {
    return [
      { id: 30, count: 11, type: 'Active Orders', priority: 'high', status: 'active' },
      { id: 29, count: 4, type: 'Processing', priority: 'medium', status: 'active' },
      { id: 28, count: 6, type: 'Pending Review', priority: 'low', status: 'pending' }
    ];
  }

  getFallbackHRTasks() {
    return [
      {
        id: 'HT-165082',
        employee: 'Dhaneshwar Chaturvedi',
        message: 'Dear Ambuj, New Employee: HARISH MISHRA is joining...',
        type: 'onboarding',
        priority: 'high',
        date: '2025-07-25'
      }
    ];
  }

  getFallbackDelegationTasks() {
    return [
      {
        id: 1,
        title: 'content fms to have ai review step l...',
        status: 'Pending',
        date: '7/19/2025',
        priority: 'high',
        assignee: 'AI Team'
      }
    ];
  }

  // Test connection method
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/${this.spreadsheetId}?key=${this.apiKey}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Google Sheets connection successful!');
        console.log('📊 Spreadsheet info:', {
          title: data.properties?.title,
          sheets: data.sheets?.map(sheet => sheet.properties.title),
          locale: data.properties?.locale
        });
        return { success: true, data };
      } else {
        throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Google Sheets connection failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get sheet metadata (useful for debugging)
  async getSheetInfo() {
    try {
      const response = await fetch(`${this.baseURL}/${this.spreadsheetId}?key=${this.apiKey}`);
      if (response.ok) {
        const data = await response.json();
        return {
          title: data.properties?.title,
          sheets: data.sheets?.map(sheet => ({
            title: sheet.properties.title,
            sheetId: sheet.properties.sheetId,
            index: sheet.properties.index,
            rowCount: sheet.properties.gridProperties?.rowCount,
            columnCount: sheet.properties.gridProperties?.columnCount
          }))
        };
      }
      throw new Error('Failed to fetch sheet info');
    } catch (error) {
      console.error('Error getting sheet info:', error);
      throw error;
    }
  }

  // Batch fetch multiple ranges (more efficient for large datasets)
  async batchFetchSheetData(ranges) {
    if (!this.apiKey || !this.spreadsheetId) {
      throw new Error('Missing API key or Spreadsheet ID');
    }

    try {
      const rangeParams = ranges.map(range => `ranges=${encodeURIComponent(range)}`).join('&');
      const url = `${this.baseURL}/${this.spreadsheetId}/values:batchGet?${rangeParams}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      return data.valueRanges || [];
    } catch (error) {
      console.error('Error batch fetching sheet data:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const googleSheetsService = new GoogleSheetsService();

export default googleSheetsService;