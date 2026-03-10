const cron = require("node-cron");

let scheduledNotifications = [];
let queueSender = null;

function initScheduler(sendToQueue) {
  queueSender = sendToQueue;
}

function addScheduled(notification) {
  scheduledNotifications.push(notification);
}

cron.schedule("*/5 * * * * *", () => {

  const now = new Date();

  scheduledNotifications = scheduledNotifications.filter((n) => {

    if (new Date(n.scheduleAt) <= now) {

      console.log("Scheduling notification:", n);

      if (queueSender) {
        queueSender(n);
      }

      return false;
    }

    return true;
  });

});

module.exports = {
  initScheduler,
  addScheduled
};