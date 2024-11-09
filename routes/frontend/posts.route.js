const express = require("express");
const router = express.Router();

const {
    getPosts, getPostsByUser, 
    getPost, addPost, updatePost, deletePost,
    addComment, updateComment, deleteComment,
    addReply, updateReply, deleteReply,
    togglePostReaction, toggleCommentReaction, toggleReplyReaction,
    sharePost,
    getSavedPosts, getSavedPostById, savePost, unsavePost,
    reportPost,
    getNewsfeed,
} = require("../../controllers/frontend/posts.controller");

const { isAuthenticated } = require("../../middlewares/auth.middleware");

router.get("/get-posts", isAuthenticated, getPosts); // posts of logged-in user
router.get("/get-posts/:userId", isAuthenticated, getPostsByUser); // posts of the user of userId

router.get("/get-post/:postId", isAuthenticated, getPost);
router.post("/add-post", isAuthenticated, addPost);
router.put("/update-post/:postId", isAuthenticated, updatePost);
router.delete("/delete-post/:postId", isAuthenticated, deletePost);

router.post("/add-comment", isAuthenticated, addComment);
router.post("/update-comment", isAuthenticated, updateComment);
router.post("/delete-comment", isAuthenticated, deleteComment);

router.post("/add-reply", isAuthenticated, addReply);
router.post("/update-reply", isAuthenticated, updateReply);
router.post("/delete-reply", isAuthenticated, deleteReply);

router.post("/post-reaction", isAuthenticated, togglePostReaction);
router.post("/comment-reaction", isAuthenticated, toggleCommentReaction);
router.post("/reply-reaction", isAuthenticated, toggleReplyReaction);

// Share Post
router.post("/share-post/:postId", isAuthenticated, sharePost);

// Save Post
router.get("/saved", isAuthenticated, getSavedPosts);
router.get("/saved/:_id", isAuthenticated, getSavedPostById);
router.post("/save/:postId", isAuthenticated, savePost);
router.delete("/unsave/:postId", isAuthenticated, unsavePost);

// Report Post
router.post("/report", isAuthenticated, reportPost);

// Newsfeed
router.get("/get-newsfeed", isAuthenticated, getNewsfeed);

module.exports = router;