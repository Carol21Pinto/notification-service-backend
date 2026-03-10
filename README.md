# Notification Service using Node.js

## Overview

This is a **production-grade backend notification service** built with Node.js and Express.js. The system is designed to handle instant notifications, scheduled notifications, rate limiting, and asynchronous processing at scale. It leverages modern backend technologies including RabbitMQ for message queuing, Redis for caching and rate limiting, and Server-Sent Events (SSE) for real-time updates.

The service is architected with scalability and reliability in mind, incorporating retry mechanisms, dead-letter queues for failure handling, and worker services for distributed message processing.

---

## Features

- ✅ **Instant Notifications** - Process notifications immediately upon request
- ✅ **Scheduled Notifications** - Queue notifications for future delivery using cron scheduling
- ✅ **Rate Limiting** - Enforce limits (5 notifications per minute per user) using Redis
- ✅ **Asynchronous Processing** - Distribute load using RabbitMQ message queues
- ✅ **Worker Services** - Scale horizontally with independent worker nodes
- ✅ **Retry Mechanism** - Automatic retry logic with exponential backoff (up to 3 retries)
- ✅ **Dead Letter Queue (DLQ)** - Capture and store failed messages for analysis
- ✅ **Real-time Updates** - Stream notifications to clients using Server-Sent Events (SSE)
- ✅ **High Availability** - Persistent message queuing and failure recovery

---

## System Architecture

### Architecture Flow Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                      │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  │ POST /notifications
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Express API Server (Port 3000)                 │
│   - Validate Request                                        │
│   - Check User Authentication                              │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│           Redis Rate Limiter (Port 6379)                    │
│   - 5 notifications per minute per user                     │
│   - Return 429 if limit exceeded                            │
└──────────┬─────────────────────────┬───────────────────────┘
           │                         │
           │ Rate Limit OK           │ Rate Limit Exceeded
           ▼                         ▼
    ┌──────────────┐         ┌──────────────────┐
    │ Check if     │         │ Return HTTP 429  │
    │ Scheduled    │         │ Too Many Requests│
    │ Time         │         └──────────────────┘
    └──────┬───────┘
           │
      ┌────┴────┐
      │          │
      ▼          ▼
   Immediate   Scheduled
      │          │
      │          ▼
      │    ┌──────────────────────┐
      │    │  Node-Cron Scheduler │
      │    │  (Every 5 seconds)   │
      │    │ - Check if time ready│
      │    │ - Push to queue      │
      │    └──────────┬───────────┘
      │              │
      └──────┬───────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────┐
│     RabbitMQ Message Queue (Port 5672)                       │
│  - notification_queue: Active notifications                 │
│  - dead_letter_queue: Failed messages                        │
└──────────┬──────────────────────────┬──────────────────────┘
           │                          │
           │                          ▼
           │                   ┌──────────────────┐
           │                   │  Dead Letter     │
           │                   │  Analysis Tools  │
           │                   └──────────────────┘
           ▼
┌──────────────────────────────────────────────────────────────┐
│        Worker Service (Independent Process)                  │
│  - Consume from notification_queue                           │
│  - Execute notification send logic                           │
│  - Implement retry logic (max 3 attempts)                    │
│  - Handle failures gracefully                                │
└──────────┬───────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│        Notification Delivery Handler                         │
│  - Process notification details                             │
│  - Format message content                                    │
│  - Execute delivery mechanism                               │
└──────────┬───────────────────────────────────────────────────┘
           │
      ┌────┴────────────────────────────┐
      │                                  │
      ▼                                  ▼
  ┌────────────┐                   ┌────────────┐
  │  Success   │                   │  Failure   │
  │  - Update  │                   │  - Retry   │
  │    Status  │                   │  - Check   │
  │  - Notify  │                   │    Count   │
  │    Client  │                   └────┬───────┘
  └────┬───────┘                        │
       │                         ┌──────┴──────┐
       │                         │             │
       │                    < 3 Retries   >= 3 Retries
       │                         │             │
       │                         ▼             ▼
       │                    ┌─────────┐  ┌──────────────┐
       │                    │ Requeue │  │ Move to DLQ  │
       │                    └────┬────┘  └──────────────┘
       │                         │
       │    ┌────────────────────┘
       │    │
       ▼    ▼
┌──────────────────────────────────────────────────────────────┐
│          Server-Sent Events (SSE) Stream                      │
│  GET /notifications/stream                                   │
│  - Real-time client notification delivery                    │
│  - Connected clients receive update events                   │
│  - Stream persists until connection closes                   │
└──────────────────────────────────────────────────────────────┘
```

### Key Architecture Components

1. **API Server**: Express.js server that receives notification requests
2. **Rate Limiter**: Redis-based rate limiting to prevent abuse
3. **Scheduler**: Node-cron for handling scheduled notification timing
4. **Message Queue**: RabbitMQ for decoupling request/response and processing
5. **Worker Service**: Separate process that consumes queue messages
6. **SSE Manager**: Broadcasts real-time updates to connected clients
7. **Dead Letter Queue**: Captures failed messages for debugging

---

## Tech Stack

| Technology | Purpose | Version |
|-----------|---------|---------|
| **Node.js** | Runtime environment | 16.x or higher |
| **Express.js** | Web framework | 4.x |
| **RabbitMQ** | Message broker | 3.x |
| **Redis** | In-memory data store | 6.x or higher |
| **Node-Cron** | Task scheduling | 3.x |
| **Amqplib** | RabbitMQ client | Latest |
| **Redis Client** | Redis integration | Latest |

---

## Project Structure
```
notification-service/
│
├── src/
│   ├── controllers/
│   │   └── notification.controller.js       # Request handlers
│   │
│   ├── queue/
│   │   └── rabbitmq.js                      # RabbitMQ connection & setup
│   │
│   ├── redis/
│   │   └── redisClient.js                   # Redis client initialization
│   │
│   ├── routes/
│   │   └── notification.routes.js           # API route definitions
│   │
│   ├── scheduler/
│   │   └── scheduler.js                     # Cron-based scheduler
│   │
│   ├── services/
│   │   ├── notification.service.js          # Business logic
│   │   └── rateLimiter.js                   # Rate limiting logic
│   │
│   ├── sse/
│   │   └── sseManager.js                    # Server-Sent Events handler
│   │
│   ├── worker/
│   │   └── notification.worker.js           # Message queue consumer
│   │
│   └── server.js                            # Application entry point
│
├── package.json
├── package-lock.json
└── README.md
```

---

## Installation Guide

### Prerequisites

Before installing, ensure you have the following installed:

- **Node.js** (v16.x or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **RabbitMQ** - [Download](https://www.rabbitmq.com/download.html)
- **Redis** - [Download](https://redis.io/download)

### Step 1: Clone the Repository
```bash
git clone https://github.com/Carol21Pinto/notification-service-backend.git
cd notification-service
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the project root:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# RabbitMQ Configuration
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_WINDOW=60000          # 1 minute in milliseconds
RATE_LIMIT_MAX_REQUESTS=5        # Max 5 requests per window per user

# Notification Processing
MAX_RETRIES=3
RETRY_DELAY=5000                 # 5 seconds between retries
```

### Step 4: Verify Dependencies are Running
```bash
# Check RabbitMQ
rabbitmqctl status

# Check Redis (in another terminal)
redis-cli ping
# Should return: PONG
```

---

## Running the Application

### Option 1: Development Mode (with auto-reload)

Install `nodemon` globally or as a dev dependency:
```bash
npm install --save-dev nodemon
npm run dev
```

### Option 2: Production Mode
```bash
npm start
```

### Start the Worker Service (Separate Terminal)
```bash
npm run worker
```

### Verify Services are Running
```bash
# API Server should be running
curl http://localhost:3000/health

# Expected output:
# { "status": "ok" }
```

---

## API Documentation

### 1. Create Instant Notification

**Endpoint:** `POST /notifications`

**Description:** Send a notification immediately.

**Request Body:**
```json
{
  "userId": "user1",
  "message": "Hello, this is your notification!",
  "title": "Notification Title",
  "metadata": {
    "source": "system",
    "priority": "high"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notificationId": "notif_abc123",
    "userId": "user1",
    "message": "Hello, this is your notification!",
    "status": "queued",
    "scheduledAt": null
  }
}
```

**Response (429 Too Many Requests):**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Maximum 5 notifications per minute allowed."
}
```

---

### 2. Create Scheduled Notification

**Endpoint:** `POST /notifications`

**Description:** Schedule a notification for future delivery.

**Request Body:**
```json
{
  "userId": "user2",
  "message": "This is a scheduled notification",
  "title": "Scheduled Alert",
  "scheduledAt": "2026-03-15T10:30:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notificationId": "notif_def456",
    "userId": "user2",
    "message": "This is a scheduled notification",
    "status": "scheduled",
    "scheduledAt": "2026-03-15T10:30:00Z"
  }
}
```

---

### 3. Get Notification Status

**Endpoint:** `GET /notifications/:notificationId`

**Description:** Retrieve the current status of a notification.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notificationId": "notif_abc123",
    "userId": "user1",
    "status": "delivered",
    "createdAt": "2026-03-10T12:00:00Z",
    "deliveredAt": "2026-03-10T12:00:05Z",
    "retryCount": 0
  }
}
```

---

### 4. Stream Real-time Notifications

**Endpoint:** `GET /notifications/stream`

**Description:** Establish a Server-Sent Events connection to receive real-time notification updates.

**Headers:**
```
Accept: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Example Usage (JavaScript Client):**
```javascript
const eventSource = new EventSource('/notifications/stream');

eventSource.addEventListener('notification', (event) => {
  const data = JSON.parse(event.data);
  console.log('Notification received:', data);
});

eventSource.onerror = () => {
  console.log('Connection closed');
  eventSource.close();
};
```

**Server-Sent Event Format:**
```
event: notification
data: {"notificationId":"notif_abc123","userId":"user1","status":"delivered"}

event: notification
data: {"notificationId":"notif_def456","userId":"user2","status":"failed"}
```

---

## RabbitMQ Worker Setup

### Understanding the Worker Service

The worker service is a separate Node.js process that:

1. Connects to RabbitMQ
2. Consumes messages from `notification_queue`
3. Processes notifications asynchronously
4. Implements retry logic for failed deliveries
5. Moves failed messages to `dead_letter_queue` after max retries

### Starting the Worker Service

**In a separate terminal window:**
```bash
npm run worker
```

**Expected Output:**
```
[Worker] Connected to RabbitMQ
[Worker] Listening on notification_queue
[Worker] Waiting for messages...
```

### Worker Configuration

The worker respects the following environment variables:
```env
MAX_RETRIES=3                    # Maximum retry attempts
RETRY_DELAY=5000                 # Delay between retries (ms)
RABBITMQ_PREFETCH=10             # Message prefetch count
```

### How the Worker Processes Messages

1. **Receive Message**: Worker consumes a message from `notification_queue`
2. **Parse Payload**: Extract notification details from the message
3. **Execute Delivery**: Attempt to send the notification
4. **Handle Success**: Acknowledge message (auto-delete from queue)
5. **Handle Failure**: Check retry count
   - If retries < MAX_RETRIES: Requeue message with updated retry count
   - If retries >= MAX_RETRIES: Move to `dead_letter_queue`

---

## Scheduled Notifications

### How Scheduling Works

The scheduler is a built-in component of the API server that:

1. Runs every **5 seconds** (configurable)
2. Queries the database for pending scheduled notifications
3. Checks if `scheduledAt` time has arrived
4. Moves ready notifications to RabbitMQ `notification_queue`
5. Updates notification status to "queued"

### Implementation Details

**File:** `src/scheduler/scheduler.js`

**Key Function:**
```javascript
// Runs every 5 seconds
cron.schedule('*/5 * * * * *', async () => {
  try {
    const readyNotifications = await Notification.find({
      status: 'scheduled',
      scheduledAt: { $lte: new Date() }
    });
    
    for (const notification of readyNotifications) {
      await pushToQueue(notification);
      await notification.updateOne({ status: 'queued' });
    }
  } catch (error) {
    console.error('Scheduler error:', error);
  }
});
```

### Scheduling a Notification

To schedule a notification for the future:
```bash
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "message": "Scheduled for later",
    "scheduledAt": "2026-03-15T14:00:00Z"
  }'
```

The notification will be queued automatically when the scheduled time arrives.

---

## Rate Limiting

### Why Rate Limiting?

Rate limiting protects the system from:

- **Abuse**: Malicious users spamming notifications
- **Overload**: Accidental DoS from buggy clients
- **Cost Control**: Preventing excessive infrastructure usage
- **Fair Resource Sharing**: Ensuring all users get fair access

### Implementation

**Technology:** Redis

**Strategy:** Token Bucket Algorithm with sliding windows

**Configuration:**
```env
RATE_LIMIT_WINDOW=60000     # 1 minute (in milliseconds)
RATE_LIMIT_MAX_REQUESTS=5   # Maximum 5 requests per window
```

### How It Works

1. **Check Current Usage**: Query Redis for user's notification count in current window
2. **Increment Counter**: Increase count if under limit
3. **Set Expiry**: Redis key expires after RATE_LIMIT_WINDOW
4. **Return Status**:
   - If within limit: **200 OK** - Proceed with request
   - If exceeded: **429 Too Many Requests** - Reject request

### Rate Limit Response

When rate limit is exceeded:
```bash
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "success": false,
  "error": "Rate limit exceeded. Maximum 5 notifications per minute allowed.",
  "retryAfter": 45
}
```

The `retryAfter` header indicates seconds to wait before retrying.

### Redis Keys Used
```
notification:ratelimit:user1 = 3              # 3 notifications sent this minute
notification:ratelimit:user2 = 5              # At limit
```

Keys expire after 60 seconds automatically.

---

## Failure Handling (Retries + Dead Letter Queue)

### Retry Mechanism

When a notification delivery fails:

1. **First Attempt Fails**: Worker catches exception
2. **Check Retry Count**: Is it less than MAX_RETRIES (3)?
3. **Retry Required**: Requeue message with incremented retry count
4. **Exponential Backoff**: Add delay between retries (e.g., 5s, 10s, 15s)
5. **Final Failure**: After 3 retries, move to Dead Letter Queue

### Retry Logic Implementation
```javascript
async function processNotification(message) {
  const { notificationId, retryCount = 0 } = message;
  
  try {
    // Attempt to send notification
    await sendNotification(notificationId);
    return { success: true };
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      // Requeue with incremented retry count
      const delay = RETRY_DELAY * (retryCount + 1); // Exponential backoff
      await requeue(message, retryCount + 1, delay);
      return { success: false, retry: true };
    } else {
      // Move to DLQ
      await moveToDeadLetterQueue(message);
      return { success: false, dlq: true };
    }
  }
}
```

### Dead Letter Queue (DLQ)

**Purpose:** Store failed messages for later analysis and recovery

**Queue Name:** `dead_letter_queue`

**What Gets Stored:**
```json
{
  "notificationId": "notif_abc123",
  "userId": "user1",
  "message": "Hello notification",
  "failureReason": "Delivery service timeout",
  "retryCount": 3,
  "timestamp": "2026-03-10T12:00:30Z",
  "originalError": "Error message details"
}
```

### Monitoring DLQ

To process dead-letter messages:
```bash
# Get DLQ message count
curl http://localhost:15672/api/queues/%2F/dead_letter_queue \
  -u guest:guest | jq '.messages'

# Consume and inspect a failed message
npm run inspect-dlq
```

### Recovery Strategy

1. **Analyze**: Check failure reason from DLQ message
2. **Identify Root Cause**: Was it temporary or permanent?
3. **Fix Issue**: Update service/configuration if needed
4. **Requeue**: Move corrected messages back to `notification_queue`
5. **Monitor**: Track if requeued messages succeed

---

## Real-time Updates using SSE

### What is Server-Sent Events (SSE)?

SSE is a simple, one-directional communication protocol that:

- Opens a persistent connection from server to client
- Allows server to push updates to client
- Works over standard HTTP
- Lighter than WebSockets for unidirectional communication

### Why SSE Over WebSockets?

- **Simpler**: No complex bidirectional protocol
- **Automatic Reconnection**: Built-in reconnect logic
- **Lower Overhead**: Lighter than WebSocket handshake
- **Sufficient**: For notification delivery (unidirectional)

### Implementing SSE Client

**JavaScript Example:**
```javascript
// Connect to notification stream
const eventSource = new EventSource('/notifications/stream?userId=user1');

// Listen for notification events
eventSource.addEventListener('notification', (event) => {
  try {
    const notification = JSON.parse(event.data);
    console.log('Received notification:', notification);
    
    // Update UI
    displayNotification(notification);
    
  } catch (error) {
    console.error('Error parsing event:', error);
  }
});

// Handle connection errors
eventSource.onerror = () => {
  if (eventSource.readyState === EventSource.CLOSED) {
    console.log('Connection closed');
  } else {
    console.log('Connection error, retrying...');
  }
};

// Optional: Close connection
function closeStream() {
  eventSource.close();
}
```

### Server-Side SSE Manager

**File:** `src/sse/sseManager.js`

**Key Features:**
```javascript
class SSEManager {
  constructor() {
    this.clients = new Map(); // Store connected clients
  }
  
  // Add a client connection
  addClient(userId, response) {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, []);
    }
    this.clients.get(userId).push(response);
  }
  
  // Remove disconnected client
  removeClient(userId, response) {
    const clients = this.clients.get(userId) || [];
    const index = clients.indexOf(response);
    if (index > -1) {
      clients.splice(index, 1);
    }
  }
  
  // Broadcast notification to all connected clients
  broadcast(userId, notificationData) {
    const clients = this.clients.get(userId) || [];
    clients.forEach(response => {
      response.write(`data: ${JSON.stringify(notificationData)}\n\n`);
    });
  }
}
```

### Connecting to SSE Stream

**curl Example:**
```bash
curl -N http://localhost:3000/notifications/stream?userId=user1
```

**Response Stream:**
```
data: {"notificationId":"notif_abc123","message":"Hello!","status":"delivered"}

data: {"notificationId":"notif_def456","message":"Alert","status":"delivered"}
```

### Integration with Notification Processing

When a notification is delivered:

1. Worker sends notification successfully
2. Calls `sseManager.broadcast(userId, notificationData)`
3. SSEManager sends event to all connected clients for that user
4. Clients receive update via EventSource listener

---

## Example API Requests

### 1. Create Instant Notification
```bash
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user1",
    "message": "This is an instant notification",
    "title": "Instant Alert"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notificationId": "notif_1234567890",
    "userId": "user1",
    "status": "queued",
    "createdAt": "2026-03-10T12:30:45Z"
  }
}
```

---

### 2. Create Scheduled Notification (30 minutes from now)
```bash
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user2",
    "message": "Your appointment reminder",
    "title": "Appointment in 30 minutes",
    "scheduledAt": "2026-03-10T13:00:00Z"
  }'
```

---

### 3. Stream Notifications for a User
```bash
curl -N http://localhost:3000/notifications/stream?userId=user1 \
  -H "Accept: text/event-stream"
```

Keep this connection open in a terminal to see real-time updates.

---

### 4. Test Rate Limiting (5 requests in quick succession)
```bash
for i in {1..7}; do
  curl -X POST http://localhost:3000/notifications \
    -H "Content-Type: application/json" \
    -d "{\"userId\": \"user1\", \"message\": \"Request $i\"}"
  echo "\nRequest $i sent"
  sleep 0.5
done
```

The 6th and 7th requests will return **429 Too Many Requests**.

---

### 5. Retrieve Notification Status
```bash
curl http://localhost:3000/notifications/notif_1234567890
```

---

## Future Improvements

### Phase 2 Enhancements

- **Multi-Channel Delivery**: Email, SMS, Push notifications in addition to API
- **User Preferences**: Allow users to configure notification preferences
- **Priority Queues**: Implement different queue priorities (urgent, normal, low)
- **Webhook Support**: Send notifications to external webhooks
- **Analytics Dashboard**: Real-time metrics and delivery statistics
- **Template System**: Notification templates with variable substitution
- **Database Integration**: Persist notifications to MongoDB/PostgreSQL
- **Authentication**: JWT-based API authentication
- **Notification History**: Retrieve past notifications for users
- **Batch Operations**: Send notifications to multiple users at once

### Phase 3 Advanced Features

- **Distributed Tracing**: OpenTelemetry integration for monitoring
- **Machine Learning**: Optimal delivery time prediction
- **A/B Testing**: Test different notification formats
- **Notification Preferences Learning**: Auto-learn user preferences
- **Multi-tenancy Support**: Support multiple organizations
- **Audit Logging**: Comprehensive audit trail for compliance
- **Geolocation-based Notifications**: Target based on user location
- **Notification Grouping**: Intelligently group related notifications

### Performance Optimizations

- **Implement Connection Pooling**: For RabbitMQ and Redis
- **Caching Strategy**: Cache frequently accessed data
- **Compression**: Gzip response compression
- **Database Indexing**: Optimize query performance
- **Load Balancing**: Distribute requests across multiple instances

---

## Conclusion

The **Notification Service** is a robust, scalable backend system designed to handle notifications at enterprise scale. By leveraging RabbitMQ for asynchronous processing, Redis for rate limiting, and Node.js for high-performance I/O, the system achieves:

- **High Throughput**: Process thousands of notifications per second
- **Reliability**: Built-in retry mechanism and dead-letter queue
- **Scalability**: Horizontal scaling with independent worker services
- **Real-time Feedback**: SSE for instant client-side updates
- **Developer Experience**: Clean architecture and well-documented API

The modular design allows for easy extension and customization to meet specific business requirements. Whether you're building a small notification system or a large-scale enterprise solution, this service provides a solid foundation.

---

**Last Updated:** March 10, 2026

**Developer:** Carol Pinto  
**GitHub Repository:** https://github.com/Carol21Pinto/notification-service-backend.git
