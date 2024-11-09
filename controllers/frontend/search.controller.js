const httpStatus = require("http-status");

const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");

const { UserModel, UserStatus } = require("../../models/user.model");
const { PostModel, PostStatus, ReactionType } = require("../../models/post/post.model");
const { SearchHistoryModel, SearchHistoryType } = require("../../models/searchHistory.model");

const searchSuggestions = catchAsync(async (req, res) => {
  const { query } = req.query;

  // if (!query || query.trim().length === 0) {
  if (query.trim().length <= 3) {
    const searchHistory = await SearchHistoryModel
    .find({ user: req.user.userId })
    .sort({ createdAt: -1 })
    .limit(10);
    return apiResponse(res, httpStatus.OK, { data: { data: searchHistory, from: "search_history" }, message: "Search history results" });
  }

  const users = await UserModel.aggregate([
    {
      $match: {
        'personal.fullname': { $regex: new RegExp(query, 'i') },
        status: { $ne: UserStatus.deleted }
      }
    },
    { $sample: { size: 10 } },
    {
      $project: {
        username: 1,
        'personal.fullname': 1,
        'personal.profilePicture': 1
      }
    }
  ]);

  const posts = await PostModel.aggregate([
    {
      $match: {
        body: { $regex: new RegExp(query, 'i') },
        status: PostStatus.active
      }
    },
    { $sample: { size: 10 } },
    {
      $project: {
        user: 1,
        body: 1,
        pictures: 1,
        mentions: 1,
        comments: 1,
        reactions: 1,
        edits: 1,
        accessibility: 1,
      }
    }
  ]);

  await UserModel.populate(posts, { path: "user", select: { _id: 1, username: 1, 'personal.fullname': 1, 'personal.profilePicture': 1 } });

  const combinedSuggestions = [
    ...users.map(user => ({ type: 'user', ...user })),
    ...posts.map(post => ({ type: 'post', ...post })),
  ];

  return apiResponse(res, httpStatus.OK, { data: { data: combinedSuggestions, from: "search_query" }, message: "Search suggestions successful" });
});

const detailedSearchAll = catchAsync(async (req, res) => {
  const { query } = req.query;

  await SearchHistoryModel.create({ user: req.user.userId, text: query, type: SearchHistoryType.text });

  const users = await UserModel.aggregate([
    {
      $match: {
        'personal.fullname': { $regex: new RegExp(query, 'i') },
        status: { $ne: UserStatus.deleted }
      }
    },
    { $sample: { size: 10 } },
    {
      $project: {
        username: 1,
        'personal.fullname': 1,
        'personal.profilePicture': 1
      }
    }
  ]);

  const posts = await PostModel.aggregate([
    {
      $match: {
        body: { $regex: new RegExp(query, 'i') },
        status: PostStatus.active
      }
    },
    { $sample: { size: 10 } },
    {
      $project: {
        user: 1,
        body: 1,
        pictures: 1,
        mentions: 1,
        comments: 1,
        reactions: 1,
        edits: 1,
        accessibility: 1,
      }
    }
  ]);

  await UserModel.populate(posts, { path: "user", select: { _id: 1, username: 1, 'personal.fullname': 1, 'personal.profilePicture': 1 } });

  return apiResponse(res, httpStatus.OK, { data: { users, posts }, message: "Detailed search successful" });
});

const detailedSearchUsers = catchAsync(async (req, res) => {
  const { query } = req.query;

  const users = await UserModel.aggregate([
    {
      $match: {
        'personal.fullname': { $regex: new RegExp(query, 'i') },
        status: { $ne: UserStatus.deleted }
      }
    },
    { $sample: { size: 10 } },
    {
      $project: {
        username: 1,
        'personal.fullname': 1,
        'personal.profilePicture': 1
      }
    }
  ]);

  return apiResponse(res, httpStatus.OK, { data: { users }, message: "Detailed search successful" });
});

const detailedSearchPosts = catchAsync(async (req, res) => {
  const { query } = req.query;

  const posts = await PostModel.aggregate([
    {
      $match: {
        body: { $regex: new RegExp(query, 'i') },
        status: PostStatus.active
      }
    },
    { $sample: { size: 10 } },
    {
      $project: {
        user: 1,
        body: 1,
        pictures: 1,
        mentions: 1,
        comments: 1,
        reactions: 1,
        edits: 1,
        accessibility: 1,
      }
    }
  ]);

  await UserModel.populate(posts, { path: "user", select: { _id: 1, username: 1, 'personal.fullname': 1, 'personal.profilePicture': 1 } });

  return apiResponse(res, httpStatus.OK, { data: { posts }, message: "Detailed search successful" });
});

const searchHistoryAll = catchAsync(async (req, res) => {
  const searchHistory = await SearchHistoryModel.find({ user: req.user.userId })
    .sort({ createdAt: -1 })
  // .limit(10);

  return apiResponse(res, httpStatus.OK, { data: searchHistory, message: "Search history retrieved successfully" });
});

const clearSearchHistory = catchAsync(async (req, res) => {

  await SearchHistoryModel.deleteMany({ user: req.user.userId });

  return apiResponse(res, httpStatus.OK, { message: "Search history has been cleared" });
});

module.exports = {
  searchSuggestions,
  detailedSearchAll, detailedSearchUsers, detailedSearchPosts,
  searchHistoryAll, clearSearchHistory,
};
