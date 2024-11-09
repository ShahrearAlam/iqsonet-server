const express = require("express");
const router = express.Router();

const {
  getNotification,
  seenNotification,
  readNotification
} = require("../../controllers/frontend/notification.controller");

const { isAuthenticated } = require("../../middlewares/auth.middleware");

// Get notification particuller user
router.get("/:id", isAuthenticated, getNotification);

// seen notification by userId
router.post("/seen_notification/:id", isAuthenticated, seenNotification);

router.post("/read_notification/:notificationId", isAuthenticated, readNotification);

module.exports = router;
