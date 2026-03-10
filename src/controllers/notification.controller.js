const checkRateLimit = require("../services/rateLimiter");
const { sendToQueue } = require("../queue/rabbitmq");
const { addScheduled } = require("../scheduler/scheduler");

exports.createNotification = async (req, res) => {
  try {

    const { userId, message, scheduleAt } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        error: "userId and message are required"
      });
    }

    const allowed = await checkRateLimit(userId);

    if (!allowed) {
      return res.status(429).json({
        error: "Too many notifications"
      });
    }

    if (scheduleAt) {

  addScheduled({ userId, message, scheduleAt });

  return res.json({
    status: "scheduled",
    data: { userId, message, scheduleAt }
  });

}

    // Push job to RabbitMQ queue
    sendToQueue({ userId, message, scheduleAt });

    return res.status(200).json({
      status: "queued",
      data: { userId, message, scheduleAt }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};