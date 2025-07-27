// src/api/googleSheetsAPI.js
class GoogleSheetsAPI {
  async fetchDelegationData(doerName) {
    try {
      const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_DELEGATION;
      const sheetName = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_NAME_DELEGATION;
      
      // Use your serverless function endpoint
      const apiUrl = '/api/sheets'; // or your full Vercel URL if deployed
      const params = new URLSearchParams({
        sheetId: spreadsheetId,
        sheetName: sheetName,
        range: 'A8:BZ'
      });
      
      const response = await fetch(`${apiUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];

      if (rows.length === 0) {
        return [];
      }

      // Get header row (first row of our data)
      const headers = rows[0];
      
      // Find the index of "Doer Name" column
      const doerNameIndex = headers.findIndex(header => 
        header && header.toLowerCase().includes('doer name')
      );

      if (doerNameIndex === -1) {
        throw new Error('Doer Name column not found');
      }

      // Process data rows (skip header)
      const delegationTasks = rows.slice(1)
        .filter(row => row[doerNameIndex] === doerName)
        .map((row, index) => {
          const task = {};
          
          headers.forEach((header, colIndex) => {
            if (header && row[colIndex] !== undefined) {
              const key = this.cleanHeaderName(header);
              task[key] = row[colIndex];
            }
          });

          task.id = index + 1;
          task.rowNumber = index + 9;
          
          return task;
        });

      return delegationTasks;
    } catch (error) {
      console.error('Error fetching delegation data:', error);
      throw error;
    }
  }

  // Keep all the helper methods the same
  cleanHeaderName(header) {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  getTaskPriority(task) {
    return task.task_priority || 'medium';
  }

  getTaskStatus(task) {
    return task.delegation_status || 'pending';
  }

  getTaskTitle(task) {
    return task.task || 'Untitled Task';
  }

  getTaskDate(task) {
    return task.task_created_date || task.first_date || new Date().toLocaleDateString();
  }

  getTaskCompany(task) {
    return task.company || 'Unknown';
  }

  getSubmissionLink(task) {
    return task.submission_link || '';
  }

  getDueDate(task) {
    return task.final_date || task.first_date || '';
  }

  getTaskRemarks(task) {
    return task.all_remarks_history || task.doer_remarks || '';
  }
}

export default new GoogleSheetsAPI();