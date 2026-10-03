// Keep in sync with shared/schemas/case-enums.json and frontend/src/constants/index.js
module.exports = {
  ROLES: ['admin', 'analyst', 'viewer'],
  CASE_TYPES: ['Civil', 'Criminal', 'Family', 'Property', 'Commercial', 'Consumer', 'Labour', 'Cheque Bounce'],
  COURTS: ['District Court', 'Sessions Court', 'High Court', 'Family Court', 'Consumer Forum', 'Magistrate Court'],
  STAGES: ['Filing', 'Admission', 'Notice Issued', 'Pleadings', 'Evidence', 'Arguments', 'Judgment Reserved'],
  STATUSES: ['Pending', 'Adjourned', 'Stayed', 'Disposed'],
  PRIORITIES: ['Low', 'Normal', 'High', 'Urgent'],
  RISK_LEVELS: ['LOW', 'MEDIUM', 'HIGH'],
  REC_PRIORITIES: ['High', 'Medium', 'Low'],
};
