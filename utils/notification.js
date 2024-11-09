const { NotificationModel } = require("../models/notification.model");
const { UserConnectionModel } = require("../models/userConnection.model");


const createNotification = async ({ type, userId, postId, commentId, replyId, recipientId, message }) => {

	const query = { user: userId, type, recipient: recipientId };
	if (postId) {
		query.post = postId;
	}
	if (commentId) {
		query.comment = commentId;
	}
	if (replyId) {
		query.reply = replyId;
	}
	const notificationExist = await NotificationModel.findOne(query);

	const connectUser = await UserConnectionModel
		.findOne({ userId: recipientId })
		.select({ socketId: 1 });

	if (!notificationExist) {

		const newNotification = new NotificationModel({
			type,
			user: userId,
			post: postId,
			comment: commentId,
			reply: replyId,
			recipient: recipientId,
			message
		});

		await newNotification.populate({
			path: "user",
			select: "username personal.fullname personal.profilePicture",
		});

		const notificationData = await newNotification.save();
		if (connectUser) {
			global.io.to(connectUser?.socketId).emit('notification', notificationData);
		}
	}

	if (notificationExist && (type === "like" || type === "dislike")) {
		await NotificationModel.deleteOne({ _id: notificationExist.id });
		if (connectUser) {
			global.io.to(connectUser?.socketId).emit('removeNotification', notificationExist);
		}
	}

};

const deleteNotification = async (query) => {

	const replyNotifications = await NotificationModel.find(query);

	const deleteResult = await NotificationModel.deleteMany(query)

	if (deleteResult.deletedCount > 0) {

		replyNotifications.map(async (notification) => {

			const connectUser = await UserConnectionModel
				.findOne({ userId: notification.recipient })
				.select({ socketId: 1 });

			if (connectUser) {
				global.io.to(connectUser?.socketId).emit('removeNotification', notification);
			}
		})

	}

};

const getNotifications = async () => {
	const data = await NotificationModel.find({});
	return data;
};

module.exports = { createNotification, deleteNotification, getNotifications };
