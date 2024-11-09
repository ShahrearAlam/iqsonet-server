const express = require("express");
const router = express.Router();

const {
    getPostReports, getPostReportById, removePostReport,
    banReportedPost, deleteReportedPost
} = require("../../controllers/backend/posts.controller");

const { isAuthenticated } = require("../../middlewares/auth.middleware");

router.get("/reports", isAuthenticated, getPostReports);
router.get("/reports/:reportId", isAuthenticated, getPostReportById);
router.delete("/reports/:reportId", isAuthenticated, removePostReport);

router.post("/reported_post/ban/:reportId", isAuthenticated, banReportedPost);
router.delete("/reported_post/delete/:reportId", isAuthenticated, deleteReportedPost);

module.exports = router;