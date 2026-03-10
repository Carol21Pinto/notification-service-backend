const express = require("express");
const cors = require("cors");
const { initScheduler } = require("./scheduler/scheduler");
const { sendToQueue } = require("./queue/rabbitmq");


require("./redis/redisClient");
require("./scheduler/scheduler");
const { connectQueue } = require("./queue/rabbitmq");
const notificationRoutes = require("./routes/notification.routes");
const { initSSE } = require("./sse/sseManager");

const app = express();

app.use(cors());
app.use(express.json());   // IMPORTANT

app.use("/notifications", notificationRoutes);

app.get("/notifications/stream", initSSE);

const PORT = 3000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  await connectQueue();

  initScheduler(sendToQueue);
});