// Mock data that matches your AppSheet structure
export const mockData = {
  htReplyPending: [
    // Your HT Reply Pending data
  ],
  delegationTasks: [
    // Your delegation tasks
  ],
  fmsTasks: [
    // Your FMS tasks
  ]
};

// API simulation functions
export const fetchHTReplyPending = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockData.htReplyPending), 500);
  });
};

export const fetchDelegationTasks = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockData.delegationTasks), 500);
  });
};

export const fetchFMSTasks = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockData.fmsTasks), 500);
  });
};