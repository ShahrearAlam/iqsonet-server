const httpStatus = require("http-status");

const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { NotificationModel, NotificationStatus, NotificationReadingStatus } = require("../../models/notification.model");


const getNotification = catchAsync(async (req, res) => {
  const { id } = req.params;

  const allNotification = await NotificationModel
    .find({ recipient: id })
    .sort({ createdAt: -1 })
    .limit(40)
    .populate({
      path: "user",
      select: "username personal.fullname personal.profilePicture",
    });

  const unreadNotification = await NotificationModel
    .find({ recipient: id, readingStatus: NotificationReadingStatus.unread })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate({
      path: "user",
      select: "username personal.fullname personal.profilePicture",
    });

  const unseenNotificationCount = await NotificationModel
    .count({ recipient: id, status: NotificationStatus.sent })

  return apiResponse(res, httpStatus.OK, { data: { allNotification, unreadNotification, unseenNotificationCount }, message: "Notifications successfully retrieved." });
});

const seenNotification = catchAsync(async (req, res) => {

  const { id } = req.params;

  const data = await NotificationModel
    .updateMany({ recipient: id }, { $set: { status: NotificationStatus.seen } });

  if (data.modifiedCount == 0) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Notification not found, update failed." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "Notification successfully updated." });
});

const readNotification = catchAsync(async (req, res) => {

  const { notificationId } = req.params;

  const data = await NotificationModel
    .findOneAndUpdate(
      { _id: notificationId },
      { $set: { readingStatus: NotificationReadingStatus.read } },
      { new: true }
    )
    .populate({
      path: "user",
      select: "username personal.fullname personal.profilePicture",
    });

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Notification not found, update failed." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "Notification successfully updated." });
});

module.exports = {
  getNotification,
  seenNotification,
  readNotification
}
