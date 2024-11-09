const express = require("express");
const router = express.Router();

const { isAuthenticated } = require("../../middlewares/auth.middleware");
const imageUpload = require("../../utils/imageUpload");
const { createCommunity, getAllCommunity, getCommunity, sendCommunityJoinRequest, getAllCommunityRequest, requestCommunityAction } = require("../../controllers/frontend/community.controller");

router.post(
  "/create-community",
  isAuthenticated,
  imageUpload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  createCommunity
);

router.get(
  "/all-community",
  isAuthenticated,
  getAllCommunity
);

router.get(
  "/:id",
  isAuthenticated,
  getCommunity
);

router.patch(
  "/:id",
  isAuthenticated,
  sendCommunityJoinRequest
);

router.get(
  "/requests/:id",
  isAuthenticated,
  getAllCommunityRequest
);

router.patch(
  "/requests/:id",
  isAuthenticated,
  requestCommunityAction
);

module.exports = router;
