const amqp = require("amqplib");
const { sendEvent } = require("../sse/sseManager");

async function startWorker() {

  const connection = await amqp.connect("amqp://localhost");

  const channel = await connection.createChannel();

  await channel.assertQueue("notification_queue");

  console.log("Worker started. Waiting for messages...");


  const MAX_RETRIES = 3;

channel.consume("notification_queue", async (msg) => {

  if (!msg) return;

  const data = JSON.parse(msg.content.toString());

  const retries = data.retries || 0;


  try {

    // Simulate notification sending
    const notification = {
      title: "Notification",
      message: data.message,
      timestamp: new Date()
    };

    console.log("Notification sent:", notification);

    sendEvent({
      type: "notification_processed",
      data: notification
    });

    channel.ack(msg);

  } catch (error) {

    console.error("Notification failed:", error);

    if (retries < MAX_RETRIES) {

      data.retries = retries + 1;

      console.log(`Retrying (${data.retries})...`);

      channel.sendToQueue(
        "notification_queue",
        Buffer.from(JSON.stringify(data))
      );

    } else {

      console.log("Moving to dead letter queue");

      channel.sendToQueue(
        "dead_letter_queue",
        Buffer.from(JSON.stringify(data))
      );

    }

    channel.ack(msg);
  }

});


}

startWorker();