const express = require("express");
const ApiError = require("../utils/apiError");
const apiResponse = require("../utils/apiResponse");
const httpStatus = require("http-status");

const router = express.Router();

const beUsersRoute = require("./backend/users.route");
const bePostsRoute = require("./backend/posts.route");

const feAuthRoute = require("./frontend/auth.route");
const feProfileRoute = require("./frontend/profile.route");
const fePostsRoute = require("./frontend/posts.route");
const feConnectionRoute = require("./frontend/connection.route");
const feCommunity = require("./frontend/community.route");
const feSearchRoute = require("./frontend/search.route");
const feNotificationsRoutes = require("./frontend/notification.route");
const feJobPostsRoutes = require("./frontend/jobPost.route");

router.use("/backend/users", beUsersRoute);
router.use("/backend/posts", bePostsRoute);

router.use("/frontend/auth", feAuthRoute);
router.use("/frontend/profile", feProfileRoute);
router.use("/frontend/posts", fePostsRoute);
router.use("/frontend/connection", feConnectionRoute);
router.use("/frontend/community", feCommunity);
router.use("/frontend/search", feSearchRoute);
router.use("/frontend/notifications", feNotificationsRoutes);
router.use("/frontend/jobPost", feJobPostsRoutes);

router.use((req, res, next) => {
    const error = new ApiError(httpStatus.NOT_FOUND);
    return next(error);
});

router.use((error, req, res, next) => {
    const status = error.statusCode || res.statusCode || 500;
    const stack = error.stack;

    return apiResponse(res, status, error.message, stack);
});

module.exports = router;