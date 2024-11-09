const express = require("express");
const router = express.Router();

const {
    sendFollowRequest, acceptFollowRequest, declineFollowRequest, cancelFollowRequest, unfollow, removeFollower,
    getFollowersList, getFollowingList, getFollowRequestsList, getFollowSuggestionsList,
} = require("../../controllers/frontend/connection.controller");

const { isAuthenticated } = require("../../middlewares/auth.middleware");

router.post("/send-follow-request/:followeeId", isAuthenticated, sendFollowRequest);
router.post("/accept-follow-request/:connectionId", isAuthenticated, acceptFollowRequest);
router.post("/decline-follow-request/:connectionId", isAuthenticated, declineFollowRequest);
router.post("/cancel-follow-request/:connectionId", isAuthenticated, cancelFollowRequest);
router.post("/unfollow/:followeeId", isAuthenticated, unfollow);
router.post("/remove-follower/:followerId", isAuthenticated, removeFollower);

router.get("/list/get-followers/:userId", isAuthenticated, getFollowersList);
router.get("/list/get-following/:userId", isAuthenticated, getFollowingList);
router.get("/list/get-follow-requests", isAuthenticated, getFollowRequestsList);
router.get("/list/get-follow-suggestions", isAuthenticated, getFollowSuggestionsList);


module.exports = router;