'use strict';

const { startSlaJob } = require('./slaJob');
const { startEscalationJob } = require('./escalationJob');
const { startNotificationOutboxJob } = require('./notificationOutboxJob');

const startAllJobs = () => {
  startSlaJob();
  startEscalationJob();
  startNotificationOutboxJob();
  console.log('[Jobs] All cron jobs started');
};

module.exports = { startAllJobs };
