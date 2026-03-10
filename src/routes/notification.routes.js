const express = require("express");
const router = express.Router();

const { createNotification } = require("../controllers/notification.controller");

router.post("/", createNotification);

module.exports = router;