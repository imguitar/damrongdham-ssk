'use strict';

const { startSlaJob } = require('./slaJob');
const { startEscalationJob } = require('./escalationJob');
const { startNotificationOutboxJob } = require('./notificationOutboxJob');
const { startLineMaintenanceJob } = require('./lineMaintenanceJob');

const startAllJobs = () => {
  startSlaJob();
  startEscalationJob();
  startNotificationOutboxJob();
  startLineMaintenanceJob();
  console.log('[Jobs] All cron jobs started');
};

module.exports = { startAllJobs };
