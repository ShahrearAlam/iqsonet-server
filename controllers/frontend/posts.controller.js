const httpStatus = require("http-status");

const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");

const { PostModel, PostStatus, ReactionType, AccessibilityType } = require("../../models/post/post.model");
const { SavedPostModel } = require("../../models/post/save.model");
const { ReportedPostModel } = require("../../models/post/report.model");
const { ConnectionModel, ConnectionStatus } = require("../../models/connection.model");
const { PointModel } = require("../../models/point.model");

// Posts
const { createNotification, deleteNotification } = require("../../utils/notification");
const { NotificationModel, NotificationType } = require("../../models/notification.model");
const { UserConnectionModel } = require("../../models/userConnection.model");


const getPosts = catchAsync(async (req, res) => {
  const postsCount = 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const skipCount = (page - 1) * postsCount;

  const data = await PostModel
    .find({ user: req.user.userId, status: PostStatus.active })
    .sort({ createdAt: -1 })
    .skip(skipCount)
    .limit(postsCount)
    .populate({
      path: "user comments.user comments.replies.user",
      select: "username personal.fullname personal.profilePicture",
    })
    .populate({
      path: "share",
      select: "",
      populate: {
        path: 'user comments.user comments.replies.user',
        select: "username personal.fullname personal.profilePicture",
      }
    })

  let newData = [];
  data.map(each => {
    if (each.share && (each.share.status !== 'active' || each.share.accessibility !== 'public')) {
      each = each.toJSON();
      delete each.share;
      each.share = 'No Content';
    }
    newData.push(each);
  })

  return apiResponse(res, httpStatus.OK, { data: { data: newData, page }, message: "Successfully retrieved all posts of current user." });
});

const getPostsByUser = catchAsync(async (req, res) => {
  const postsCount = 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const skipCount = (page - 1) * postsCount;

  const data = await PostModel
    .find({ user: req.params.userId, status: PostStatus.active })
    .sort({ createdAt: -1 })
    .skip(skipCount)
    .limit(postsCount)
    .populate({
      path: "user comments.user comments.replies.user",
      select: "username personal.fullname personal.profilePicture",
    })
    .populate({
      path: "share",
      select: "",
      populate: {
        path: 'user comments.user comments.replies.user',
        select: "username personal.fullname personal.profilePicture",
      }
    })

  let newData = [];
  data.map(each => {
    if (each.share && (each.share.status !== 'active' || each.share.accessibility !== 'public')) {
      each = each.toJSON();
      delete each.share;
      each.share = 'No Content';
    }
    newData.push(each);
  })

  return apiResponse(res, httpStatus.OK, { data: newData, message: "Successfully retrieved all posts by userId" });
});

const getPost = catchAsync(async (req, res) => {
  let data = await PostModel.findOne({ _id: req.params.postId, status: PostStatus.active })
    .populate({
      path: "user comments.user comments.replies.user",
      select: "username personal.fullname personal.profilePicture",
    })
    .populate({
      path: "share",
      select: "",
      populate: {
        path: 'user comments.user comments.replies.user',
        select: "username personal.fullname personal.profilePicture",
      }
    })

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "No post found." });
  if (data.share && (data.share.status !== 'active' || data.share.accessibility !== 'public')) {
    data = data.toJSON();
    delete data.share;
    data.share = 'No Content';
  }

  return apiResponse(res, httpStatus.OK, { data, message: "Post successfully retrieved." });
});

const addPost = catchAsync(async (req, res) => {
  const { body, pictures, accessibility } = req.body;

  const newPost = new PostModel({ user: req.user.userId, body, pictures, accessibility });
  await newPost.save();

  const data = await PostModel.findById(newPost?._id)
    .populate({
      path: "user comments.user comments.replies.user",
      select: "username personal.fullname personal.profilePicture",
    })

  return apiResponse(res, httpStatus.OK, { data, message: "Post successfully added." });
});

const updatePost = catchAsync(async (req, res) => {
  const { body, pictures, accessibility } = req.body;

  const data = await PostModel.updateOne(
    { _id: req.params.postId, user: req.user.userId, status: PostStatus.active },
    { body, pictures, accessibility }
  );

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Post not found, update failed." });

  const updatedPostData = await PostModel.findById(req.params.postId)
    .populate({
      path: "user comments.user comments.replies.user",
      select: "username personal.fullname personal.profilePicture",
    })

  return apiResponse(res, httpStatus.OK, { data: updatedPostData, message: "Post successfully updated." });
});

const deletePost = catchAsync(async (req, res) => {
  const data = await PostModel.updateOne(
    { _id: req.params.postId, user: req.user.userId, status: PostStatus.active },
    { status: PostStatus.deleted }
  );

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Post not found, deletion failed." });

  const deletedPost = await PostModel.findOne({ _id: req.params.postId });


  // **  Notificatoin Start ** //  

  await deleteNotification({ type: { $in: ["comment", "reply", "like", "dislike"] }, post: req.params.postId })

  // **  Notificatoin End ** //


  return apiResponse(res, httpStatus.OK, { data: deletedPost, message: "Post successfully deleted." });
});

// Comments

const commentLocks = {};
const addComment = catchAsync(async (req, res) => {
  const { postId, userId, body } = req.body;

  if (!commentLocks[`${userId}-${postId}`]) {
    commentLocks[`${userId}-${postId}`] = true;

    const post = await PostModel.findOne({ _id: postId, status: PostStatus.active });
    if (!post) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Post not found." });

    const isPostOwner = post.user.toString() === userId;
    const hasCommented = post.comments.some(comment => comment.user.toString() === userId);

    const latestPoint = await PointModel.findOne({ user: post.user }).sort({ createdAt: -1 });
    let cumulativePoints = 0;
    if (latestPoint) cumulativePoints = latestPoint.cumulativePoints;

    if (!isPostOwner && !hasCommented) {
      await PointModel.create({
        user: post.user,
        context: "comment",
        points: 2,
        cumulativePoints: cumulativePoints + 2,
        interactorId: userId,
        postId,
      });
    }

    post.comments.push({ user: userId, body });
    await post.save();

    const data = await PostModel
      .findOne({ _id: postId })
      .populate({
        path: "user comments.user comments.replies.user",
        select: "username personal.fullname personal.profilePicture",
      })

    // **  Notificatoin Start ** //  

    const postOwnerId = data.user._id.toString();

    if (postOwnerId !== userId) {
      const postCommentId = data?.comments[data?.comments?.length - 1]._id.toString();

      await createNotification({
        type: NotificationType.comment,
        userId,
        postId,
        commentId: postCommentId,
        recipientId: data.user._id,
        message: `has left a comment on your post.`
      })
    }

    // **  Notificatoin End ** //

    delete commentLocks[`${userId}-${postId}`];
    return apiResponse(res, httpStatus.OK, { data, message: "Comment successfully added." });
  } else {
    return apiResponse(res, httpStatus.CONFLICT, { message: "Please wait." });
  }
});

const updateComment = catchAsync(async (req, res) => {
  const { userId, postId, commentId, body } = req.body;

  const post = await PostModel.findOne({ _id: postId, status: PostStatus.active });
  if (!post) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Post not found." });

  const comment = post.comments.id(commentId);
  if (!comment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Comment not found." });

  if (comment.user != userId) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Not allowed." });

  comment.body = body;
  await post.save();

  const data = await PostModel
    .findOne({ _id: postId })
    .populate({
      path: "user comments.user comments.replies.user",
      select: "username personal.fullname personal.profilePicture",
    })

  return apiResponse(res, httpStatus.OK, { data, message: "Comment successfully updated." });
});

const deleteComment = catchAsync(async (req, res) => {
  const { userId, postId, commentId } = req.body;

  const post = await PostModel.findOne({ _id: postId, status: PostStatus.active });
  if (!post) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Post not found." });

  const comment = post.comments.id(commentId);
  if (!comment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Comment not found." });

  if (comment.user != userId) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Not allowed." });

  post.comments.pull(commentId);
  await post.save();

  const data = await PostModel
    .findOne({ _id: postId })
    .populate({
      path: "user comments.user comments.replies.user",
      select: "username personal.fullname personal.profilePicture",
    })


  // **  Notificatoin Start ** //  

  await deleteNotification({ type: { $in: ["comment", "reply", "like", "dislike"] }, post: postId, comment: commentId })

  // **  Notificatoin End ** //


  return apiResponse(res, httpStatus.OK, { data, message: "Comment successfully deleted." });
});

// Replies

const replyLocks = {};
const addReply = catchAsync(async (req, res) => {
  const { postId, commentId, userId, body } = req.body;

  if (!replyLocks[`${userId}-${commentId}`]) {
    replyLocks[`${userId}-${commentId}`] = true;

    const post = await PostModel.findOne({ _id: postId, status: PostStatus.active });
    if (!post) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Post not found." });

    const comment = post.comments.id(commentId);
    if (!comment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Comment not found." });

    const isCommentOwner = comment.user.toString() === userId;
    const hasReplied = comment.replies.some(reply => reply.user.toString() === userId);

    const latestPoint = await PointModel.findOne({ user: comment.user }).sort({ createdAt: -1 });
    let cumulativePoints = 0;
    if (latestPoint) cumulativePoints = latestPoint.cumulativePoints;

    if (!isCommentOwner && !hasReplied) {
      await PointModel.create({
        user: comment.user,
        context: "reply",
        points: 1,
        cumulativePoints: cumulativePoints + 1,
        interactorId: userId,
        postId,
        commentId,
      });
    }

    comment.replies.push({ user: userId, body });
    await post.save();

    const data = await PostModel
      .findOne({ _id: postId })
      .populate({
        path: "user comments.user comments.replies.user",
        select: "username personal.fullname personal.profilePicture",
      })

    // **  Notificatoin Start ** //  

    const postCommentOwnerId = comment.user.toString()

    if (postCommentOwnerId !== userId) {

      const postCommentReplyId = comment?.replies[comment?.replies?.length - 1]._id.toString();

      await createNotification({
        type: NotificationType.reply,
        userId,
        postId,
        commentId,
        replyId: postCommentReplyId,
        recipientId: postCommentOwnerId,
        message: `replied to your comment on post.`
      })
    }

    // **  Notificatoin End ** //  


    delete replyLocks[`${userId}-${commentId}`];
    return apiResponse(res, httpStatus.OK, { data, message: "Reply successfully added." });
  } else {
    return apiResponse(res, httpStatus.CONFLICT, { message: "Please wait." });
  }
});

const updateReply = catchAsync(async (req, res) => {
  const { postId, commentId, replyId, userId, body } = req.body;

  const post = await PostModel.findOne({ _id: postId, status: PostStatus.active });
  if (!post) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Post not found." });

  const comment = post.comments.id(commentId);
  if (!comment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Comment not found." });

  const reply = comment.replies.id(replyId);
  if (!reply) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Reply not found." });

  if (reply.user != userId) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Not allowed." });

  reply.body = body;
  await post.save();

  const data = await PostModel
    .findOne({ _id: postId })
    .populate({
      path: "user comments.user comments.replies.user",
      select: "username personal.fullname personal.profilePicture",
    })

  return apiResponse(res, httpStatus.OK, { data, message: "Reply successfully updated." });
});

const deleteReply = catchAsync(async (req, res) => {
  const { userId, postId, commentId, replyId } = req.body;

  const post = await PostModel.findOne({ _id: postId, status: PostStatus.active });
  if (!post) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Post not found." });

  const comment = post.comments.id(commentId);
  if (!comment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Comment not found." });

  const reply = comment.replies.id(replyId);
  if (!reply) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Reply not found." });

  if (reply.user != userId) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Not allowed." });

  comment.replies.pull(replyId);
  await post.save();

  const data = await PostModel
    .findOne({ _id: postId })
    .populate({
      path: "user comments.user comments.replies.user",
      select: "username personal.fullname personal.profilePicture",
    })


  // **  Notificatoin Start ** //  

  await deleteNotification({ type: { $in: ["reply", "like", "dislike"] }, post: postId, comment: commentId, reply: replyId })

  // **  Notificatoin End ** //


  return apiResponse(res, httpStatus.OK, { data, message: "Reply deleted successfully." });
});

// Reactions

const postReactionLocks = {};
const togglePostReaction = catchAsync(async (req, res) => {
  const { postId, userId, type } = req.body;

  if (!postReactionLocks[`${userId}-${postId}`]) {
    postReactionLocks[`${userId}-${postId}`] = true;

    const post = await PostModel.findOne({ _id: postId, status: PostStatus.active });
    if (!post) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Post not found." });

    const isPostOwner = post.user.toString() === userId;
    const existingReaction = post.reactions.find((reaction) => reaction?.user.toString() === userId);
    const latestPoint = await PointModel.findOne({ user: post.user }).sort({ createdAt: -1 });
    let cumulativePoints = 0;
    if (latestPoint) cumulativePoints = latestPoint.cumulativePoints;

    if (!existingReaction) {
      if (!isPostOwner) {
        if (type === ReactionType.like) {
          await PointModel.create({
            user: post.user,
            context: "post_like",
            points: 1,
            cumulativePoints: cumulativePoints + 1,
            interactorId: userId,
            postId,
          });
        } else if (type === ReactionType.dislike) {
          await PointModel.create({
            user: post.user,
            context: "post_dislike",
            points: -1,
            cumulativePoints: cumulativePoints - 1,
            interactorId: userId,
            postId,
          });
        }
      }
      post.reactions.push({ user: userId, type });
    } else {
      if (existingReaction.type === type) {
        post.reactions = post.reactions.filter((reaction) => reaction?.user.toString() !== userId);

        if (!isPostOwner) {
          if (type === ReactionType.like) {
            await PointModel.create({
              user: post.user,
              context: "post_like_remove",
              points: -1,
              cumulativePoints: cumulativePoints - 1,
              interactorId: userId,
              postId,
            });
          } else if (type === ReactionType.dislike) {
            await PointModel.create({
              user: post.user,
              context: "post_dislike_remove",
              points: 1,
              cumulativePoints: cumulativePoints + 1,
              interactorId: userId,
              postId,
            });
          }
        }
      } else {
        existingReaction.type = type;

        if (!isPostOwner) {
          if (type === ReactionType.like) {
            await PointModel.create({
              user: post.user,
              context: "dislike_remove_and_post_like",
              points: 2,
              cumulativePoints: cumulativePoints + 2,
              interactorId: userId,
              postId,
            });
          } else if (type === ReactionType.dislike) {
            await PointModel.create({
              user: post.user,
              context: "like_remove_and_post_dislike",
              points: -2,
              cumulativePoints: cumulativePoints - 2,
              interactorId: userId,
              postId,
            });
          }
        }
      }
    }

    post.reactionsCount = post.reactions.length
    await post.save();

    const data = await PostModel
      .findOne({ _id: postId })
      .populate({
        path: "user comments.user comments.replies.user",
        select: "username personal.fullname personal.profilePicture",
      })


    // **  Notificatoin Start ** //  

    const postOwnerUserId = data.user._id.toString()

    if (postOwnerUserId !== userId) {

      await createNotification({
        type,
        userId,
        postId,
        recipientId: data.user._id,
        message: `${type}d on your post.`
      })

      const deletedNotification = await NotificationModel.findOneAndDelete({ type: type === "like" ? "dislike" : "like", user: userId, post: postId, recipient: data.user._id });

      if (deletedNotification) {
        const connectUser = await UserConnectionModel
          .findOne({ userId: data.user._id })
          .select({ socketId: 1 });

        if (connectUser) {
          global.io.to(connectUser?.socketId).emit('removeNotification', deletedNotification);
        }
      }
    }

    // **  Notificatoin End ** //  


    delete postReactionLocks[`${userId}-${postId}`];
    return apiResponse(res, httpStatus.OK, { data, message: "Post reaction toggled successfully." });
  } else {
    return apiResponse(res, httpStatus.CONFLICT, { message: "Please wait." });
  }
});

const toggleCommentReaction = catchAsync(async (req, res) => {
  const { postId, commentId, userId, type } = req.body;

  const post = await PostModel.findOne({ _id: postId, status: PostStatus.active });
  if (!post) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Post not found." });

  const comment = post.comments.id(commentId);
  if (!comment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Comment not found." });

  const existingReaction = comment.reactions.find((reaction) => reaction.user.toString() === userId);

  if (!existingReaction) {
    comment.reactions.push({ user: userId, type });
  } else {
    if (existingReaction.type === type) {
      comment.reactions = comment.reactions.filter((reaction) => reaction.user.toString() !== userId);
    } else {
      existingReaction.type = type;
    }
  }

  await post.save();

  const data = await PostModel
    .findOne({ _id: postId })
    .populate({
      path: "user comments.user comments.replies.user",
      select: "username personal.fullname personal.profilePicture",
    })


  // **  Notificatoin Start ** //  

  const commentOwner = comment.user.toString()

  if (commentOwner !== userId) {

    await createNotification({
      type,
      userId,
      postId,
      commentId,
      recipientId: comment.user,
      message: `${type}d on your comment.`
    })

    const deletedNotification = await NotificationModel.findOneAndDelete({ type: type === "like" ? "dislike" : "like", user: userId, post: postId, comment: commentId, recipient: comment.user });

    if (deletedNotification) {
      const connectUser = await UserConnectionModel
        .findOne({ userId: comment.user })
        .select({ socketId: 1 });

      if (connectUser) {
        global.io.to(connectUser?.socketId).emit('removeNotification', deletedNotification);
      }
    }
  }

  // **  Notificatoin End ** //  


  return apiResponse(res, httpStatus.OK, { data, message: "Comment reaction toggled successfully." });
});

const toggleReplyReaction = catchAsync(async (req, res) => {
  const { postId, commentId, replyId, userId, type } = req.body;

  const post = await PostModel.findOne({ _id: postId, status: PostStatus.active });
  if (!post) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Post not found." });

  const comment = post.comments.id(commentId);
  if (!comment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Comment not found." });

  const reply = comment.replies.id(replyId);
  if (!reply) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Reply not found." });

  const existingReaction = reply.reactions.find((reaction) => reaction.user.toString() === userId);

  if (!existingReaction) {
    reply.reactions.push({ user: userId, type });
  } else {
    if (existingReaction.type === type) {
      reply.reactions = reply.reactions.filter((reaction) => reaction.user.toString() !== userId);
    } else {
      existingReaction.type = type;
    }
  }

  await post.save();

  const data = await PostModel
    .findOne({ _id: postId })
    .populate({
      path: "user comments.user comments.replies.user",
      select: "username personal.fullname personal.profilePicture",
    })


  // **  Notificatoin Start ** //  

  const replyOwner = reply.user.toString()

  if (replyOwner !== userId) {

    await createNotification({
      type,
      userId,
      postId,
      commentId,
      replyId,
      recipientId: reply.user,
      message: `${type}d on your reply.`
    })

    const deletedNotification = await NotificationModel.findOneAndDelete({ type: type === "like" ? "dislike" : "like", user: userId, post: postId, comment: commentId, reply: replyId, recipient: reply.user });

    if (deletedNotification) {
      const connectUser = await UserConnectionModel
        .findOne({ userId: reply.user })
        .select({ socketId: 1 });

      if (connectUser) {
        global.io.to(connectUser?.socketId).emit('removeNotification', deletedNotification);
      }
    }
  }

  // **  Notificatoin End ** //  


  return apiResponse(res, httpStatus.OK, { data, message: "Reply reaction toggled successfully." });
});

// Share Post

const sharePost = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const { body, accessibility } = req.body;

  const sharedPost = await PostModel.findOne({ _id: postId, status: PostStatus.active });
  if (!sharedPost) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Shared post does not exist." });

  const isShared = await PostModel.findOne({
    user: req.user.userId,
    $or: [{ share: postId }, { share: sharePost._id }],
    status: PostStatus.active
  });
  if (isShared) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Already shared this post." });

  if (sharedPost.accessibility !== AccessibilityType.public) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Private post cannot be shared." });
  if (sharedPost.share) sharedPost._id = sharedPost.share; // If a post contains sharedPost then the original post will be shared again

  const newPost = new PostModel({ user: req.user.userId, body, accessibility, share: sharedPost._id });
  const data = await newPost.save();

  const shares = await PostModel.find({ share: sharedPost._id, status: PostStatus.active });
  const post = await PostModel.findOne({ _id: sharedPost._id, status: PostStatus.active });
  post.shareCount = shares.length;
  await post.save();


  // **  Notificatoin Start ** // 

  await createNotification({
    type: NotificationType.share,
    userId: req.user.userId,
    postId,
    recipientId: sharedPost.user,
    message: `shared your post!!`
  })

  // **  Notificatoin End ** // 

  return apiResponse(res, httpStatus.OK, { data, message: "Post successfully shared." });
});

// Save Post

const getSavedPosts = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const postsCount = 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const skipCount = (page - 1) * postsCount;

  const savedPosts = await SavedPostModel
    .find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skipCount)
    .limit(postsCount)
    .populate({
      path: "user",
      select: "username personal.fullname personal.profilePicture",
    })
    .populate({
      path: "post",
      select: "",
      populate: {
        path: "user comments.user comments.replies.user",
        select: "username personal.fullname personal.profilePicture",
      },
    });

  return apiResponse(res, httpStatus.OK, { data: { savedPosts, page }, message: "Successfully retrieved saved posts." });
});

const getSavedPostById = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const savedPostId = req.params._id;

  const savedPost = await SavedPostModel
    .findOne({ _id: savedPostId, user: userId })
    .populate({
      path: "user",
      select: "username personal.fullname personal.profilePicture",
    })
    .populate({
      path: "post",
      select: "",
      populate: {
        path: "user comments.user comments.replies.user",
        select: "username personal.fullname personal.profilePicture",
      },
    });

  if (!savedPost) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Saved post not found." });
  }

  return apiResponse(res, httpStatus.OK, { data: savedPost, message: "Successfully retrieved saved post." });
});

const savePost = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const postId = req.params.postId;

  const data = await SavedPostModel.findOne({ user: userId, post: postId });
  if (data) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Post already has been saved." });

  const savedPost = new SavedPostModel({ user: userId, post: postId });
  await savedPost.save();

  const newSavedPost = await SavedPostModel.findById(savedPost._id)
    .populate({
      path: "user",
      select: "username personal.fullname personal.profilePicture",
    })
    .populate({
      path: "post",
      select: "",
      populate: {
        path: "user comments.user comments.replies.user",
        select: "username personal.fullname personal.profilePicture",
      },
    })
    .exec();


  return apiResponse(res, httpStatus.OK, { data: newSavedPost, message: "Post successfully saved." });
});

const unsavePost = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const postId = req.params.postId;

  const data = await SavedPostModel.findOne({ user: userId, post: postId });
  if (!data) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Saved post does not exist." });

  await SavedPostModel.deleteOne({ user: userId, post: postId });

  return apiResponse(res, httpStatus.OK, { data, message: "Post successfully unsaved." });
});

// Report Post

const reportPost = catchAsync(async (req, res) => {
  const { reportedPost, reportBody, reportType } = req.body;

  const data = await ReportedPostModel.findOne({ reportedPost, reporter: req.user.userId });
  if (data) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "You have already reported this post" });

  const report = new ReportedPostModel({
    reportedPost,
    reporter: req.user.userId,
    reportBody,
    reportType,
  });

  await report.save();

  return apiResponse(res, httpStatus.OK, { message: "Post successfully reported." });
});

// Newsfeed

const getNewsfeed = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const connections = await ConnectionModel.find({
    follower: userId,
    status: ConnectionStatus.accepted,
  });

  const followeeIds = connections.map((connection) => connection.followee);

  // followeeIds.push(userId);

  const postsCount = 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const skipCount = (page - 1) * postsCount;

  let data = []
  if (followeeIds.length === 0) {
    data = await PostModel
      .find({ status: PostStatus.active })
      .sort({ createdAt: -1 })
      .skip(skipCount)
      .limit(postsCount)
      .populate({
        path: "user comments.user comments.replies.user",
        select: "username personal.fullname personal.profilePicture",
      })
      .populate({
        path: "share",
        select: "",
        populate: {
          path: 'user comments.user comments.replies.user',
          select: "username personal.fullname personal.profilePicture",
        }
      })
  } else {
    data = await PostModel
      .find({ user: { $in: followeeIds }, status: PostStatus.active })
      .sort({ createdAt: 1 })
      .skip(skipCount)
      .limit(postsCount)
      .populate({
        path: "user comments.user comments.replies.user",
        select: "username personal.fullname personal.profilePicture",
      })
      .populate({
        path: "share",
        select: "",
        populate: {
          path: 'user comments.user comments.replies.user',
          select: "username personal.fullname personal.profilePicture",
        }
      })
  }

  let newData = [];
  data.map(each => {
    if (each.share && (each.share.status !== 'active' || each.share.accessibility !== 'public')) {
      each = each.toJSON();
      delete each.share;
      each.share = 'No Content';
    }
    newData.push(each);
  })

  return apiResponse(res, httpStatus.OK, { data: { data: newData, page }, message: "Successfully retrieved newsfeed posts." });
});

module.exports = {
  getPosts, getPostsByUser,
  getPost, addPost, updatePost, deletePost,
  addComment, updateComment, deleteComment,
  addReply, updateReply, deleteReply,
  togglePostReaction, toggleCommentReaction, toggleReplyReaction,
  sharePost,
  getSavedPosts, getSavedPostById, savePost, unsavePost,
  reportPost,
  getNewsfeed,
};
