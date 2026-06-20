'use strict';

const { startSlaJob } = require('./slaJob');
const { startEscalationJob } = require('./escalationJob');

const startAllJobs = () => {
  startSlaJob();
  startEscalationJob();
  console.log('[Jobs] All cron jobs started');
};

module.exports = { startAllJobs };
