const mongoose = require("mongoose");
const httpStatus = require("http-status");

const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");

const { ConnectionModel, ConnectionStatus } = require("../../models/connection.model");
const { UserModel, UserStatus } = require("../../models/user.model");
const { NotificationType } = require("../../models/notification.model");
const { createNotification } = require("../../utils/notification");


const sendFollowRequest = catchAsync(async (req, res) => {
  const { followeeId } = req.params;

  if (req.user.userId == followeeId) return apiResponse(res, httpStatus.BAD_REQUEST, { message: "Cannot send follow request to yourself" });

  const existingConnection = await ConnectionModel.findOne({
    follower: req.user.userId,
    followee: followeeId,
  });

  if (existingConnection) return apiResponse(res, httpStatus.BAD_REQUEST, { message: "Connection already exists." });

  const newConnection = new ConnectionModel({
    follower: req.user.userId,
    followee: followeeId,
    status: ConnectionStatus.requested,
  });

  await newConnection.save();


  // **  Notificatoin Start ** // 

  await createNotification({
    type: NotificationType.request,
    userId: req.user.userId,
    recipientId: followeeId,
    message: `sent you a friend request.`
  })

  // **  Notificatoin End ** // 


  return apiResponse(res, httpStatus.OK, { message: "Follow request sent." });
});

const acceptFollowRequest = catchAsync(async (req, res) => {
  const { connectionId } = req.params;

  const result = await ConnectionModel.updateOne(
    { _id: connectionId, followee: req.user.userId, status: ConnectionStatus.requested },
    { status: ConnectionStatus.accepted }
  );

  if (result.modifiedCount === 0) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Connection not found or not in pending status." });
  }


  // **  Notificatoin Start ** // 

  const connectionData = await ConnectionModel
    .findOne({ _id: connectionId, followee: req.user.userId })
    .select({ follower: 1 });

  await createNotification({
    type: NotificationType.accept,
    userId: req.user.userId,
    recipientId: connectionData.follower,
    message: `accepted you friend request.`
  })

  // **  Notificatoin End ** // 


  return apiResponse(res, httpStatus.OK, { message: "Follow request accepted." });
});

const declineFollowRequest = catchAsync(async (req, res) => {
  const { connectionId } = req.params;

  const result = await ConnectionModel.updateOne(
    { _id: connectionId, followee: req.user.userId, status: ConnectionStatus.requested },
    { status: ConnectionStatus.declined }
  );

  if (result.modifiedCount === 0) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Connection not found or not in pending status." });
  }

  return apiResponse(res, httpStatus.OK, { message: "Follow request declined." });
});

const cancelFollowRequest = catchAsync(async (req, res) => {
  const { connectionId } = req.params;

  const result = await ConnectionModel.deleteOne(
    { _id: connectionId, followee: req.user.userId, status: ConnectionStatus.requested }
  );

  if (result.deletedCount === 0) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "No pending follow request found." });
  }

  return apiResponse(res, httpStatus.OK, { message: "Follow request canceled." });
});

const unfollow = catchAsync(async (req, res) => {
  const { followeeId } = req.params;

  if (req.user.userId == followeeId) return apiResponse(res, httpStatus.BAD_REQUEST, { message: "Cannot send unfollow request to yourself" });

  const deletedConnection = await ConnectionModel.findOneAndDelete({
    follower: req.user.userId,
    followee: followeeId,
    status: ConnectionStatus.accepted,
  });

  if (!deletedConnection) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "No existing connection to unfollow." });
  }

  return apiResponse(res, httpStatus.OK, { message: "Unfollowed successfully." });
});

const removeFollower = catchAsync(async (req, res) => {
  const { followerId } = req.params;

  if (req.user.userId == followerId) return apiResponse(res, httpStatus.BAD_REQUEST, { message: "Cannot remove yourself as a follower." });

  const result = await ConnectionModel.findOneAndDelete({
    follower: followerId,
    followee: req.user.userId,
    status: ConnectionStatus.accepted
  });

  if (!result) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Connection not found or not in pending status." });
  }

  return apiResponse(res, httpStatus.OK, { message: "Follower removed." });
});

const getFollowersList = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const followers = await ConnectionModel.find({
    followee: userId,
    status: ConnectionStatus.accepted,
  }).populate({
    path: "follower",
    select: "username personal.fullname personal.profilePicture",
  });

  return apiResponse(res, httpStatus.OK, { data: { followers, followersCount: followers.length }, message: "Followers list retrieved." });
});

const getFollowingList = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const following = await ConnectionModel.find({
    follower: userId,
    status: ConnectionStatus.accepted,
  }).populate({
    path: "followee",
    select: "username personal.fullname personal.profilePicture",
  });

  return apiResponse(res, httpStatus.OK, { data: { following, followingCount: following.length }, message: "Following list retrieved." });
});

const getFollowRequestsList = catchAsync(async (req, res) => {

  const followRequests = await ConnectionModel.find({
    followee: req.user.userId,
    status: ConnectionStatus.requested,
  }).populate({
    path: "follower",
    select: "username personal.fullname personal.profilePicture",
  });

  return apiResponse(res, httpStatus.OK, { data: { followRequests, followRequestsCount: followRequests.length }, message: "Follow requests list retrieved." });
});

const getFollowSuggestionsList = catchAsync(async (req, res) => {
  const currentUser = req.user.userId;

  const followedUsers = await ConnectionModel.find({
    follower: currentUser,
  }).distinct("followee");

  const suggestions = await UserModel.aggregate([
    {
      $match: {
        "_id": { "$nin": [new mongoose.Types.ObjectId(currentUser), ...followedUsers.map(userId => new mongoose.Types.ObjectId(userId))] },
        status: UserStatus.active,
      }
    },
    { $sample: { size: 10 } },
    {
      $project: {
        username: 1,
        personal: {
          fullname: 1,
          profilePicture: 1,
        },
      },
    },
  ]);

  return apiResponse(res, httpStatus.OK, { data: suggestions, message: "Follow suggestions list retrieved." });
});

module.exports = {
  sendFollowRequest, acceptFollowRequest, declineFollowRequest, cancelFollowRequest, unfollow, removeFollower,
  getFollowersList, getFollowingList, getFollowRequestsList, getFollowSuggestionsList,
};
