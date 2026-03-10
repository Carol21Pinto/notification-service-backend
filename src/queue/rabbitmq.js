const amqp = require("amqplib");

let channel;

async function connectQueue() {
  const connection = await amqp.connect("amqp://localhost");

  channel = await connection.createChannel();

  await channel.assertQueue("notification_queue");
  await channel.assertQueue("dead_letter_queue");

  console.log("RabbitMQ connected");
}

function sendToQueue(data) {
  channel.sendToQueue(
    "notification_queue",
    Buffer.from(JSON.stringify(data))
  );
}

module.exports = {
  connectQueue,
  sendToQueue
};